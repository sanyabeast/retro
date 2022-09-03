/* created by @sanyabeast 8/14/2021 1:57:45 AM
 *
 *
 */

import {
    ShaderChunk,
    ShaderLib,
    Texture,
    TextureLoader,
    CubeTextureLoader,
    Audio,
    PositionalAudio,
    AudioListener,
    AudioLoader,
    Vector2,
    Vector3,
    MeshBasicMaterial,
    MeshDistanceMaterial,
    MeshDepthMaterial,
    MeshLambertMaterial,
    MeshMatcapMaterial,
    MeshNormalMaterial,
    MeshPhongMaterial,
    MeshPhysicalMaterial,
    MeshStandardMaterial,
    MeshToonMaterial,
    PointsMaterial,
    ShaderMaterial,
    SpriteMaterial,
    LineDashedMaterial,
    BoxBufferGeometry,
    ConeBufferGeometry,
    RingBufferGeometry,
    TextBufferGeometry,
    TubeBufferGeometry,
    LatheBufferGeometry,
    PlaneBufferGeometry,
    ShapeBufferGeometry,
    TorusBufferGeometry,
    CircleBufferGeometry,
    SphereBufferGeometry,
    ExtrudeBufferGeometry,
    CylinderBufferGeometry,
    InstancedBufferGeometry,
    OctahedronBufferGeometry,
    ParametricBufferGeometry,
    PolyhedronBufferGeometry,

} from 'three';
import { tools, log, error, get_query_string_params, get_app_name, mixin_object, get_unique_props, is_none, schema_validate, camel_to_snake, is_inline_dict, parse_inline_dict, console, get_most_suitable_dict_keys } from "retro/utils/Tools";
import { isObject, isArray, merge, forEach, isString, isUndefined, isFunction, keys, values, set, map, filter } from "lodash-es";
import Schema from "retro/utils/Schema"
import RenderTarget from "retro/components/scene/RenderTarget"
import AssetBufferGeometry from 'retro/geometry/classes/AssetBufferGeometry';
import DataComputed from "retro/utils/DataComputed";
import SCHEMA_CORE from "retro/SCHEMA.yaml"
import { PositionalAudioHelper } from 'three/examples/jsm/helpers/PositionalAudioHelper.js';
import ImageFilter from "retro/utils/ImageFilter"
import GameObject from "./GameObject"
import { Widgetation } from "./Widgetation"

function is_class_excluded_from_mixin(data) {
    let r = data.__proto__ !== window.Object.prototype
    return r
}

