
/* created by @sanyabeast 9/4/2021 
 *
 *
 */


import Component from "core/Component";
import { Vector2 } from "spine-ts-threejs";
import * as THREE from 'three';
import Device from "core/utils/Device";

const renderer_presets = {
    desktop: {
        antialias: true,
        alpha: true,
        stencil: true,
        depth: true
    },
    smartphone: {
        antialias: false,
        powerPreference: "high-performance"
    }
}

class RendererComponent extends Component {
    target_fps = 33
    tick_skip = 4
    postfx = true
    custom_render_function = undefined
    clear_depth = true
    clear_stencil = true
    clear_color = true
    auto_clear = true
    //** private*/
    canvas = null
    pixel_ratio = window.devicePixelRatio
    prev_frame_time = +new Date()
    render_scene = undefined
    render_items_count = 0
    composer = undefined
    resolution = undefined
    shadows_enabled = true
    tonemapping = "cineon"

    on_created() {
        this.resolution = new Vector2(1, 1)

        let render_scene = this.render_scene = new THREE.Scene()

        let renderer = this.renderer = this.globals.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            stencil: this.clear_stencil,
            depth: this.clear_depth,
            ...renderer_presets[Device.device_type]
        });

        renderer.shadowMap.enabled = this.shadows_enabled
        renderer.shadowMap.type = THREE.PCFSoftShadowMap
        renderer.toneMappingExposure = 2

        console.log(`creating new WebGLRenderer with params: ${JSON.stringify({
            antialias: true,
            alpha: true,
            stencil: this.clear_stencil,
            depth: this.clear_depth,
            ...renderer_presets[Device.device_type]
        }, null, "\t")}`)

        renderer.setClearAlpha(1)
        renderer.setSize(1000, 1000);
        renderer.setPixelRatio(this.globals.uniforms.pixel_ratio.value);
        if (this.globals.transparent_background) {
            renderer.setClearColor(0x000000, 0);
        }



        this.globals.uniforms.pixel_ratio.value = this.pixel_ratio
        renderer.setPixelRatio(this.pixel_ratio)
        this.canvas = this.globals.canvas = this.renderer.domElement
        this.canvas.style.position = "absolute";
        this.canvas.style.top = "0";
        this.canvas.style.left = "0";
        this.canvas.style.width = "100%";
        this.canvas.style.height = "100%";
        this.handle_mousemove = this.handle_mousemove.bind(this);
        document.body.addEventListener("mousemove", this.handle_mousemove);
    }

    get_reactive_props() {
        return [
            "clear_stencil",
            "clear_depth",
            "shadows_enabled",
            "tonemapping"
        ].concat(super.get_reactive_props())
    }

    on_update(props) {
        console.log(props)
        props.forEach(prop => {
            switch (prop) {
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
                    this.renderer.shadowMap.enabled = this.shadows_enabled
                    break
                }
                case "tonemapping": {
                    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
                    // switch (this.tonemapping) {
                    //     case "reinhard":
                    //         this.renderer.toneMapping = THREE.ReinhardToneMapping
                    //         break;
                    //     case "cineon":
                    //         this.renderer.toneMapping = THREE.CineonToneMapping
                    //         break
                    //     default:
                    //         break;
                    // }
                    break
                }
            }
        })
    }

    get capabilities() {
        return this.renderer.capabilities
    }

    compile() {
        this.update_render_scene()
        let camera = this.find_component_of_type("CameraComponent").subject
        if (camera) {
            this.renderer.compile(this.render_scene, camera)
        }
    }
    handle_mousemove(evt) {
        let x = (evt.pageX - this.globals.dom_bounding_rect.left) / this.canvas.width;
        let y = (evt.pageY - this.globals.dom_bounding_rect.top) / this.canvas.height;
        this.globals.uniforms.mouse.value.x = x;
        this.globals.uniforms.mouse.value.y = y;
    }
    on_tick(time_delta) {
        this.update_render_scene()
    }
    on_destroy() {
        if (this.raf_loop) {
            this.raf_loop.stop()
        }
    }
    on_enabled() {
        this.globals.dom.appendChild(this.renderer.domElement)
        let clock = this.find_component_of_type("ClockComponent")
        this.raf_loop = clock.create(this.render.bind(this))
        // this.raf_cb_id = clock.add(this.render.bind(this))
    }
    update_render_scene() {
        let scene = this.globals.app
        scene.updateMatrixWorld()
        let render_list = []
        //scene.subject.updateMatrixWorld(true)
        scene.traverse_components((comp, object) => {
            if (comp.enabled && object.visible) {
                let render_data = comp.get_render_data()
                if (Array.isArray(render_data)) {
                    render_data.forEach(render_data => {
                        if (render_data && render_data.object) {
                            render_data.object.parent_matrix_world = render_data.parent.matrixWorld
                            // render_data.object.updateMatrixWorld(true, render_data.parent.matrixWorld)
                            render_list.push(render_data.object)
                            render_data.object.parent = this.render_scene
                        }
                    })
                } else {
                    if (render_data && render_data.object) {
                        render_data.object.parent_matrix_world = render_data.parent.matrixWorld
                        // render_data.object.updateMatrixWorld(true, render_data.parent.matrixWorld)
                        render_list.push(render_data.object)
                        render_data.object.parent = this.render_scene
                    }
                }
            }


        })

        this.render_scene.fog = scene.fog
        this.render_scene.background = scene.background
        this.render_scene.environment  = scene.environment 
        this.render_scene.children = render_list
        this.render_items_count = render_list.length

    }
    render() {

        let now = +new Date()

        if (now - this.prev_frame_time >= 1000 / this.target_fps) {
            this.prev_frame_time = now

            let camera = this.find_component_of_type("CameraComponent")
            if (camera && camera.subject) {
                this.check_size()
                this.renderer.need_render = true;
                this.renderer.need_update_render_list = true
                this.globals.stats.update('rendering', this.globals.need_render)

                if (this.custom_render_function === undefined) {
                    this.renderer.render(this.render_scene, camera.subject)
                } else {
                    this.custom_render_function(this.render_scene, camera.subject)
                }

            }
        }


    }
    check_size() {
        let camera = this.find_component_of_type("CameraComponent")
        let new_rect = this.globals.dom.getBoundingClientRect();
        if (
            new_rect.width !== this.globals.dom_bounding_rect.width ||
            new_rect.height !== this.globals.dom_bounding_rect.height
        ) {
            this.renderer.setPixelRatio(
                this.pixel_ratio
            );

            this.renderer.setPixelRatio(this.pixel_ratio)
            this.renderer.setSize(new_rect.width, new_rect.height);
            this.renderer.getSize(this.globals.uniforms.resolution.value);
            this.globals.need_render = true
            this.resolution.set(new_rect.width, new_rect.height)
            camera.aspect = this.globals.uniforms.resolution.value.x / this.globals.uniforms.resolution.value.y

        }

        this.globals.dom_bounding_rect = new_rect;
    }
}

export default RendererComponent;
