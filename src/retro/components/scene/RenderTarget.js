
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import SceneComponent from "retro/SceneComponent";
import ResourceManager from "retro/ResourceManager";
import {
    MeshNormalMaterial,
    MeshDepthMaterial,
    MeshDistanceMaterial,
    MeshMatcapMaterial,
    MeshBasicMaterial,
    MathUtils,
    RGBAFormat,
    Vector2,
    Vector3,
    OrthographicCamera,
    PerspectiveCamera,
    Scene,
    WebGLRenderTarget,
    LinearFilter
} from 'three';
import { log, error, is_none, console, makeid } from "retro/utils/Tools"
import { isString, isObject, isFunction, isArray, isNumber, isBoolean, isUndefined, isNull, map, filter, keys, values, set, get, unset } from "lodash-es"
import Schema from "retro/utils/Schema"

const modes = ["copy", "mirror", "lookat", "free"]

class RenderTarget extends SceneComponent {
    render_target_id = undefined
    resolution_scale = 0.5
    camera_type = "perspective"
    aspect = 1
    near = 0.1
    far = 300
    left = -256
    right = 256

    camera_mode = "free"
    look_target = undefined
    override_material = undefined

    rendering_layers = undefined
    tick_rate = 30

    /**private */
    render_target_state = undefined;

    current_override_material = undefined
    override_normal_material = new MeshNormalMaterial()
    override_depth_material = new MeshDepthMaterial()
    override_distance_material = new MeshDistanceMaterial()
    override_wireframe_material = new MeshBasicMaterial({ wireframe: true, wireframeLinewidth: 1, fog: false })
    override_matcap_material = new MeshMatcapMaterial({ fog: false, matcap: "res/retro/matcap_texture/matcap (1).png" })



    get texture() {
        return this.render_target_state.render_target.texture
    }
    on_create() {
        log(`RenderTarget`, `created`)


        if (isUndefined(this.rendering_layers)) {
            this.rendering_layers = {
                rendering: true
            }
        }

        let render_target_state = this.render_target_state = RenderTarget.get_render_target({
            id: this.render_target_id,
            resolution_scale: this.resolution_scale,
            camera_type: this.camera_type
        })
        if (!MathUtils.isPowerOfTwo(this.width) || !MathUtils.isPowerOfTwo(this.height)) {
            render_target_state.render_target.texture.generateMipmaps = false;
        }

        log(this, render_target_state)

    }
    on_tick(time_data) {
        this.update_camera()
        this.update_scene()
        this.render()
    }
    update_camera() {
        switch (this.camera_mode) {
            case "copy": {
                let g_camera = this.globals.camera
                if (g_camera) {
                    this.position = [
                        g_camera.position.x,
                        g_camera.position.y,
                        g_camera.position.z
                    ]

                    this.rotation = [
                        g_camera.rotation.x,
                        g_camera.rotation.y,
                        g_camera.rotation.z
                    ]

                    if (this.fov !== g_camera.fov) {
                        this.fov = g_camera.fov
                    }

                    if (this.aspect !== g_camera.aspect) {
                        this.aspect = g_camera.aspect
                    }

                }
                break
            }
        }
    }
    update_scene() {
        let renderer = this.find_component_of_type("Renderer")
        if (renderer) {
            this.render_target_state.update_render_list(renderer, this.rendering_layers)
            this.render_target_state.setup_scene(this.globals.app.fog, this.globals.app.background, this.current_override_material)
        }

    }
    render() {
        let renderer = this.find_component_of_type("Renderer")
        if (renderer) {
            this.render_target_state.render(renderer)
        }
    }
    get_reactive_props() {
        return ["mode", "look_target", "fov", "near", "far", "width", "height", "aspect", "override_material"].concat(super.get_reactive_props())
    }
    on_update(props) {
        super.on_update(props)
        props.forEach((prop) => {
            switch (prop) {
                case "override_material": {
                    if (isString(this.override_material)) {
                        switch (this.override_material) {
                            case "normal":
                                this.current_override_material = this.override_normal_material
                                break;
                            case "depth":
                                this.current_override_material = this.override_depth_material
                                break;
                            case "distance":
                                this.current_override_material = this.override_distance_material
                                break;
                            case "wireframe":
                                this.current_override_material = this.override_wireframe_material
                                break;
                            case "matcap":
                                this.current_override_material = this.override_matcap_material
                                let matcap_id = this.current_matcap_id = 1 + Math.floor(Math.random() * 640)
                                this.override_matcap_material.matcap = `res/retro/matcap_texture/matcap (${matcap_id}).png`
                                break;
                            default:
                                this.current_override_material = undefined
                        }
                    } else if (isObject(this.override_material)) {
                        this.current_override_material = this.override_material
                    } else {
                        this.current_override_material = undefined
                    }
                    break
                }
                case "fov": {
                    this.render_target_state.camera.fov = this.fov
                    this.render_target_state.camera.updateProjectionMatrix()
                    break
                }
                case "aspect": {
                    this.render_target_state.camera.aspect = this.aspect
                    this.render_target_state.camera.updateProjectionMatrix()
                    break
                }
                case "position": {
                    if (Array.isArray(this.position)) {
                        this.render_target_state.camera.position.set(
                            this.position[0],
                            this.position[1],
                            this.position[2]
                        );
                    } else if (typeof this.position === "object") {
                        this.render_target_state.camera.position.set(
                            this.position.x,
                            this.position.y,
                            this.position.z
                        )
                    }

                    break;
                }
                case "scale": {
                    if (Array.isArray(this.scale)) {
                        this.render_target_state.camera.scale.set(
                            this.scale[0],
                            this.scale[1],
                            this.scale[2]
                        );
                    } else if (typeof this.scale === "object") {
                        this.render_target_state.camera.scale.set(
                            this.scale.x,
                            this.scale.y,
                            this.scale.z
                        )
                    }

                    break;
                }
                case "rotation": {
                    if (Array.isArray(this.rotation)) {
                        this.render_target_state.camera.rotation.set(
                            this.rotation[0],
                            this.rotation[1],
                            this.rotation[2]
                        );
                    } else if (typeof this.rotation === "object") {
                        this.render_target_state.camera.rotation.set(
                            this.rotation.x,
                            this.rotation.y,
                            this.rotation.z
                        )
                    }

                    break;
                }
                case "visible": {
                    this.subject.visible = this.visible;
                    break
                }
                case "frusum_culled": {
                    this.subject.frustumCulled = this.frusum_culled;
                    break
                }
                case "render_order": {
                    this.subject.renderOrder = this.render_order;
                    break
                }
            }
        })
    }
}

