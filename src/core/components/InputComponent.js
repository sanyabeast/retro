
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import Component from "core/Component";
import AssetManager from "core/utils/AssetManager";
import * as THREE from 'three';
import { map } from "lodash-es"

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

class InputComponent extends Component {
    raycasting = true
    pointer_position = new THREE.Vector2(0, 0)
    raycasting_intersects = []
    intersected_objects = []
    intersected_objects_ids = {}
    intersected_objects_changed = false
    pointer_position_changed = true
    /**private */
    prev_camera_matrix = undefined

    on_created() {
        this.handle_keydown = this.handle_keydown.bind(this)
        this.handle_keyup = this.handle_keyup.bind(this)
        this.handle_keypress = this.handle_keypress.bind(this)
        this.handle_mousemove = this.handle_mousemove.bind(this)
        this.handle_mouseover = this.handle_mouseover.bind(this)
        this.handle_mousedown = this.handle_mousedown.bind(this)
        this.handle_mouseup = this.handle_mouseup.bind(this)
        this.handle_click = this.handle_click.bind(this)
        this.handle_mouseout = this.handle_mouseout.bind(this)
    }
    on_enabled() {
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
    on_disabled() {
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
        if (this.raycasting) {
            this.update_raycasting_state();
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
    update_raycasting_state(event_type) {
        let camera = this.find_component_of_type("CameraComponent");
        let renderer = this.find_component_of_type("Renderer")

        if (camera && renderer) {
            if (camera.moved || this.pointer_position_changed) {
                console.log(`cheking intersects... (pointer moved: ${this.pointer_position_changed}, camera moved: ${camera.moved})`)
                let changed = false
                let new_intersected_object_ids = {}
                let raycasted_objects_list = renderer.get_object_layer_list({ raycast: true })
                mouse.x = this.pointer_position.x
                mouse.y = this.pointer_position.y
                raycaster.setFromCamera(mouse, camera.subject);
                const intersects = this.raycasting_intersects = raycaster.intersect_objects(raycasted_objects_list)
                const intersected_objects = this.intersected_objects = map(intersects, data => {
                    new_intersected_object_ids[data.object.uuid] = true
                    if (this.intersected_objects_ids[data.object.uuid] !== new_intersected_object_ids[data.object.uuid]) {
                        changed = true
                    }

                    return data.object
                })

                this.intersected_objects_ids = new_intersected_object_ids
                this.intersected_objects_changed = changed
            }
        } else {
            this.raycasting_intersects = []
            this.intersect_objects = []
        }
    }
}

export default InputComponent;
