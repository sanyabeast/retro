
/* created by @sanyabeast 9/4/2021 
 *
 *
 */


import Component from "retro/Component";
import {
    Vector2,
    Vector3,
    Scene,
    MeshNormalMaterial,
    MeshBasicMaterial,
    MeshDepthMaterial,
    MeshDistanceMaterial,
    MeshMatcapMaterial,
    Object3D,
    WebGLRenderer,
    PCFSoftShadowMap,
    DirectionalLight,
    ReinhardToneMapping,
    ACESFilmicToneMapping,
    CineonToneMapping,
    LinearToneMapping,
    OrthographicCamera,
    PerspectiveCamera
} from 'three';
import Device from "retro/utils/Device";
import { ProgressiveLightMap } from 'three/examples/jsm/misc/ProgressiveLightMap.js';
import { isArray, isObject, map, debounce, throttle, isNumber, isNil } from "lodash-es"
import { WebGLShadowMap } from "three/src/renderers/webgl/WebGLShadowMap"

const $v3 = new Vector3()

// Object3D.DefaultMatrixAutoUpdate = false

/**THREEJS PATCHES*/
Object3D.matrix_cache = {}
Object3D.prototype.updateMatrix = function () {
    let cache_id = [this.position.x, this.position.y, this.position.z, this.rotation.x, this.rotation.y, this.rotation.z, this.scale.x, this.scale.y, this.scale.z].join("|")
    let needs_update = Object3D.matrix_cache[this.id] !== cache_id
    if (needs_update) {
        this.matrix.compose(this.position, this.quaternion, this.scale);
        Object3D.matrix_cache[this.id] = cache_id
    }

    this.matrixWorldNeedsUpdate = true;
}
Object3D.prototype.updateMatrixWorld = function (force) {
    if (this.matrixAutoUpdate) this.updateMatrix();
    if (this.matrixWorldNeedsUpdate || force) {
        let self_matrix = this.matrix
        let parent_matrix = undefined
        if (this.parent_matrix_world) {
            parent_matrix = this.parent_matrix_world
        } else {
            if (this.parent) parent_matrix = this.parent.matrixWorld
        }
        if (parent_matrix) {
            this.matrixWorld.multiplyMatrices(parent_matrix, self_matrix);
        } else {
            this.matrixWorld.copy(self_matrix)
        }
        this.matrixWorldNeedsUpdate = false;
        force = true;
    }
    this.children.forEach(child => child.updateMatrixWorld(force))
}

let shadowmap_fps = 10
let original_threejs_webgl_shadowmap_render = WebGLShadowMap.prototype.render
WebGLShadowMap.prototype.render = function (lights, scene, camera) {
    let now = +new Date
    this.prev_render_time = this.prev_render_time || now
    let delta = now - this.prev_render_time
    if (delta > (1000 / shadowmap_fps)) {
        this.prev_render_time = now
        original_threejs_webgl_shadowmap_render.call(this, lights, scene, camera)
    }
}

/**!THREEJS PATCHES */

/** */
class RenderScene extends Scene { }

const renderer_presets = {
    desktop: {
        antialias: true,
        alpha: PRESET.RENDERER_ALPHA == true ? true : false,
        stencil: true,
        depth: true
    },
    smartphone: {
        antialias: false,
        alpha: PRESET.RENDERER_ALPHA == true ? true : false,
        powerPreference: "high-performance"
    }
}

class Renderer extends Component {
    postfx = true
    custom_render_function = undefined
    clear_depth = true
    clear_stencil = true
    clear_color = true
    auto_clear = true
    use_progressive_lightmap = false
    use_postfx = undefined
    use_fog = undefined
    correct_lights = true
    current_matcap_id = 1
    shadows_enabled = true
    tick_rate = isNumber(PRESET.RENDERER_UPDATE_RATE) ? PRESET.RENDERER_UPDATE_RATE : 5
    shadowmap_fps = 15
    useOptimizations = true
    tonemapping = ACESFilmicToneMapping
    tonemapping_exposure = 1

    //** private*/
    canvas = null
    pixel_ratio = 1
    render_scene = undefined
    render_items_count = 0
    composer = undefined
    resolution = undefined
    progressive_lightmap = undefined
    progressive_lightmap_dirlight = undefined
    rendering_scale = 1;
    just_rendered = true

