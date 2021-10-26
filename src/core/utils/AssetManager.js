/* created by @sanyabeast 8/14/2021 1:57:45 AM
 *
 *
 */

import * as THREE from 'three';
import { log, get_query_string_params, get_app_name, mixin_object, get_unique_props, is_none, schema_validate, camel_to_snake, is_inline_dict, parse_inline_dict } from "core/utils/Tools";
import { isObject, isArray, merge, forEach, isString } from "lodash-es";
import GameObject from 'core/GameObject';
import Schema from "core/utils/Schema"

import { set, map, filter } from "lodash-es";
import AssetBufferGeometry from '../geometry/classes/AssetBufferGeometry';
import SCHEMA_CORE from "core/SCHEMA.yaml"

const SCHEMA_APP = require(`apps/${process.env.APP_NAME}/SCHEMA.yaml`)
const schema_lib = {}
const cubemap_loader = new THREE.CubeTextureLoader();


let asset_stats = {
    components_count: 0,
    prefabs_count: 0,
    materials_count: 0,
    geometries_count: 0,
}


function process_shader_code(code, uniforms, parts) {
    if (typeof code === "string") {
        for (let k in parts) {
            code = code.replace(`#import ${k}`, parts[k].code)
            if (typeof parts[k].uniforms === "object") {
                let uo = parts[k].uniforms
                uniforms = {
                    ...uo,
                    ...uniforms
                }
            }
        }
        for (let s in THREE.ShaderChunk) {
            code = code.replace(`#include <${s}>`, THREE.ShaderChunk[s])
        }
    }
    return code
}