RenderTarget.list = {}
RenderTarget.get_render_target = ({ id = "", resolution_scale = 0.5, camera_params, mag_filter = "linear" }) => {

    let renderer_size = new Vector2(1, 1)
    let render_target_size = new Vector2(2, 2)
    let canvas2d = document.createElement("canvas")
    let canvas2d_context = canvas2d.getContext("2d")

    if (id === "") {
        id = `RT_${makeid(8)}`
    }
    camera_params = {
        type: "perspective",
        fov: 60,
        aspect: 1,
        near: 0.1,
        far: 10000,
        ...camera_params
    }


    let _mag_filter = LinearFilter
    switch (mag_filter) {
        case "linear": {
            _mag_filter = LinearFilter
            break
        }
        case "nearest": {
            _mag_filter = NearestFilter
            break
        }
    }
    const rt = new WebGLRenderTarget(512, 512, {
        minFilter: _mag_filter,
        magFilter: _mag_filter,
        format: RGBAFormat
    });

    rt.depthBuffer = false
    let camera = undefined
    switch (camera_params.type) {
        case "othographic": {
            camera = new OrthographicCamera({
                fov: camera_params.fov,
                aspect: camera_params.aspect,
                near: camera_params.near,
                far: camera_params.far,
                position: new Vector3(0, 0, 20),
            });
            break
        }
        default: {
            camera = new PerspectiveCamera(camera_params.fov, camera_params.aspect, camera_params.near, camera_params.far);
            break
        }
    }
    let scene = new Scene()
    scene.updateWorldMatrix = false
    let render_target_state = {
        resolution_scale,
        size: render_target_size,
        canvas2d,
        canvas2d_context,
        id: id,
        render_target: rt,
        camera: camera,
        scene: scene,
        bitmap_data: undefined,
        get texture() {
            return rt.texture
        },
        setup_scene(fog, background, override_material) {
            scene.fog = fog
            scene.background = background
            scene.overrideMaterial = override_material === undefined ? null : override_material
        },
        update_render_list(renderer, rendering_layers) {
            let render_list = renderer.get_object_layer_list(rendering_layers)
            scene.children = render_list
        },
        destroy() {
            log(`RenderTarget`, 'IMPLEMENT DESTROYING')
            delete RenderTarget.list[id]
        },
        render(renderer) {
            let gl_renderer = renderer.renderer
            gl_renderer.getSize(renderer_size)
            if (render_target_size.x !== renderer_size.x || render_target_size.x !== renderer_size.x) {
                rt.setSize(Math.floor(renderer_size.x * resolution_scale), Math.floor(renderer_size.y * resolution_scale))
                render_target_size.copy(renderer_size)
                console.log(render_target_size)
                console.log(Math.floor(renderer_size.x * resolution_scale), Math.floor(renderer_size.y * resolution_scale))
            }
            // rt.setSize(renderer_size.x, renderer_size.y)
            const prev_render_target = gl_renderer.getRenderTarget();
            const prev_xr_enabled = gl_renderer.xr.enabled;
            const prev_shadowmap_autoupdate = gl_renderer.shadowMap.autoUpdate;
            const prev_preserve_db = gl_renderer.preserveDrawingBuffer
            gl_renderer.preserveDrawingBuffer = true
            gl_renderer.xr.enabled = false; // Avoid camera modification and recursion
            gl_renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows
            gl_renderer.setRenderTarget(render_target_state.render_target);
            gl_renderer.state.buffers.depth.setMask(true); // make sure the depth buffer is writable so it can be properly cleared, see #18897
            if (gl_renderer.autoClear === false) gl_renderer.clear();

            gl_renderer.render(render_target_state.scene, render_target_state.camera);

            gl_renderer.xr.enabled = prev_xr_enabled;
            gl_renderer.shadowMap.autoUpdate = prev_shadowmap_autoupdate;
            gl_renderer.preserveDrawingBuffer = prev_preserve_db
            gl_renderer.setRenderTarget(prev_render_target);
        },
        pick(renderer, pointer) {
            let gl_renderer = renderer.renderer
            gl_renderer.getSize(renderer_size)
            if (render_target_size.x !== renderer_size.x || render_target_size.x !== renderer_size.x) {
                rt.setSize(Math.floor(renderer_size.x * resolution_scale), Math.floor(renderer_size.y * resolution_scale))
                render_target_size.copy(renderer_size)
                console.log(render_target_size)
                console.log(Math.floor(renderer_size.x * resolution_scale), Math.floor(renderer_size.y * resolution_scale))
            }
            // 
            const prev_render_target = gl_renderer.getRenderTarget();
            const prev_xr_enabled = gl_renderer.xr.enabled;
            const prev_shadowmap_autoupdate = gl_renderer.shadowMap.autoUpdate;
            const prev_preserve_db = gl_renderer.preserveDrawingBuffer

            camera.setViewOffset(gl_renderer.domElement.width, gl_renderer.domElement.height, pointer.x * window.devicePixelRatio | 0, pointer.y * window.devicePixelRatio | 0, 1, 1);
            // render the scene
            gl_renderer.setRenderTarget(rt);
            gl_renderer.render(scene, camera);
            // clear the view offset so rendering returns to normal
            camera.clearViewOffset();
            //create buffer for reading single pixel
            const pixel_buffer = new Uint8Array(4);
            //read the pixel
            gl_renderer.readRenderTargetPixels(rt, 0, 0, 1, 1, pixel_buffer);

            gl_renderer.xr.enabled = prev_xr_enabled;
            gl_renderer.shadowMap.autoUpdate = prev_shadowmap_autoupdate;
            gl_renderer.preserveDrawingBuffer = prev_preserve_db
            gl_renderer.setRenderTarget(prev_render_target);
            return [pixel_buffer[0], pixel_buffer[1], pixel_buffer[2]]
        },
        copy_camera(target_camera) {
            camera.position.copy(target_camera.position)
            camera.rotation.copy(target_camera.rotation)
            camera.scale.copy(target_camera.scale)
            camera.fov = target_camera.fov
            camera.aspect = target_camera.aspect
        },
        get_pixel_color(x, y) {
            console.log(x)
            console.log(x, y)
            let xx = (w) * ((x + 1) / 2)
            let yy = (h) * ((y + 1) / 2)
            let id = Math.floor(xx * yy * 3)
            console.log(xx, yy, id)
            if (this.bitmap_data) {
                let r = this.bitmap_data[id]
                let g = this.bitmap_data[id + 1]
                let b = this.bitmap_data[id + 2]
                return [r, g, b]
            } else {
                console.log("!")
                return [0, 0, 0]
            }
        }
    }

    RenderTarget.list[id] = render_target_state

    return RenderTarget.list[id]
}

export default RenderTarget;