    current_override_material = null
    override_normal_material = new MeshNormalMaterial()
    override_depth_material = new MeshDepthMaterial()
    override_distance_material = new MeshDistanceMaterial()
    override_wireframe_material = new MeshBasicMaterial({ wireframe: true, wireframeLinewidth: 1, fog: false })
    override_matcap_material = new MeshMatcapMaterial({ fog: false, matcap: "res/retro/matcap_texture/matcap (1).png" })

    object_layers = undefined
    zero_object = new Object3D()

    original_threejs_webgl_shadowmap_render = undefined
    prev_shadowmap_render_time = +new Date

    persist_orthographic_camera = new OrthographicCamera(-1, 1, -1, 1, 0.01, 1000)
    persist_perspective_camera = new PerspectiveCamera(60, 1, 0.001, 1000)

    active_render_camera = undefined
    active_camera = undefined

    constructor() {
        super(...arguments)
        this.check_size = throttle(this.check_size.bind(this), 250);
        this.persist_perspective_camera.position.set(0, 0, 5);
        this.persist_orthographic_camera.position.set(0, 0, 5);
        this.active_render_camera = this.persist_perspective_camera;
    }

    on_create() {
        if (this.useOptimizations) {
            let optimized_oss = ["android", "macos", "osc", "mac", "linux"];
            this.pixel_ratio = Math.min(2, optimized_oss.indexOf(Device.os_name) > -1 ? Math.min(1.25, window.devicePixelRatio) : window.devicePixelRatio);
        }

        this.resolution = new Vector2(1, 1)
        this.object_layers = {}
        this.rendering_layers = {
            rendering: true,
            gizmo: IS_DEV
        }
        let render_scene = this.render_scene = new RenderScene()
        let renderer = this.renderer = new WebGLRenderer({
            antialias: false,
            alpha: PRESET.RENDERER_ALPHA == true ? true : false,
            preserveDrawingBuffer: PRESET.RENDERER_PRESERVE_DRAWING_BUFFER == true ? true : false,
            logarithmicDepthBuffer: PRESET.RENDERER_LOGARITHMIC_DEPTH_BUFFER === true ? true : false,
            stencil: this.clear_stencil,
            depth: this.clear_depth,
            ...renderer_presets[Device.device_type]
        });

        renderer.gammaFactor = 1


        if (this.tools.device.is_mobile) {
            this.tools.html.set_style(renderer.domElement, {
                imageRendering: "pixelated"
            })
        }

        /**lightmap */
        this.setup_progressive_lightmap()
        this.define_global_var("webgl_capabilities", a => renderer.capabilities)

        renderer.setClearAlpha(PRESET.RENDERER_ALPHA == true ? 0 : 1)
        renderer.setSize(1000, 1000);
        renderer.physicallyCorrectLights = this.correct_lights

        if (PRESET.RENDERER_ALPHA == true) this.globals.transparent_background = true
        if (this.globals.transparent_background) {
            renderer.setClearColor(0x000000, 0);
        }

        /**shadowmap */
        renderer.shadowMap.enabled = this.shadows_enabled && !Device.is_mobile
        renderer.shadowMap.type = PCFSoftShadowMap
        renderer.shadowMap.autoUpdate = false

        /**@TODO:move shadowmap patch to prototype of WebGLShadowMap class ? */
        let original_threejs_webgl_shadowmap_render = this.original_threejs_webgl_shadowmap_render = renderer.shadowMap.render
        renderer.shadowMap.render = this.render_shadowmap.bind(this)


        this.globals.uniforms.pixel_ratio.value = this.pixel_ratio
        this.update_resolution_scale();
        this.canvas = this.globals.canvas = this.renderer.domElement
        this.canvas.style.position = "absolute";
        this.canvas.style.top = "0";
        this.canvas.style.left = "0";
        this.canvas.style.width = "100%";
        this.canvas.style.height = "100%";
        this.handle_mousemove = this.handle_mousemove.bind(this);
        document.body.addEventListener("mousemove", this.handle_mousemove);

        this.define_global_var("renderer", () => {
            return this.renderer
        })
        this.define_global_var("camera", () => {
            return this.active_render_camera
        })
    }
    get_reactive_props() {
        return [
            "clear_stencil",
            "clear_depth",
            "shadows_enabled",
            "tonemapping",
            "tonemapping_exposure",
            "rendering_scale",
            "active_camera"
        ].concat(super.get_reactive_props())
    }
    update_resolution_scale() {
        this.renderer.setPixelRatio(this.pixel_ratio * this.rendering_scale)
    }
    on_update(props) {
        props.forEach(prop => {
            switch (prop) {
                case "rendering_scale": {

                    break;
                }
                case "clear_depth": {
                    this.renderer.autoClearDepth = this.clear_depth
                    break
                }
                case "clear_stencil": {
                    this.renderer.autoClearStencil = this.clear_stencil
                    break
                }
                case "clear_color": {
                    this.renderer.autoClearColor = this.clear_color
                    break
                }
                case "auto_clear": {
                    this.renderer.autoClear = this.auto_clear
                    break
                }
                case "shadows_enabled": {
                    this.renderer.shadowMap.enabled = this.shadows_enabled && !Device.is_mobile
                    break
                }
                case "tonemapping": {
                    this.renderer.toneMapping = this.tonemapping
                    break
                }
                case "tonemapping_exposure": {
                    this.renderer.toneMappingExposure = this.tonemapping_exposure
                    break
                }
                case "active_camera": {
                    if (!isNil(this.active_camera)) {
                        switch (this.active_camera.type) {
                            case "OrthographicCamera": {
                                this.active_render_camera = this.persist_orthographic_camera
                                break;
                            }
                            default: {
                                this.active_render_camera = this.persist_perspective_camera
                                break;
                            }
                        }
                    } else {
                        this.active_camera = undefined
                    }
                    break;
                }
            }
        })
    }
    get capabilities() {
        return this.renderer.capabilities
    }
    compile() {
        this.update_render_scene()
        let camera = this.active_render_camera
        if (camera) {
            this.renderer.compile(this.render_scene, camera)
        }
    }
    handle_mousemove(evt) {
        let x = (evt.pageX - this.globals.dom_rect.left) / this.canvas.width;
        let y = (evt.pageY - this.globals.dom_rect.top) / this.canvas.height;
        this.globals.uniforms.mouse.value.x = x;
        this.globals.uniforms.mouse.value.y = y;
    }
    on_tick(time_data) {
        if (this.just_rendered) {
            this.just_rendered = false
            this.update_object_layers()
            if (this.use_progressive_lightmap) this.update_progressive_lightmap()
            this.check_size()
            this.render_list = this.get_rendering_list()
        }

        if (PRESET.RENDERER_SYNC == true) {
            this.render();
        }

        // this.progressive_lightmap.showDebugLightmap( true );
    }
    on_destroy() {
        super.on_destroy(...arguments)
        if (PRESET.RENDERER_SYNC != true) {
            if (this.raf_loop) {
                this.raf_loop.stop()
            }
        }
    }
    on_enable() {
        this.globals.dom.appendChild(this.renderer.domElement)
        let clock = this.find_component_of_type("ClockComponent")
        if (PRESET.RENDERER_SYNC != true) {
            this.raf_loop = clock.create(this.render.bind(this))
        }
        // this.raf_cb_id = clock.add(this.render.bind(this))
    }
    update_object_layers() {
        let object_layers = this.object_layers = {}
        let scene = this.globals.app

        scene.traverse_components((comp, object) => {
            if (comp.enabled) {
                let local_render_list = []
                let render_data = comp.is_scene_component ? comp.get_render_data() : []
                let gizmo_render_data = comp.get_gizmo_render_data()


                local_render_list = local_render_list.concat(render_data)
                local_render_list = local_render_list.concat(gizmo_render_data)

                local_render_list.forEach((data, index) => {
                    if (isObject(data)) {
                        let layers = isObject(data.layers) ? data.layers : comp.meta.layers
                        for (let layer_name in layers) {
                            if (layers[layer_name] === false) continue
                            if (!data.object) continue
                            if (data.visible === false) continue
                            object_layers[layer_name] = object_layers[layer_name] || []
                            let parent = data.parent || this.zero_object
                            if (parent.is_game_object) {
                                parent = parent.transform
                            }
                            data.object.parent_matrix_world = parent.matrixWorld
                            data.object.parent = this.render_scene
                            object_layers[layer_name].push(data)
                        }
                    }
                })
            }
        })
    }
    get_object_layer(layers) {
        let list = []
        let object_layers = this.object_layers
        let already_in_list = {}
        for (let layer_name in layers) {
            let use = layers[layer_name]
            if (use && isArray(object_layers[layer_name])) {
                object_layers[layer_name].forEach(render_data => {
                    let object = render_data.object
                    if (already_in_list[object.uuid] !== true) {
                        already_in_list[object.uuid] = true
                        list.push(render_data)
                    }
                })
            }
        }
        return list
    }
    get_object_layer_list(layers) {
        return map(this.get_object_layer(layers), render_data => render_data.object)
    }
    get_rendering_list() {
        //@TODO: audio_listener
        return this.get_object_layer_list(this.rendering_layers)
    }
    update_render_scene() {
        if (this.render_list !== undefined) {
            let scene = this.globals.app

            if (this.use_fog !== false) {
                this.render_scene.fog = scene.fog
            } else {
                this.render_scene.fog = null
            }

            this.render_scene.background = scene.background || null
            this.render_scene.refraction_map = scene.refraction_map || null
            this.render_scene.environment = scene.environment || null
            this.render_scene.children = this.render_list
            this.render_items_count = this.render_list.length
            this.render_scene.updateMatrixWorld()
        }
    }
    update_progressive_lightmap() {

        let children = []
        this.render_scene.traverse((c) => {
            if (c.isMesh) {
                children.push(c)
            }
        })

        let sun = this.find_component_of_type("Sun")
        if (sun) {
            this.progressive_lightmap_dirlight.position.set(...sun.position)
            // this.progressive_lightmap_dirlight.color.set_any(1, 1, 1)
            this.progressive_lightmap_dirlight.intensity = sun.subject.intensity
        }

        this.progressive_lightmap.addObjectsToLightMap(children)

    }
    setup_progressive_lightmap() {
        let renderer = this.renderer
        this.progressive_lightmap = new ProgressiveLightMap(renderer, 1024);
        let dirlight = this.progressive_lightmap_dirlight = new DirectionalLight(0xffffff, 1.0)
        dirlight.castShadow = true;
        dirlight.shadow.camera.near = 100;
        dirlight.shadow.camera.far = 5000;
        dirlight.shadow.camera.right = 150;
        dirlight.shadow.camera.left = - 150;
        dirlight.shadow.camera.top = 150;
        dirlight.shadow.camera.bottom = - 150;
        dirlight.shadow.mapSize.width = 512;
        dirlight.shadow.mapSize.height = 512;
        this.progressive_lightmap.scene.add(this.progressive_lightmap_dirlight)
    }
    accumulate_progressive_lightmap() {
        let camera = this.active_render_camera
        this.progressive_lightmap.update(camera, 200, true);
    }
    add_object_to_lightmap(object) {
        this.progressive_lightmap.addObjectsToLightMap(object)
    }
    render() {
        let scene = this.globals.app
        let camera = this.active_render_camera

        this.just_rendered = true
        this.update_camera()
        this.update_render_scene()
        scene.update_transform()
        if (this.custom_render_function === undefined || this.use_postfx === false) {
            this.renderer.render(this.render_scene, camera)
            // this.renderer.clear(true, true, true)   
        } else {
            this.custom_render_function(this.render_scene, camera)
        }
    }
    set_render_layer_name(mode = "rendering") {
        switch (mode) {
            case "normal":
                this.current_override_material = this.override_normal_material
                this.rendering_layers.normal = true
                this.rendering_layers.rendering = false
                this.rendering_layers.colorid = false
                break;
            case "depth":
                this.current_override_material = this.override_depth_material
                this.rendering_layers.normal = true
                this.rendering_layers.rendering = false
                this.rendering_layers.colorid = false
                break;
            case "distance":
                this.current_override_material = this.override_distance_material
                this.rendering_layers.normal = true
                this.rendering_layers.rendering = false
                this.rendering_layers.colorid = false
                break;
            case "wireframe":
                this.current_override_material = this.override_wireframe_material
                this.rendering_layers.normal = true
                this.rendering_layers.rendering = false
                this.rendering_layers.colorid = false
                break;
            case "matcap":
                this.current_override_material = this.override_matcap_material
                let matcap_id = this.current_matcap_id = 1 + Math.floor(Math.random() * 640)
                this.override_matcap_material.matcap = `res/retro/matcap_texture/matcap (${matcap_id}).png`
                this.rendering_layers.normal = true
                this.rendering_layers.rendering = false
                this.rendering_layers.colorid = false
                break;
            case "colorid":
                this.current_override_material = null
                this.rendering_layers.normal = false
                this.rendering_layers.rendering = false
                this.rendering_layers.colorid = true
                break;
            default:
                this.current_override_material = null
                this.rendering_layers.normal = false
                this.rendering_layers.rendering = true
                this.rendering_layers.colorid = false
        }
        this.render_scene.overrideMaterial = this.current_override_material
    }
    check_size() {
        if (!this.globals.dom) {
            return;
        }

        let camera = this.active_render_camera
        let new_rect;

        if (this.force_resolution !== undefined) {
            new_rect = { x: 0, y: 0, width: this.force_resolution[0], height: this.force_resolution[1] }
        } else {
            new_rect = this.globals.dom.getBoundingClientRect();
        }

        if (
            new_rect.width !== this.globals.dom_rect.width ||
            new_rect.height !== this.globals.dom_rect.height
        ) {
            this.update_resolution_scale()
            this.renderer.setSize(new_rect.width, new_rect.height);
            this.renderer.getSize(this.globals.uniforms.resolution.value);
            this.globals.uniforms.resolution2.value.set(1 / new_rect.width, 1 / new_rect.height)
            this.globals.need_render = true
            this.resolution.set(new_rect.width, new_rect.height)
        }
        this.globals.dom_rect = new_rect;
    }
    render_shadowmap(lights, scene, camera) {
        let now = +new Date
        let delta = now - this.prev_shadowmap_render_time
        if (delta > (1000 / this.shadowmap_fps)) {
            this.prev_shadowmap_render_time = now
            this.original_threejs_webgl_shadowmap_render.call(this.renderer.shadowMap, lights, scene, camera)
            this.renderer.shadowMap.needsUpdate = true
        }
    }
    get_camera_bounds(z_position = 0) {
        let camera = this.globals.camera
        camera.getWorldPosition($v3)
        let distance = Math.abs($v3.z - z_position)

        let fov = camera.fov
        let aspect = camera.aspect
        let width = height * aspect

        let bounds = [
            $v3.x - width / 2,
            $v3.y - height / 2,
            $v3.x + width / 2,
            $v3.y + height / 2
        ]

        return bounds
    }
    get_frame_image_data(format) {
        switch (format) {
            default: {
                let mime_type = "image/png"
                return this.renderer.domElement.toDataURL(mime_type);
            }
        }
    }
    set_background_brightness(val) {
        this.renderer.webgl_background.set_brightness(val)
    }
    set_background_tint(val) {
        this.renderer.webgl_background.set_tint(val)
    }
    update_camera() {
        let proj_matrix_needs_update = false
        if (!isNil(this.active_camera)) {
            switch (this.active_camera.type) {
                case "OrthographicCamera": {
                    break;
                }
                default: {
                    //this.active_render_camera.matrixWorld.copy(this.active_camera.matrixWorld)
                    

                    this.active_render_camera.near = this.active_camera.near
                    this.active_render_camera.far = this.active_camera.far

                    this.active_render_camera.position.copy(this.active_camera.position)
                    this.active_render_camera.scale.copy(this.active_camera.scale)
                    this.active_render_camera.rotation.copy(this.active_camera.rotation)

                    if (this.active_render_camera.aspect !== this.active_camera.aspect) {
                        this.active_render_camera.aspect = this.active_camera.aspect
                        proj_matrix_needs_update = true
                    }

                    if (this.active_render_camera.fov !== this.active_camera.fov) {
                        this.active_render_camera.fov = this.active_camera.fov
                        proj_matrix_needs_update = true
                    }

                    // this.active_render_camera.position.copy(this.active_camera.position)
                    // this.active_render_camera.position.copy(this.active_camera.position)
                }
            }
        } else {
            let aspect = this.globals.uniforms.resolution.value.x / this.globals.uniforms.resolution.value.y;

            if (this.active_render_camera.aspect !== aspect) {
                this.active_render_camera.aspect = aspect
                proj_matrix_needs_update = true
            }
        }

        if (proj_matrix_needs_update) {
            this.active_render_camera.updateProjectionMatrix()
        }
    }
}
export default Renderer;
