
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import SceneComponent from "core/SceneComponent";
import ResourceManager from "core/ResourceManager";
import * as THREE from 'three';
import { map, forEach } from "lodash-es"
import { makeid } from "core/utils/Tools"
import RenderTarget from "core/components/scene/RenderTarget";
import Collider from "core/components/Collider";

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

class InputComponent extends SceneComponent {
    detection_mode = "raycast"
    raycasting = true
    pointer_position = undefined
    pointer_position_abs = undefined
    intersected_renderables_changed = false
    pointer_position_changed = true
    tick_rate = 60
    /**debug */
    show_debug_layer = false
    /**private */
    prev_camera_matrix = undefined
    user_input_dom = undefined
    /**colorid */
    colorid_changed = false
    colorid_current_collider = undefined
    colorid_render_target_state = undefined
    colorid_debug_plane = undefined
    colorid_resolution = 0.25
    colliders_state = undefined
    intersected_renderables = undefined
    intersected_colliders = undefined
    constructor() {
        super(...arguments)
        this.colliders_state = {}
        this.intersected_renderables = []
        this.intersect_colliders = []
        this.pointer_position = new THREE.Vector2(0, 0)
        this.pointer_position_abs = new THREE.Vector2(0, 0)
    }
    on_create() {
        this.user_input_dom = document.createElement("div");
        this.user_input_dom.style.width = "100%";
        this.user_input_dom.style.height = "100%";
        this.user_input_dom.style.position = "absolute";
        this.user_input_dom.style.top = "0";
        this.user_input_dom.style.left = "0";
        this.user_input_dom.style.userSelect = "none"
        this.user_input_dom.style.zIndex = " 1"
        this.user_input_dom.classList.add("user-input-dom")

        this.globals.dom.appendChild(this.user_input_dom)

        this.handle_keydown = this.handle_keydown.bind(this)
        this.handle_keyup = this.handle_keyup.bind(this)
        this.handle_keypress = this.handle_keypress.bind(this)
        this.handle_mousemove = this.handle_mousemove.bind(this)
        this.handle_mouseover = this.handle_mouseover.bind(this)
        this.handle_mousedown = this.handle_mousedown.bind(this)
        this.handle_mouseup = this.handle_mouseup.bind(this)
        this.handle_click = this.handle_click.bind(this)
        this.handle_mouseout = this.handle_mouseout.bind(this)

        switch (this.detection_mode) {
            case "colorid": {
                this.setup_colorid()
                break
            }
            case "raycast": {
                this.update_raycast()
            }
        }

        this.define_global_var("input-dom", a => this.user_input_dom)
    }
    on_destroy() {
        super.on_destroy(...arguments)
        this.globals.dom.removeChild(this.user_input_dom)
    }
    get_gizmo_render_data() {
        return [{
            object: this.colorid_debug_plane,
            visible: this.show_debug_layer
        }]
    }
    setup_colorid() {
        let render_target_state = this.colorid_render_target_state = RenderTarget.get_render_target({
            resolution_scale: this.colorid_resolution,
            mag_filter: "nearest"
        })

        let colorid_debug_plane = this.colorid_debug_plane = new THREE.objects.FullscreenRect({
            map: `rt:${render_target_state.id}`,
            scale: 1,
            opacity: 0.5
        })

    }
    update_colorid() {
        this.colorid_changed = false

        let camera = this.globals.camera
        let renderer = this.find_component_of_type("Renderer")
        if (camera) {
            this.colorid_render_target_state.copy_camera(camera)
        }
        if (renderer) {
            this.colorid_render_target_state.update_render_list(renderer, { colorid: true })
            this.colorid_render_target_state.setup_scene(undefined, "#000000")
            // this.colorid_render_target_state.render(renderer, true)
            let pixel_color = this.colorid_render_target_state.pick(
                renderer,
                this.pointer_position_abs
            )
            let collider = Collider.color_id_get_with_rgb(...pixel_color)
            if (collider) {
                if (collider && !this.colorid_current_collider) this.colorid_changed = true
                if (!collider && this.colorid_current_collider) this.colorid_changed = true
                if (collider && this.colorid_current_collider) {
                    if (collider.collider_id !== this.colorid_current_collider.collider_id) {
                        this.colorid_changed = true
                    }
                }
                this.colorid_current_collider = collider

            }
        }
    }
    update_raycast(event_type) {
        let camera = this.find_component_of_type("CameraComponent");
        let renderer = this.find_component_of_type("Renderer")

        if (camera && renderer) {
            if (camera.moved || this.pointer_position_changed) {
                let changed = false
                let raycasted_objects_list = renderer.get_object_layer_list({ raycast: true })
                mouse.x = this.pointer_position.x
                mouse.y = -this.pointer_position.y
                raycaster.setFromCamera(mouse, camera.subject);
                let intersect_data = []
                intersect_data = raycaster.intersectObjects(raycasted_objects_list, true)
                forEach(this.colliders_state, state => state.changed = false)

                this.intersected_renderables = map(intersect_data, data => data.object)
                this.intersected_colliders = map(intersect_data, data => data.object.collider)
                let uuids = []

                forEach(intersect_data, intersection => {
                    let object = intersection.object
                    let collider = object.collider
                    let UUID = collider.UUID
                    this.colliders_state[UUID] = this.colliders_state[UUID] || { hovered: false, pressed: false }
                    let state = this.colliders_state[UUID]
                    if (!state.hovered) {
                        state.UUID = UUID
                        changed = true
                        state.changed = true
                        state.hovered = true
                    }
                })
                forEach(this.colliders_state, (state, UUID) => {
                    if (uuids.indexOf(UUID) < 0) {
                        if (state.hovered) {
                            changed = true
                            state.changed = true
                            state.hovered = false
                        }
                    }

                    if (state.changed) {
                        let collider = ResourceManager.get_component_instance("Collider", state.UUID)
                        if (collider) {
                            if (state.hovered) {
                                collider.game_object.call_down("handle_pointerover", {
                                    collider: collider
                                })
                            } else {
                                collider.game_object.call_down("handle_pointerout", {
                                    collider: collider
                                })
                            }
                        }
                    }
                })
                this.intersected_renderables_changed = changed
            }
        }
    }
    on_enable() {
        window.addEventListener('keydown', this.handle_keydown)
        window.addEventListener('keyup', this.handle_keyup)
        window.addEventListener('keypress', this.handle_keypress)
        window.addEventListener('mousemove', this.handle_mousemove)
        window.addEventListener('mouseover', this.handle_mouseover)
        window.addEventListener('mousedown', this.handle_mousedown)
        window.addEventListener('mouseup', this.handle_mouseup)
        window.addEventListener('click', this.handle_click)
        window.addEventListener('mouseout', this.handle_mouseout)
    }
    on_disable() {
        window.removeEventListener('keydown', this.handle_keydown)
        window.removeEventListener('keyup', this.handle_keyup)
        window.removeEventListener('keypress', this.handle_keypress)
        window.removeEventListener('mousemove', this.handle_mousemove)
        window.removeEventListener('mouseover', this.handle_mouseover)
        window.removeEventListener('mousedown', this.handle_mousedown)
        window.removeEventListener('mouseup', this.handle_mouseup)
        window.removeEventListener('click', this.handle_click)
        window.removeEventListener('mouseout', this.handle_mouseout)
    }
    on_tick(time_delta) {
        switch (this.detection_mode) {
            case "colorid": {
                this.update_colorid()
                break
            }
            case "raycast": {
                this.update_raycast()
                break
            }
        }
        this.pointer_position_changed = false
    }
    handle_keydown(evt) {
        // console.log(`keydown`, evt)
    }
    handle_keyup(evt) {
        // console.log(`keyup`, evt)
    }
    handle_keypress(evt) {
        // console.log(`keypress`, evt)
    }
    equal_with_precise(a, b, prec) {
        return parseFloat(a.toFixed(prec)) === parseFloat(b.toFixed(prec))
    }
    handle_mousemove(evt) {
        let dom_rect = this.globals.dom_rect
        let new_x = (((evt.pageX - dom_rect.x) / dom_rect.width) - 0.5) * 2
        let new_y = (((evt.pageY - dom_rect.y) / dom_rect.height) - 0.5) * 2

        this.pointer_position_changed = (!this.equal_with_precise(new_x, this.pointer_position.x, 5) || !this.equal_with_precise(new_y, this.pointer_position.y, 5))
        this.pointer_position.x = new_x
        this.pointer_position.y = new_y

        this.pointer_position_abs.x = evt.pageX - dom_rect.x
        this.pointer_position_abs.y = evt.pageY - dom_rect.y
        // console.log(`mousemove`, evt)
    }
    handle_mouseover(evt) {
        // console.log(`mouseover`, evt)
    }
    handle_mousedown(evt) {
        // console.log(`mousedown`, evt)
    }
    handle_mouseup(evt) {
        // console.log(`mouseup`, evt)
    }
    handle_click(evt) {
        // console.log(`click`, evt)
    }
    handle_mouseout(evt) {
        // console.log(`mouseout`, evt)
    }

}

export default InputComponent;
