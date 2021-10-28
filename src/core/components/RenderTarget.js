
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import SceneComponent from "core/SceneComponent";
import AssetManager from "core/utils/AssetManager";
import * as THREE from 'three';
import { log, error, is_none, console, makeid } from "core/utils/Tools"
import { isString, isObject, isFunction, isArray, isNumber, isBoolean, isUndefined, isNull, map, filter, keys, values, set, get, unset } from "lodash-es"
import Schema from "core/utils/Schema"

const modes = ["copy", "mirror", "lookat", "free"]

class RenderTarget extends SceneComponent {
    render_target_id = undefined
    width = 512
    height = 512
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
    render_target = undefined;
    rt_camera = undefined
    rt_scene = undefined

    current_override_material = undefined
    override_normal_material = new THREE.MeshNormalMaterial()
    override_depth_material = new THREE.MeshDepthMaterial()
    override_distance_material = new THREE.MeshDistanceMaterial()
    override_wireframe_material = new THREE.MeshBasicMaterial({ wireframe: true, wireframeLinewidth: 1, fog: false })
    override_matcap_material = new THREE.MeshMatcapMaterial({ fog: false, matcap: "res/core/matcap_texture/matcap (1).png" })

    get texture() {
        return this.render_target.texture
    }
    on_created() {
        log(`RenderTarget`, `created`)
        if (isUndefined(this.rendering_layers)) {
            this.rendering_layers = {
                rendering: true
            }
        }
        if (isUndefined(this.render_target_id)) {
            this.render_target_id = `RT_${makeid(8)}`
        }
        let render_target = this.render_target = RenderTarget.get_render_target(this.width, this.height)
        if (!THREE.MathUtils.isPowerOfTwo(this.width) || !THREE.MathUtils.isPowerOfTwo(this.height)) {
            render_target.texture.generateMipmaps = false;
        }

        log(this, render_target)
        RenderTarget.list[this.render_target_id] = this

        let camera = this.rt_camera = this.create_camera()
        let scene = this.rt_scene = new THREE.Scene()
        scene.updateWorldMatrix = false
    }
    create_camera() {
        let camera = undefined
        switch (this.camera_type) {
            case "othographic": {
                camera = new THREE.OrthographicCamera({
                    fov: this.fov,
                    aspect: this.aspect,
                    near: this.near,
                    far: this.far,
                    position: new THREE.Vector3(0, 0, 20),
                });
                break
            }
            default: {
                camera = new THREE.PerspectiveCamera(this.fov, this.aspect, this.near, this.far);
                break
            }

        }

        return camera
    }
    on_tick(time_delta) {
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
            // console.log(this.rendering_layers)
            let render_list = renderer.get_object_layer_list(this.rendering_layers)
            this.rt_scene.children = render_list
            // console.log(render_list)
        }

        this.rt_scene.fog = this.globals.app.fog
        this.rt_scene.background = this.globals.app.background
        this.rt_scene.overrideMaterial = this.current_override_material === undefined ? null : this.current_override_material
    }
    render() {
        let renderer = this.find_component_of_type("Renderer")
        if (renderer) {
            // three native renderer
            let gl_renderer = renderer.renderer
            const prev_render_target = gl_renderer.getRenderTarget();
            const prev_xr_enabled = gl_renderer.xr.enabled;
            const prev_shadowmap_autoupdate = gl_renderer.shadowMap.autoUpdate;
            gl_renderer.xr.enabled = false; // Avoid camera modification and recursion
            gl_renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows
            gl_renderer.setRenderTarget(this.render_target);
            gl_renderer.state.buffers.depth.setMask(true); // make sure the depth buffer is writable so it can be properly cleared, see #18897
            if (gl_renderer.autoClear === false) gl_renderer.clear();
            gl_renderer.render(this.rt_scene, this.rt_camera);
            gl_renderer.xr.enabled = prev_xr_enabled;
            gl_renderer.shadowMap.autoUpdate = prev_shadowmap_autoupdate;
            gl_renderer.setRenderTarget(prev_render_target);
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
                                this.override_matcap_material.matcap = `res/core/matcap_texture/matcap (${matcap_id}).png`
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
                    this.rt_camera.fov = this.fov
                    this.rt_camera.updateProjectionMatrix()
                    break
                }
                case "aspect": {
                    this.rt_camera.aspect = this.aspect
                    this.rt_camera.updateProjectionMatrix()
                    break
                }
                case "position": {
                    if (Array.isArray(this.position)) {
                        this.rt_camera.position.set(
                            this.position[0],
                            this.position[1],
                            this.position[2]
                        );
                    } else if (typeof this.position === "object") {
                        this.rt_camera.position.set(
                            this.position.x,
                            this.position.y,
                            this.position.z
                        )
                    }

                    break;
                }
                case "scale": {
                    if (Array.isArray(this.scale)) {
                        this.rt_camera.scale.set(
                            this.scale[0],
                            this.scale[1],
                            this.scale[2]
                        );
                    } else if (typeof this.scale === "object") {
                        this.rt_camera.scale.set(
                            this.scale.x,
                            this.scale.y,
                            this.scale.z
                        )
                    }

                    break;
                }
                case "rotation": {
                    if (Array.isArray(this.rotation)) {
                        this.rt_camera.rotation.set(
                            this.rotation[0],
                            this.rotation[1],
                            this.rotation[2]
                        );
                    } else if (typeof this.rotation === "object") {
                        this.rt_camera.rotation.set(
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


RenderTarget.get_render_target = (w = 512, h = 512) => {
    const rt = new THREE.WebGLRenderTarget(w, h, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBFormat
    });
    return rt
}

export default RenderTarget;
