/* created by @sanyabeast 8/14/2021 1:57:45 AM
 *
 *
 */

import * as THREE from 'three';
import { log, error, get_query_string_params, get_app_name, mixin_object, get_unique_props, is_none, schema_validate, camel_to_snake, is_inline_dict, parse_inline_dict, console, get_most_suitable_dict_keys } from "core/utils/Tools";
import { isObject, isArray, merge, forEach, isString, isUndefined, isFunction, keys, values, set, map, filter } from "lodash-es";
import GameObject from 'core/GameObject';
import Schema from "core/utils/Schema"
import RenderTarget from "core/components/scene/RenderTarget"
import BasicObject from "core/BasicObject"
import AssetBufferGeometry from 'core/geometry/classes/AssetBufferGeometry';
import DataComputed from "core/utils/DataComputed";
import SCHEMA_CORE from "core/SCHEMA.yaml"


const SCHEMA_APP = require(`apps/${process.env.APP_NAME}/SCHEMA.yaml`)

class RmDict {
    constructor(data) {
        forEach(data, (v, k) => {
            this[k] = v;
        })
    }
}

class GlobalsDict extends RmDict { }
class CachedDataDict extends RmDict { }
class TemplatesDataDict extends RmDict { }
class ClassesDataDict extends RmDict { }