class AssetManager {
    static Schema = Schema
    static SCHEMA_CORE = SCHEMA_CORE
    static SCHEMA_APP = SCHEMA_APP
    static textures_cache = {};
    static cached_geometries = {};
    static cached_materials = {};
    static get_asset_stats() { return asset_stats; }
    static create_material_with_template(template_name, params, id) {
        template_name = template_name.replace("@", "");
        if (!AssetManager.material_templates[template_name]) {
        }
        let template_data = AssetManager.material_templates[template_name]

        template_data = AssetManager.mixin_object(template_data)

        if (params) {
            for (let k in params) {
                set(template_data.params, k, params[k])
            }

            /*@TODO: disables THREE material caching*/
            if (typeof template_data.params.vertexShader === "string") {
                template_data.params.vertexShader = `#define RANDOM_FLOAT ${Math.random()}\n${template_data.params.vertexShader}`
            }

            if (typeof template_data.params.fragmentShader === "string") {
                template_data.params.fragmentShader = `#define RANDOM_FLOAT ${Math.random()}\n${template_data.params.fragmentShader}`
            }

        }

        let mat = new THREE[template_data.type](template_data.params);
        return mat
    }
    static mixin_object(data, mixins = []) {
        let r = data
        let merged_mixins = [data, ...mixins]

        let data_type = Schema.get_type_name(data)

        switch (data_type) {
            case "object": {
                r = {}
                if (data.prefab) {
                    let prefab_id = data.prefab
                    let prefab_template = AssetManager.load_prefab(prefab_id)
                    data = {
                        ...data,
                        prefab: undefined
                    }
                    data = AssetManager.mixin_object(prefab_template, [data])
                    merged_mixins[0] = data
                }
                if (data.prefabs) {
                    let prefab_mixins = []
                    data.prefabs.forEach(prefab_id => {
                        let prefab_template = AssetManager.load_prefab(prefab_id)
                        prefab_mixins.push(prefab_template)
                    })
                    data = {
                        ...data,
                        prefabs: undefined
                    }
                    data = AssetManager.mixin_object(data, [...prefab_mixins, data])
                    merged_mixins[0] = data
                }
                let keys = get_unique_props(merged_mixins)
                keys.forEach(k => {
                    r[k] = AssetManager.mixin_object(data[k], map(mixins, m => isObject(m) ? m[k] : undefined))
                })

                break
            }
            case "array": {
                r = []
                data.forEach((item, index) => {
                    r[index] = AssetManager.mixin_object(item, map(mixins, m => isArray(m) ? m[index] : undefined))
                })
                break
            }
            case "string": {
                if (is_inline_dict(data)) {
                    let inline_dict = parse_inline_dict(data)
                    r = AssetManager.mixin_object(inline_dict)
                    break
                }
            }
            default: {
                r = data
                for (let a = merged_mixins.length - 1; a >= 0; a--) {
                    let mv = merged_mixins[a]
                    if (!is_none(mv)) {
                        r = mv
                        break
                    }
                }
            }
        }

        return r
    }
    static slick_merge(a, b) {
        AssetManager.for_each(b, (v, k) => (a[k] = v));
        return a;
    }
    static create_material(type, params, id) {
        if (typeof params === "object" && Array.isArray(params) && params.type && params.params) {
            return AssetManager.create_material(type, [params.type, params.params], id);
        }

        let mat = AssetManager.cached_materials[id];
        if (mat === undefined || id === undefined) {
            if (type.indexOf("@") === 0) {
                mat = this.create_material_with_template(type, params, id);
            } else {
                if (THREE[type] === undefined) {
                    console.error(`Cannot find constructor for material "${type}"`)
                } else {
                    mat = new THREE[type](params)
                }
            }

            if (id !== undefined) {
                AssetManager.cached_materials[id] = mat;
            }
        }
        return mat;
    }
    static load_type(type, ...args) {
        switch (type) {
            case "texture": {
                return AssetManager.load_texture(...args)
            }
            case "prefab": {
                return AssetManager.load_prefab(...args)
            }
        }
    }
    static load_obj_geometry(src, scale) {
        let geometry = new AssetBufferGeometry(src, scale)
        return geometry
    }
    static create_geometry_with_template(type, params, id) {
        let template_name = type.replace("@", "");
        let template_data = AssetManager.geometry_templates[template_name];
        let args = template_data?.params?.args ?? [];
        let scale = template_data?.params.scale ?? [1, 1, 1]
        params?.forEach((v, i) => {
            args[i] = v;
        });
        let geometry = AssetManager.create_geometry(template_data.type, args, id);
        geometry.scale(scale[0], scale[1], scale[2])
        return geometry;
    }
    static create_obj_geometry(type, scale, id) {
        let src = type.replace("url:", "");
        let geometry = this.load_obj_geometry(src, scale);
        return geometry
    }
    static create_geometry(type, params, id) {
        if (typeof params === "object" && params.type && params.params) {
            return AssetManager.create_geometry(type, [params.type, params.params], id);
        }
        let g = AssetManager.cached_geometries[id];
        if (g === undefined || id === undefined) {
            if (type.indexOf("@") === 0)
                return this.create_geometry_with_template(type, params, id);
            if (type.indexOf("url:") === 0)
                return this.create_obj_geometry(type, params, id);
            if (THREE[type] === undefined) {
                log("AssetManager", `cannot find geometry class "${type}"`)
            } else {
                g = new THREE[type](...params);
            }
            if (id !== undefined) {
                AssetManager.cached_geometries[id] = g;
            }
        }
        return g;
    }
    static load_from_texture_lib(src, params) {
        let name = src.replace("@", "")
        let image = new Image();
        let texture = new THREE.Texture();
        image.src = textures_lib[name].base64
        texture.image = image;
        image.onload = function () {
            for (let k in params) {
                texture[k] = params[k];
            }
            texture.needsUpdate = true;
        };
        return texture
    }
    static load_texture(src, params) {
        let texture = AssetManager.textures_cache[src];
        if (!texture) {
            if (src.indexOf("@") === 0) {
                texture = AssetManager.textures_cache[src] = AssetManager.load_from_texture_lib(src, params)
            } else {
                texture = AssetManager.textures_cache[src] =
                    new THREE.TextureLoader().load(src);
            }
        }

        for (let k in params) {
            set(texture, k, params[k])
        }

        texture.needsUpdate = true;
        return texture;
    }
    static load_cubemap(src, type = "jpg") {
        let texture = cubemap_loader.load([
            `${src}/posx.${type}`,
            `${src}/negx.${type}`,
            `${src}/posy.${type}`,
            `${src}/negy.${type}`,
            `${src}/posz.${type}`,
            `${src}/negz.${type}`
        ])

        return texture
    }
    static texture_stream_cache = {}
    static texture_stream_function(url) {
        let texture = AssetManager.texture_stream_cache[url]
        if (!texture) {
            let params = get_query_string_params(url.split("?")[1] || "")
            let src = url.split("?")[0]
            texture = AssetManager.texture_stream_cache[url] = AssetManager.load_texture(src, params)
        }

        return texture
    }
    static images_cache = {}
    static load_image(src) {
        return new Promise((resolve) => {
            let image = AssetManager.images_cache[src]
            if (image !== undefined) {
                resolve(image)
            } else {
                image = new Image()
                image.src = src
                image.onload = () => {
                    AssetManager.images_cache[src] = image
                    resolve(image)
                }
            }

        })
    }
    static resolve_string_placeholders(data) {
        data = data.replace("{app_name}", process.env.APP_NAME)
        return data
    }
    static load_prefab(id, params) {
        id = AssetManager.resolve_string_placeholders(id)
        if (AssetManager.prefab_lib[id] === undefined) {
            throw new Error(`no prefab with id "${id} found"`)
        }

        let prefab_template = AssetManager.prefab_lib[id]
        let prefab = AssetManager.mixin_object(prefab_template)
        for (let k in params) {
            set(prefab, k, params[k])
        }
        return prefab
    }
    /**ASSET PRELOADERS */
    static preload_context(context, handler, do_resolve = true) {
        context.keys().forEach((p) => {
            if (do_resolve) {
                handler(p, context(p))
            } else {
                handler(p)
            }
        });
    }
    static preload_classes(ns, context) {
        AssetManager.preload_context(context, (p, mod) => {
            let name = p.replace("./", "").replace(".js", "");
            THREE[name] = mod.default
        })
    }
    static preload_textures(ns, context) {
        AssetManager.textures_lib = AssetManager.textures_lib || {}
        AssetManager.preload_context(context, (p, mod) => {
            let name = p.replace("./", "").replace(".png", "");
            let data = require(`base64-image-loader!../textures/${name}.png`)
            AssetManager.textures_lib[name] = data = {
                base64: data
            }
        }, false)
    }
    static preload_textures2(ns, context) {
        AssetManager.textures_lib = AssetManager.textures_lib || {}
        AssetManager.preload_context(context, (p, mod) => {
            let name = p.replace("./", "").replace(".yaml", "").replace(/\//gm, ".");
            let data = mod
            AssetManager.textures_lib[name] = data
        })
    }
    static preload_components(ns, context) {
        AssetManager.preload_context(context, (p, mod) => {
            asset_stats.components_count++;

            let name = p.replace("./", "").replace(".js", "").replace(/\//gm, ".");

            let creator = mod.default
            let default_prefab = {
                components: {
                    [camel_to_snake(name)]: {
                        name: name,
                        enabled: true,
                        params: isObject(creator.DEFAULT) ? { ...creator.DEFAULT } : {}
                    }
                }
            }

            AssetManager.register_prefab(`default.${name}`, default_prefab)

            GameObject.register_component(creator, name);
        })
    }
    static preload_shader_parts(ns, context) {
        AssetManager.shader_parts = AssetManager.shader_parts || {}

        AssetManager.preload_context(context, (p, mod) => {
            let name = p.replace("./", "").replace(".yaml", "").replace(/\//gm, ".");
            AssetManager.shader_parts[`${ns}.${name}`] = mod;
        })
    }
    static preload_materials(ns, context) {
        AssetManager.material_templates = AssetManager.material_templates || {}
        let material_templates = AssetManager.material_templates

        AssetManager.preload_context(context, (p, mod) => {
            let name = p.replace("./", "").replace(".yaml", "").replace(/\//gm, ".");
            asset_stats.materials_count++
            material_templates[`${ns}.${name}`] = mod;
            if (material_templates[`${ns}.${name}`].params) {
                let shader_lib_uniforms = THREE.ShaderLib[material_templates[`${ns}.${name}`].params.extend]
                shader_lib_uniforms = shader_lib_uniforms !== undefined ? shader_lib_uniforms.uniforms : {}
                let uniforms = {
                    ...shader_lib_uniforms,
                    ...(material_templates[`${ns}.${name}`].params.uniforms || {}),
                }
                material_templates[`${ns}.${name}`].params.fragmentShader = process_shader_code(material_templates[`${ns}.${name}`].params.fragmentShader, uniforms, AssetManager.shader_parts)
                material_templates[`${ns}.${name}`].params.vertexShader = process_shader_code(material_templates[`${ns}.${name}`].params.vertexShader, uniforms, AssetManager.shader_parts)
            }
        })
    }
    static preload_geometries(ns, context) {
        AssetManager.geometry_templates = AssetManager.geometry_templates || {}

        AssetManager.preload_context(context, (p, mod) => {
            let name = p.replace("./", "").replace(".yaml", "").replace(/\//gm, ".");
            asset_stats.geometries_count++
            AssetManager.geometry_templates[`${ns}.${name}`] = mod;
        })
    }
    static preload_prefabs(ns, context) {
        AssetManager.prefab_lib = AssetManager.prefab_lib || { test: { test_prop1: 1, test_prop2: "hello" } }
        AssetManager.preload_context(context, (p, mod) => {
            let name = p.replace("./", "").replace(".yaml", "").replace(/\//gm, ".");
            let data = mod
            asset_stats.prefabs_count++
            AssetManager.register_prefab(`${ns}.${name}`, data)
        })
    }
    static register_prefab(id, prefab) {
        let is_valid = Schema.validate(prefab, ":PREFAB", `[PREFAB:${id}]`)
        if (!is_valid) {
            console.error(`[AssetManager] cannot register prefab. preloaded prefab "${id}" does not match "PREFAB" schema`)
        }
        AssetManager.prefab_lib = AssetManager.prefab_lib || { test: { test_prop1: 1, test_prop2: "hello" } }
        AssetManager.prefab_lib[id] = prefab
    }

}

for (let k in SCHEMA_CORE) {
    Schema.register(k, SCHEMA_CORE[k])
}

for (let k in SCHEMA_APP) {
    Schema.register(k, SCHEMA_APP[k])
}


AssetManager.preload_components("core", require.context("core/components/", true, /\.js$/))
AssetManager.preload_classes("core", require.context("core/materials/classes", true, /\.js$/))
AssetManager.preload_classes("core", require.context("core/geometry/classes", true, /\.js$/))
AssetManager.preload_textures("core", require.context("core/textures/", true, /\.png$/))
AssetManager.preload_textures2("core", require.context("core/textures/", true, /\.yaml$/))
AssetManager.preload_shader_parts("core", require.context("core/materials/lib/", true, /\.yaml$/))
AssetManager.preload_materials("core", require.context("core/materials/", true, /\.yaml$/))
AssetManager.preload_geometries("core", require.context("core/geometry/", true, /\.yaml$/))
AssetManager.preload_prefabs("core", require.context("core/prefabs/", true, /\.yaml$/))

window.F_TEXTURE_STREAMING_FUNCTION = AssetManager.texture_stream_function

if (process.env.APP_NAME === undefined) {
} else {
    AssetManager.preload_components(process.env.APP_NAME, require.context(`apps/${process.env.APP_NAME}/components/`, true, /\.js$/))
    AssetManager.preload_classes(process.env.APP_NAME, require.context(`apps/${process.env.APP_NAME}/materials/classes`, true, /\.js$/))
    AssetManager.preload_classes(process.env.APP_NAME, require.context(`apps/${process.env.APP_NAME}/geometry/classes`, true, /\.js$/))
    AssetManager.preload_textures(process.env.APP_NAME, require.context(`apps/${process.env.APP_NAME}/textures/`, true, /\.png$/))
    AssetManager.preload_textures2(process.env.APP_NAME, require.context(`apps/${process.env.APP_NAME}/textures/`, true, /\.yaml$/))
    AssetManager.preload_shader_parts(process.env.APP_NAME, require.context(`apps/${process.env.APP_NAME}/materials/lib/`, true, /\.yaml$/))
    AssetManager.preload_materials(process.env.APP_NAME, require.context(`apps/${process.env.APP_NAME}/materials/`, true, /\.yaml$/))
    AssetManager.preload_geometries(process.env.APP_NAME, require.context(`apps/${process.env.APP_NAME}/geometry/`, true, /\.yaml$/))
    AssetManager.preload_prefabs(process.env.APP_NAME, require.context(`apps/${process.env.APP_NAME}/prefabs/`, true, /\.yaml$/))
}

log("AssetManaget", "initialized");

if (process.env.NODE_ENV === "development") {
    window.AssetManager = AssetManager
}

export default AssetManager;