const SCHEMA_APP = require(`apps/${process.env.APP_NAME}/SCHEMA.yaml`)
const audio_loader = new AudioLoader();
const audio_listener = new AudioListener();
const image_filter = new ImageFilter()

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
class ResourceManager {
    static singleton = undefined
    TICK_ID = 0
    get tools() {
        return tools
    }
    log() {
        log('ResourceManager', ...arguments)
    }
    error() {
        error('ResourceManager', ...arguments)
    }
    constructor() {
        if (ResourceManager.singleton instanceof ResourceManager) {
            return ResourceManager.singleton
        }
        this.widgetation = new Widgetation()
        this.globals = new GlobalsDict({
            now: +new Date(),
            audio_listener,
            stage: undefined,
            dom_rect: { left: 0, top: 0, width: 1, height: 1 },
            uniforms: {
                bc: { value: new Vector2(0, 1), type: "v2" },
                time: { value: 0, type: "f" },
                time2: { value: 0, type: "f" },
                resolution: { value: new Vector2(1, 1), type: "v2" },
                resolution2: { value: new Vector2(0.001, 0.001), type: "v2" },
                pixel_ratio: { value: window.devicePixelRatio, type: "f" },
                mouse: { value: new Vector2(0, 0), type: "v2" },
                camera_pos: { value: new Vector3(), type: "v3" },
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
            cubemap: new CubeTextureLoader()
        }
        const classes_of_objects = this.classes_of_objects = new ClassesDataDict()
        const classes_of_materials = this.classes_of_materials = new ClassesDataDict({
            MeshBasicMaterial: MeshBasicMaterial,
            MeshDistanceMaterial: MeshDistanceMaterial,
            MeshDepthMaterial: MeshDepthMaterial,
            MeshLambertMaterial: MeshLambertMaterial,
            MeshMatcapMaterial: MeshMatcapMaterial,
            MeshNormalMaterial: MeshNormalMaterial,
            MeshPhongMaterial: MeshPhongMaterial,
            MeshPhysicalMaterial: MeshPhysicalMaterial,
            MeshStandardMaterial: MeshStandardMaterial,
            MeshToonMaterial: MeshToonMaterial,
            PointsMaterial: PointsMaterial,
            ShaderMaterial: ShaderMaterial,
            SpriteMaterial: SpriteMaterial,
            LineDashedMaterial: LineDashedMaterial
        })
        const classes_of_geometries = this.classes_of_geometries = new ClassesDataDict({
            BoxBufferGeometry: BoxBufferGeometry,
            ConeBufferGeometry: ConeBufferGeometry,
            RingBufferGeometry: RingBufferGeometry,
            TextBufferGeometry: TextBufferGeometry,
            TubeBufferGeometry: TubeBufferGeometry,
            LatheBufferGeometry: LatheBufferGeometry,
            PlaneBufferGeometry: PlaneBufferGeometry,
            ShapeBufferGeometry: ShapeBufferGeometry,
            TorusBufferGeometry: TorusBufferGeometry,
            CircleBufferGeometry: CircleBufferGeometry,
            SphereBufferGeometry: SphereBufferGeometry,
            ExtrudeBufferGeometry: ExtrudeBufferGeometry,
            CylinderBufferGeometry: CylinderBufferGeometry,
            InstancedBufferGeometry: InstancedBufferGeometry,
            OctahedronBufferGeometry: OctahedronBufferGeometry,
            ParametricBufferGeometry: ParametricBufferGeometry,
            PolyhedronBufferGeometry: PolyhedronBufferGeometry,
            BoxGeometry: BoxBufferGeometry,
            ConeGeometry: ConeBufferGeometry,
            RingGeometry: RingBufferGeometry,
            TextGeometry: TextBufferGeometry,
            TubeGeometry: TubeBufferGeometry,
            LatheGeometry: LatheBufferGeometry,
            PlaneGeometry: PlaneBufferGeometry,
            ShapeGeometry: ShapeBufferGeometry,
            TorusGeometry: TorusBufferGeometry,
            CircleGeometry: CircleBufferGeometry,
            SphereGeometry: SphereBufferGeometry,
            ExtrudeGeometry: ExtrudeBufferGeometry,
            CylinderGeometry: CylinderBufferGeometry,
            InstancedGeometry: InstancedBufferGeometry,
            OctahedronGeometry: OctahedronBufferGeometry,
            ParametricGeometry: ParametricBufferGeometry,
            PolyhedronGeometry: PolyhedronBufferGeometry,
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
        this.cached_audio_buffers = new CachedDataDict()
        this.cached_images = new CachedDataDict()
        this.gameobject_refs = new RmDict()
        this.shared_contexts = new RmDict()
        this.templates_of_materials = new TemplatesDataDict()
        this.templates_of_geometries = new TemplatesDataDict()
        /**comps */
        this.components_tags = new RmDict()
        this.components_instances = new RmDict()
        this.classes_of_components = new ClassesDataDict()
        this.defined_globals = new RmDict()
        this.extra_widget_components = new RmDict();
        /**vue */
        this.widget_stores = new RmDict()

        /**loading texture placeholder */
        let placeholder_texture = this.placeholder_texture = this.load_texture("res/retro/helper_uv_b.jpg")
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
                    }),
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
    register_texture(src, texture) {
        this.cached_textures[src] = texture
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
                    uniform.value = new Vector3(...uniform.value)
                }
                if (uniform.type === "v2" && isArray(uniform.value)) {
                    uniform.value = new Vector2(...uniform.value)
                }
            }
        }
        let mat = new this.classes_of_materials[template_data.type](template_data.params);
        return mat
    }
    mixin_object(data, mixins = []) {
        let r = data
        let merged_mixins = [data, ...mixins]
        let data_type = Schema.get_type_name(data)
        switch (data_type) {
            case "object": {
                if (is_class_excluded_from_mixin(data)) {
                    r = data
                    break
                }
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
                if (this.classes_of_materials[type] === undefined) {
                    console.error(`Cannot find constructor for material "${type}"`)
                } else {
                    mat = new this.classes_of_materials[type](params)
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
            if (this.classes_of_geometries[type] === undefined) {
                console.error("this", `cannot find geometry class "${type}"`)
            } else {
                g = new this.classes_of_geometries[type](...params);
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
        let texture = new Texture();
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
                let image_src = src
                if (src.indexOf("?") > -1) {
                    params = get_query_string_params(src.split("?")[1] || "")
                    image_src = src.split("?")[0]
                }

                // console.log(src, params)
                if (params && (params.filter !== undefined || params.maxsize !== undefined)) {
                    texture = image_filter.get_texture(src, params.filter || "", params.maxsize || 1024)
                } else {
                    texture = this.cached_textures[src] = new TextureLoader().load(image_src);
                }
            }
        }
        if (!texture) {
            texture = this.placeholder_texture
        } else {
            let webgl_capabilities = this.globals.webgl_capabilities
            let aniso = 1
            if (webgl_capabilities) {
                aniso = webgl_capabilities.getMaxAnisotropy()
            }
            texture.anisotropy = aniso
            for (let k in params) {
                set(texture, k, params[k])
            }
            texture.needsUpdate = true;
        }


        return texture;
    }
    load_cubemap(src, type = "jpg", onload = () => { }) {
        let texture = this.loaders.cubemap.load([
            `${src}/posx.${type}`,
            `${src}/negx.${type}`,
            `${src}/posy.${type}`,
            `${src}/negy.${type}`,
            `${src}/posz.${type}`,
            `${src}/negz.${type}`
        ], onload)

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

                texture = this.load_texture(url)
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
    load_audio_buffer(src) {
        return new Promise((resolve) => {
            let buffer = this.cached_audio_buffers[src]
            if (buffer !== undefined) {
                console.log(`using cached audio buffer (${src})`)
                resolve(buffer)
                return
            } else {
                let audio_format = "ogg"

                if (["mac os", "ios"].indexOf(tools.device.os_name.toLowerCase()) > -1) {
                    audio_format = "mp3"
                }

                audio_loader.load(`${src}.${audio_format}`, (buffer) => {
                    this.cached_audio_buffers[src] = buffer
                    resolve(buffer)
                });
            }

        })
    }
    async load_audio(src, spatial = true, autoplay = false) {
        let sound = undefined
        if (spatial === true) {
            sound = new PositionalAudio(audio_listener)
            // const helper = new PositionalAudioHelper(sound);
            // sound.helper = helper
        } else {
            sound = new Audio(audio_listener)
        }

        sound.is_new = true
        sound.autoplay = autoplay
        sound.frustumCulled = false
        let buffer = await this.load_audio_buffer(src)
        sound.setBuffer(buffer)

        return sound
    }
    resolve_string_placeholders(data) {
        data = data.replace("{{APP_NAME}}", process.env.APP_NAME)
        data = data.replace("{{PLATFORM}}", tools.device.is_mobile ? "MOBILE" : "DESKTOP")
        return data
    }
    load_prefab(id, params) {
        let prefab_template = undefined
        if (isObject(id)) {
            prefab_template = id
        }
        if (isString(id)) {
            id = this.resolve_string_placeholders(id)

            if (this.templates_of_prefabs[id] === undefined) {
                throw new Error(`no prefab with id "${id} found"`)
            }

            prefab_template = this.templates_of_prefabs[id]
        }

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
                let _module = context(p)
                handler(p, _module)
            } else {
                handler(p)
            }
        });
    }
    preload_classes(ns, context, category) {
        this.preload_context(context, (p, mod) => {
            let name = p.replace("./", "").replace(/\.js$|\.coffee$|\.ts/, "");
            this[`classes_of_${category}`] = this[`classes_of_${category}`] || {}
            this[`classes_of_${category}`][name] = mod.default
            if (isObject(this[`classes_of_${category}`][name])) {
                this[`classes_of_${category}`][name].ResourceManager = this
            }
        })
    }
    preload_vue_components(ns, context, category) {
        this.preload_context(context, (p, mod) => {
            let name = p.replace("./", "").replace(".vue", "");
            name = `${ns}.${name}`
            this.widget_component_templates = this.widget_component_templates || {}
            this.widget_component_templates[name] = mod.default
            if (isObject(this.widget_component_templates[name])) {
                this.widget_component_templates[name].ResourceManager = this
            }
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
            let data = mod.default
            this.textures_lib[name] = data
        })
    }
    preload_components(ns, context) {
        this.preload_context(context, (p, mod) => {
            this.asset_stats.components_count++;

            let name = p.replace("./", "").replace(/\.js$|\.coffee$|\.ts/, "").replace(/\//gm, ".");

            name = name.split(".")[name.split(".").length - 1]
            let creator = mod.default ?? mod[name] ?? creator

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
                error(`RM`, `failed to preload component "${ns}.${name}". Unknown type: "${typeof creator}"`)
            }
        })
    }
    preload_templates_of_shader_parts(ns, context) {
        this.templates_of_shader_parts = this.templates_of_shader_parts || {}

        this.preload_context(context, (p, mod) => {
            let name = p.replace("./", "").replace(".yaml", "").replace(/\//gm, ".");
            this.templates_of_shader_parts[`${ns}.${name}`] = mod.default;
        })
    }
    preload_materials(ns, context) {
        let templates_of_materials = this.templates_of_materials

        this.preload_context(context, (p, mod) => {
            let name = p.replace("./", "").replace(".yaml", "").replace(/\//gm, ".");
            this.asset_stats.materials_count++
            let template = templates_of_materials[`${ns}.${name}`] = mod.default;
            if (template.params) {
                let shader_lib_uniforms = ShaderLib[template.params.extend]
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
            this.templates_of_geometries[`${ns}.${name}`] = mod.default;
        })
    }
    preload_prefabs(ns, context) {
        this.templates_of_prefabs = this.templates_of_prefabs || { test: { test_prop1: 1, test_prop2: "hello" } }
        this.preload_context(context, (p, mod) => {
            let name = p.replace("./", "").replace(".yaml", "").replace(/\//gm, ".");
            let data = mod.default
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
            for (let s in ShaderChunk) {
                code = code.replace(`#include <${s}>`, ShaderChunk[s])
            }
        }
        return code
    }

    get_component_instance(type, UUID) {
        return this.components_instances[type] ? this.components_instances[type][UUID] : undefined
    }
    /**contexts */
    load_context() {

    }
    create_object(object_class, options) {
        return new this.classes_of_objects[object_class](options)
    }

    /*widget components*/
    find_widget_component = function (name, cb) {
        if (isObject(this.widget_component_instances[name])) {
            let r = undefined
            for (let k in this.widget_component_instances[name]) {
                r = this.widget_component_instances[name][k]
                break
            }
            if (isFunction(cb)) cb(r)
            return r
        }
    }
    find_widget_components = function (name, cb) {
        if (isObject(this.widget_component_instances[name])) {
            let r = []
            for (let k in this.widget_component_instances[name]) {
                r.push(this.widget_component_instances[name][k])
                break
            }
            if (isFunction(cb)) r.forEach(cb)
            return r
        }
    }
    /**universal method */
    using(query, callback) {
        let result = undefined
        console.log(query, callback)

        return result
    }

    /**patches */
    load_patches(ns, context) {
        this.preload_context(context, (p, mod) => {
            this.asset_stats.components_count++;
            let name = p.replace("./", "").replace(/\.js$|\.coffee$|\.ts/, "").replace(/\//gm, ".");
            name = name.split(".")[name.split(".").length - 1]
            let patch = mod.default ?? mod[name] ?? patch

            if (isFunction(patch)) {
                patch(this)
                log(`RM`, `patch "${name}" applied`);
            } else {
                error(`RM`, `failed to apply patch ${name}: patch is not a function`)
            }
        })
    }

    /**asset index */
    load_asset_index(data) {
        console.log(data)
    }

    run_postload_tasks() {
        let classes_of_components = this.classes_of_components;
        console.log(classes_of_components)
        this.widgetation.init(this)
    }
}

rm = new ResourceManager()
window.F_TEXTURE_STREAMING_FUNCTION = rm.texture_stream_function.bind(rm)

if (IS_DEV) {
    window.rm = rm
}

export default rm;