let rm = undefined
class ResourceManager extends BasicObject {
    static singleton = undefined
    constructor() {
        super(...arguments)
        if (ResourceManager.singleton instanceof ResourceManager) {
            return ResourceManager.singleton
        }
        this.globals = new GlobalsDict({
            stage: undefined,
            dom_rect: { left: 0, top: 0, width: 1, height: 1 },
            uniforms: {
                bc: { value: new THREE.Vector2(0, 1), type: "v2" },
                time: { value: 0, type: "f" },
                resolution: { value: new THREE.Vector2(1, 1), type: "v2" },
                resolution2: { value: new THREE.Vector2(0.001, 0.001), type: "v2" },
                pixel_ratio: { value: window.devicePixelRatio, type: "f" },
                mouse: { value: new THREE.Vector2(0, 0), type: "v2" },
                camera_pos: { value: new THREE.Vector3(), type: "v3" },
            },
            get resolution() {
                return this.uniforms.resolution.value;
            },
            get pixel_ratio() {
                return this.uniforms.pixel_ratio.value;
            },
            get mouse() {
                return this.uniforms.mouse.value;
            },
            mouse: null
        })
        ResourceManager.singleton = this;
        forEach(SCHEMA_CORE, (v, k) => Schema.register(k, v))
        forEach(SCHEMA_APP, (v, k) => Schema.register(k, v))
        let asset_stats = this.asset_stats = {
            components_count: 0,
            prefabs_count: 0,
            materials_count: 0,
            geometries_count: 0,
        }
        this.loaders = {
            cubemap: new THREE.CubeTextureLoader()
        }
        const classes_of_objects = this.classes_of_objects = THREE.objects = new ClassesDataDict()
        const classes_of_materials = this.classes_of_materials = THREE.materials = new ClassesDataDict({
            MeshBasicMaterial: THREE.MeshBasicMaterial,
            MeshDistanceMaterial: THREE.MeshDistanceMaterial,
            MeshDepthMaterial: THREE.MeshDepthMaterial,
            MeshLambertMaterial: THREE.MeshLambertMaterial,
            MeshMatcapMaterial: THREE.MeshMatcapMaterial,
            MeshNormalMaterial: THREE.MeshNormalMaterial,
            MeshPhongMaterial: THREE.MeshPhongMaterial,
            MeshPhysicalMaterial: THREE.MeshPhysicalMaterial,
            MeshStandardMaterial: THREE.MeshStandardMaterial,
            MeshToonMaterial: THREE.MeshToonMaterial,
            PointsMaterial: THREE.PointsMaterial,
            ShaderMaterial: THREE.ShaderMaterial,
            SpriteMaterial: THREE.SpriteMaterial,
            LineDashedMaterial: THREE.LineDashedMaterial
        })
        const classes_of_geometries = this.classes_of_geometries = THREE.geometries = new ClassesDataDict({
            BoxBufferGeometry: THREE.BoxBufferGeometry,
            ConeBufferGeometry: THREE.ConeBufferGeometry,
            RingBufferGeometry: THREE.RingBufferGeometry,
            TextBufferGeometry: THREE.TextBufferGeometry,
            TubeBufferGeometry: THREE.TubeBufferGeometry,
            LatheBufferGeometry: THREE.LatheBufferGeometry,
            PlaneBufferGeometry: THREE.PlaneBufferGeometry,
            ShapeBufferGeometry: THREE.ShapeBufferGeometry,
            TorusBufferGeometry: THREE.TorusBufferGeometry,
            CircleBufferGeometry: THREE.CircleBufferGeometry,
            SphereBufferGeometry: THREE.SphereBufferGeometry,
            ExtrudeBufferGeometry: THREE.ExtrudeBufferGeometry,
            CylinderBufferGeometry: THREE.CylinderBufferGeometry,
            InstancedBufferGeometry: THREE.InstancedBufferGeometry,
            OctahedronBufferGeometry: THREE.OctahedronBufferGeometry,
            ParametricBufferGeometry: THREE.ParametricBufferGeometry,
            PolyhedronBufferGeometry: THREE.PolyhedronBufferGeometry,
            BoxGeometry: THREE.BoxBufferGeometry,
            ConeGeometry: THREE.ConeBufferGeometry,
            RingGeometry: THREE.RingBufferGeometry,
            TextGeometry: THREE.TextBufferGeometry,
            TubeGeometry: THREE.TubeBufferGeometry,
            LatheGeometry: THREE.LatheBufferGeometry,
            PlaneGeometry: THREE.PlaneBufferGeometry,
            ShapeGeometry: THREE.ShapeBufferGeometry,
            TorusGeometry: THREE.TorusBufferGeometry,
            CircleGeometry: THREE.CircleBufferGeometry,
            SphereGeometry: THREE.SphereBufferGeometry,
            ExtrudeGeometry: THREE.ExtrudeBufferGeometry,
            CylinderGeometry: THREE.CylinderBufferGeometry,
            InstancedGeometry: THREE.InstancedBufferGeometry,
            OctahedronGeometry: THREE.OctahedronBufferGeometry,
            ParametricGeometry: THREE.ParametricBufferGeometry,
            PolyhedronGeometry: THREE.PolyhedronBufferGeometry,
        })
        this.Schema = Schema
        this.SCHEMA_CORE = SCHEMA_CORE
        this.SCHEMA_APP = SCHEMA_APP

        this.cached_spine_data = new CachedDataDict()
        this.cached_spine_skeleton_data = new CachedDataDict()
        this.cached_textures = new CachedDataDict();
        this.cached_geometries = new CachedDataDict();
        this.cached_materials = new CachedDataDict();
        this.cached_streamed_textures = new CachedDataDict()
        this.cached_images = new CachedDataDict()
        this.gameobject_refs = new RmDict()
        this.templates_of_materials = new TemplatesDataDict()
        this.templates_of_geometries = new TemplatesDataDict()
        /**comps */
        this.components_tags = new RmDict()
        this.components_instances = new RmDict()
        this.classes_of_components = new ClassesDataDict()
        this.defined_globals = new RmDict()
        /**vue */
        this.vuex_stores = new RmDict()

        /**loading texture placeholder */
        let placeholder_texture = this.placeholder_texture = this.load_texture("res/core/uv_checker_b.jpg")
        placeholder_texture.is_placeholder = true


        window.F_THREE_PATCH_PROPS = (o) => {
            o.globals = rm.globals;
        };
        window.F_BROADCAST_HOOK = () => {
            console.log("BRDCST HOOK ")
        }
        window.F_PATCH_COMP_PROPS = (o) => {
            o.globals = rm.globals;
        }
        window.F_THREE_PATCH_UNIFORMS = (uniforms, object) => {
            for (let k in rm.globals.uniforms) {
                uniforms[k] = {
                    type: rm.globals.uniforms[k].type,
                    value: new DataComputed(() => {
                        return rm.globals.uniforms[k].value;
                    }, 4),
                };
            }
            uniforms.object_position = {
                type: "v3",
                value: new DataComputed(() => {
                    return object.position;
                }),
            };
        };
        this.log("created");
    }
    get_asset_stats() { return this.asset_stats; }
    get_material_template(template_name) {
        return this.templates_of_materials[template_name]
    }
    create_material_with_template(template_name, params, id) {
        template_name = template_name.replace("@", "");
        if (!this.templates_of_materials[template_name]) {
        }
        let template_data = this.templates_of_materials[template_name]
        template_data = this.mixin_object(template_data)
        if (params) {
            for (let k in params) {
                set(template_data.params, k, params[k])
            }
            /*@TODO: disables THREE material caching*/
            if (typeof template_data.params.vertexShader === "string") {
                template_data.params.vertexShader = `#define RANDOM_FLOAT ${Math.random()}\n${template_data.params.vertexShader}\n`
            }
            if (typeof template_data.params.fragmentShader === "string") {
                template_data.params.fragmentShader = `#define RANDOM_FLOAT ${Math.random()}\n${template_data.params.fragmentShader}\n`
            }
        }
        if (isObject(template_data.params.uniforms)) {
            for (let name in template_data.params.uniforms) {
                let uniform = template_data.params.uniforms[name]
                console.log(uniform)
                if (uniform.type === "v3" && isArray(uniform.value)) {
                    uniform.value = new THREE.Vector3(...uniform.value)
                }
                if (uniform.type === "v2" && isArray(uniform.value)) {
                    uniform.value = new THREE.Vector2(...uniform.value)
                }
            }
        }
        let mat = new THREE.materials[template_data.type](template_data.params);
        return mat
    }
    mixin_object(data, mixins = []) {
        let r = data
        let merged_mixins = [data, ...mixins]
        let data_type = Schema.get_type_name(data)
        switch (data_type) {
            case "object": {
                r = {}
                if (data.prefab) {
                    let prefab_id = data.prefab
                    let prefab_template = this.load_prefab(prefab_id)
                    data = {
                        ...data,
                        prefab: undefined
                    }
                    data = this.mixin_object(prefab_template, [data])
                    merged_mixins[0] = data
                }
                if (data.prefabs) {
                    let prefab_mixins = []
                    data.prefabs.forEach(prefab_id => {
                        let prefab_template = this.load_prefab(prefab_id)
                        prefab_mixins.push(prefab_template)
                    })
                    data = {
                        ...data,
                        prefabs: undefined
                    }
                    data = this.mixin_object(data, [...prefab_mixins, data])
                    merged_mixins[0] = data
                }
                let keys = get_unique_props(merged_mixins)
                keys.forEach(k => {
                    r[k] = this.mixin_object(data[k], map(mixins, m => isObject(m) ? m[k] : undefined))
                })
                break
            }
            case "array": {
                r = []
                data.forEach((item, index) => {
                    r[index] = this.mixin_object(item, map(mixins, m => isArray(m) ? m[index] : undefined))
                })
                break
            }
            case "string": {
                data = this.resolve_string_placeholders(data)
                if (is_inline_dict(data)) {
                    let inline_dict = parse_inline_dict(data)
                    r = this.mixin_object(inline_dict)
                    break
                }
            }
            default: {
                r = data
                for (let a = merged_mixins.length - 1; a >= 0; a--) {
                    let mv = merged_mixins[a]
                    if (isString(mv)) {
                        mv = this.resolve_string_placeholders(mv)
                    }
                    if (!is_none(mv)) {
                        r = mv
                        break
                    }
                }
            }
        }
        return r
    }
    create_material(type, params, id) {
        if (typeof params === "object" && Array.isArray(params) && params.type && params.params) {
            return this.create_material(type, [params.type, params.params], id);
        }
        let mat = this.cached_materials[id];
        if (mat === undefined || id === undefined) {
            if (type.indexOf("@") === 0) {
                mat = this.create_material_with_template(type, params, id);
            } else {
                if (THREE.materials[type] === undefined) {
                    console.error(`Cannot find constructor for material "${type}"`)
                } else {
                    mat = new THREE.materials[type](params)
                }
            }

            if (id !== undefined) {
                this.cached_materials[id] = mat;
            }
        }
        return mat;
    }
    load_obj_geometry(src, scale) {
        let geometry = new AssetBufferGeometry(src, scale)
        return geometry
    }
    create_geometry_with_template(type, params, id) {
        let template_name = type.replace("@", "");
        let template_data = this.templates_of_geometries[template_name];
        let args = template_data?.params?.args ?? [];
        let scale = template_data?.params.scale ?? [1, 1, 1]
        params?.forEach((v, i) => {
            args[i] = v;
        });
        let geometry = this.create_geometry(template_data.type, args, id);
        geometry.scale(scale[0], scale[1], scale[2])
        return geometry;
    }
    create_obj_geometry(type, scale, id) {
        let src = type.replace("url:", "");
        let geometry = this.load_obj_geometry(src, scale);
        return geometry
    }
    create_geometry(type, params, id) {
        if (typeof params === "object" && params.type && params.params) {
            return this.create_geometry(type, [params.type, params.params], id);
        }
        let g = this.cached_geometries[id];
        if (g === undefined || id === undefined) {
            if (type.indexOf("@") === 0)
                return this.create_geometry_with_template(type, params, id);
            if (type.indexOf("url:") === 0)
                return this.create_obj_geometry(type, params, id);
            if (THREE.geometries[type] === undefined) {
                console.error("this", `cannot find geometry class "${type}"`)
            } else {
                g = new THREE.geometries[type](...params);
            }
            if (id !== undefined) {
                this.cached_geometries[id] = g;
            }
        }
        return g;
    }
    load_from_texture_lib(src, params) {
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
    load_texture(src, params) {
        let texture = this.cached_textures[src];
        if (!texture) {
            if (src.indexOf("@") === 0) {
                texture = this.cached_textures[src] = this.load_from_texture_lib(src, params)
            } else {
                let webgl_capabilities = this.globals.webgl_capabilities
                let aniso = 1
                if (webgl_capabilities) {
                    aniso = webgl_capabilities.getMaxAnisotropy()
                }
                texture = this.cached_textures[src] = new THREE.TextureLoader().load(src);
                texture.anisotropy = aniso
            }
        }
        if (!texture) {
            texture = this.placeholder_texture
        } else {
            for (let k in params) {
                set(texture, k, params[k])
            }
            texture.needsUpdate = true;
        }


        return texture;
    }
    load_cubemap(src, type = "jpg") {
        let texture = this.loaders.cubemap.load([
            `${src}/posx.${type}`,
            `${src}/negx.${type}`,
            `${src}/posy.${type}`,
            `${src}/negy.${type}`,
            `${src}/posz.${type}`,
            `${src}/negz.${type}`
        ])

        return texture
    }
    texture_stream_function(url) {
        let texture
        // console.log(url)
        if (url.startsWith("rt:")) {
            let render_target_id = url.replace("rt:", "")
            let render_target_state = RenderTarget.list[render_target_id]

            if (render_target_state !== undefined) {
                return render_target_state.texture
            }
        } else {
            texture = this.cached_streamed_textures[url]

            if (!texture) {
                let params = get_query_string_params(url.split("?")[1] || "")
                let src = url.split("?")[0]
                texture = this.load_texture(src, params)
                if (texture.is_placeholder !== true) {
                    this.cached_streamed_textures[url] = texture
                }
            }
        }

        if (!texture) {
            texture = this.placeholder_texture
        }
        return texture

    }
    load_image(src) {
        return new Promise((resolve) => {
            let image = this.cached_images[src]
            if (image !== undefined) {
                resolve(image)
            } else {
                image = new Image()
                image.src = src
                image.onload = () => {
                    this.cached_images[src] = image
                    resolve(image)
                }
            }

        })
    }
    resolve_string_placeholders(data) {
        data = data.replace("{{APP_NAME}}", process.env.APP_NAME)
        return data
    }
    load_prefab(id, params) {
        id = this.resolve_string_placeholders(id)

        let suitable_prefabs = get_most_suitable_dict_keys(this.templates_of_prefabs, id)
        if (suitable_prefabs.length > 1) {
            this.error(`ambiguity when tried to load prefab with alias "${id}". got multiple candidates: ${suitable_prefabs.join(", ")}`)
        } else if (suitable_prefabs.length === 1) {
            id = suitable_prefabs[0]
        }

        if (this.templates_of_prefabs[id] === undefined) {
            throw new Error(`no prefab with id "${id} found"`)
        }

        let prefab_template = this.templates_of_prefabs[id]
        let prefab = this.mixin_object(prefab_template)
        for (let k in params) {
            set(prefab, k, params[k])
        }
        return prefab
    }
    /**ASSET PRELOADERS */
    preload_context(context, handler, do_resolve = true) {
        context.keys().forEach((p) => {
            if (do_resolve) {
                handler(p, context(p))
            } else {
                handler(p)
            }
        });
    }
    preload_classes(ns, context, category) {
        this.preload_context(context, (p, mod) => {
            let name = p.replace("./", "").replace(".js", "");
            THREE[category] = THREE[category] || {}
            THREE[category][name] = mod.default
            this[`classes_of_${category}`] = this[`classes_of_${category}`] || {}
            this[`classes_of_${category}`][name] = mod.default
        })
    }
    preload_textures(ns, context) {
        this.textures_lib = this.textures_lib || {}
        this.preload_context(context, (p, mod) => {
            let name = p.replace("./", "").replace(".png", "");
            let data = require(`base64-image-loader!./textures/${name}.png`)
            this.textures_lib[name] = data = {
                base64: data
            }
        }, false)
    }
    preload_textures2(ns, context) {
        this.textures_lib = this.textures_lib || {}
        this.preload_context(context, (p, mod) => {
            let name = p.replace("./", "").replace(".yaml", "").replace(/\//gm, ".");
            let data = mod
            this.textures_lib[name] = data
        })
    }
    preload_components(ns, context) {
        this.preload_context(context, (p, mod) => {
            this.asset_stats.components_count++;

            let name = p.replace("./", "").replace(".js", "").replace(/\//gm, ".");
            name = name.split(".")[name.split(".").length - 1]

            let creator = mod.default

            if (isObject(creator) || isFunction(creator)) {
                let default_prefab = {
                    components: {
                        [camel_to_snake(name)]: {
                            name: name,
                            enabled: true,
                            params: isObject(creator.DEFAULT) ? { ...creator.DEFAULT } : {}
                        }
                    }
                }

                this.register_prefab(`default.${name}`, default_prefab)
                this.register_component(creator, name);
            } else {
                error(`this`, `failed to preload component "${ns}.${name}". Unknown type: "${typeof creator}"`)
            }


        })
    }
    preload_templates_of_shader_parts(ns, context) {
        this.templates_of_shader_parts = this.templates_of_shader_parts || {}

        this.preload_context(context, (p, mod) => {
            let name = p.replace("./", "").replace(".yaml", "").replace(/\//gm, ".");
            this.templates_of_shader_parts[`${ns}.${name}`] = mod;
        })
    }
    preload_materials(ns, context) {
        let templates_of_materials = this.templates_of_materials

        this.preload_context(context, (p, mod) => {
            let name = p.replace("./", "").replace(".yaml", "").replace(/\//gm, ".");
            this.asset_stats.materials_count++
            let template = templates_of_materials[`${ns}.${name}`] = mod;
            if (template.params) {
                let shader_lib_uniforms = THREE.ShaderLib[template.params.extend]
                shader_lib_uniforms = shader_lib_uniforms !== undefined ? shader_lib_uniforms.uniforms : {}
                let uniforms = {
                    ...shader_lib_uniforms,
                    ...(template.params.uniforms || {}),
                }

                template.params.fragmentShader = this.preprocess_shader_code(template.params.fragmentShader, uniforms)
                template.params.vertexShader = this.preprocess_shader_code(template.params.vertexShader, uniforms)
            }
        })
    }
    preload_geometries(ns, context) {
        this.preload_context(context, (p, mod) => {
            let name = p.replace("./", "").replace(".yaml", "").replace(/\//gm, ".");
            this.asset_stats.geometries_count++
            this.templates_of_geometries[`${ns}.${name}`] = mod;
        })
    }
    preload_prefabs(ns, context) {
        this.templates_of_prefabs = this.templates_of_prefabs || { test: { test_prop1: 1, test_prop2: "hello" } }
        this.preload_context(context, (p, mod) => {
            let name = p.replace("./", "").replace(".yaml", "").replace(/\//gm, ".");
            let data = mod
            this.asset_stats.prefabs_count++
            this.register_prefab(`${ns}.${name}`, data)
        })
    }
    register_prefab(id, prefab) {
        let is_valid = Schema.validate(prefab, ":PREFAB", `[PREFAB:${id}]`)
        if (!is_valid) {
            console.error(`[this] cannot register prefab. preloaded prefab "${id}" does not match "PREFAB" schema`)
        }
        this.templates_of_prefabs = this.templates_of_prefabs || { test: { test_prop1: 1, test_prop2: "hello" } }
        this.templates_of_prefabs[id] = prefab
    }
    register_component(creator, name) {
        rm.classes_of_components[name] = creator
    }
    /**components` defined globals */
    define_global_var(owner_id, name, getter, setter) {
        if (!isString(owner_id)) {
            this.error(`failed to register global variable. plz provied owner id`, arguments)
            return
        }
        if (!isFunction(getter) || !isString(name)) {
            this.error("failed registering global variable: invalid params", arguments)
            return
        }
        this.defined_globals[owner_id] = this.defined_globals[owner_id] || {}
        this.defined_globals[owner_id][name] = {
            getter,
            setter
        }
        Object.defineProperty(this.globals, name, {
            get: getter,
            set: isFunction(setter) ? setter : undefined,
            configurable: true
        })
    }
    undefine_global_var(owner_id, name) {
        if (!isString(owner_id)) {
            this.error(`failed to ndefine global variable. plz provied owner id`, arguments)
            return
        }
        Object.defineProperty(this.globals, name, {
            get: undefined,
            set: undefined,
            configurable: true
        })
        delete this.globals[name]
        if (isObject(this.defined_globals[owner_id])) {
            delete this.defined_globals[owner_id][name]
        }
    }
    undefine_all_global_vars(owner_id) {
        if (!isString(owner_id)) {
            this.error(`failed to ndefine global variable. plz provied owner id`, arguments)
            return
        }
        if (isObject(this.defined_globals[owner_id])) {
            forEach(keys(this.defined_globals[owner_id]), (name) => {
                this.undefine_global_var(owner_id, name)
            })
        }
    }
    /**extras */
    preprocess_shader_code(code, uniforms) {
        let parts = this.templates_of_shader_parts
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

    get_component_instance(type, UUID) {
        return this.components_instances[type] ? this.components_instances[type][UUID] : undefined
    }
}

rm = new ResourceManager()
window.F_TEXTURE_STREAMING_FUNCTION = rm.texture_stream_function.bind(rm)

rm.preload_components("core", require.context("core/components/", true, /\.js$/))
rm.preload_classes("core", require.context("core/materials/classes", true, /\.js$/), "materials")
rm.preload_classes("core", require.context("core/geometry/classes", true, /\.js$/), "geometries")
rm.preload_classes("core", require.context("core/objects", true, /\.js$/), "objects")
rm.preload_textures("core", require.context("core/textures/", true, /\.png$/))
rm.preload_textures2("core", require.context("core/textures/", true, /\.yaml$/))
rm.preload_templates_of_shader_parts("core", require.context("core/materials/lib/", true, /\.yaml$/))
rm.preload_materials("core", require.context("core/materials/", true, /\.yaml$/))
rm.preload_geometries("core", require.context("core/geometry/", true, /\.yaml$/))
rm.preload_prefabs("core", require.context("core/prefabs/", true, /\.yaml$/))

if (isString(process.env.APP_NAME)) {
    rm.preload_components(process.env.APP_NAME, require.context(`apps/${process.env.APP_NAME}/components/`, true, /\.js$/))
    rm.preload_classes(process.env.APP_NAME, require.context(`apps/${process.env.APP_NAME}/materials/classes`, true, /\.js$/), "materials")
    rm.preload_classes(process.env.APP_NAME, require.context(`apps/${process.env.APP_NAME}/geometry/classes`, true, /\.js$/), "geometries")
    rm.preload_classes(process.env.APP_NAME, require.context(`apps/${process.env.APP_NAME}/objects`, true, /\.js$/), "objects")
    rm.preload_textures(process.env.APP_NAME, require.context(`apps/${process.env.APP_NAME}/textures/`, true, /\.png$/))
    rm.preload_textures2(process.env.APP_NAME, require.context(`apps/${process.env.APP_NAME}/textures/`, true, /\.yaml$/))
    rm.preload_templates_of_shader_parts(process.env.APP_NAME, require.context(`apps/${process.env.APP_NAME}/materials/lib/`, true, /\.yaml$/))
    rm.preload_materials(process.env.APP_NAME, require.context(`apps/${process.env.APP_NAME}/materials/`, true, /\.yaml$/))
    rm.preload_geometries(process.env.APP_NAME, require.context(`apps/${process.env.APP_NAME}/geometry/`, true, /\.yaml$/))
    rm.preload_prefabs(process.env.APP_NAME, require.context(`apps/${process.env.APP_NAME}/prefabs/`, true, /\.yaml$/))

} else {
    error("this", `failed to preload resource for app, invalid environment variable: process.env.APP_NAME=${process.env.APP_NAME}`)
}

rm.log("resources are preloaded")

if (process.env.NODE_ENV === "development") {
    window.rm = rm
}

export default rm;
