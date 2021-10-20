
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import Component from "core/Component";
import AssetManager  from "core/utils/AssetManager";
import * as THREE from 'three';

class InputComponent extends Component {
    pointer_position = new THREE.Vector2(0, 0)
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
    on_enabled(){
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
    on_disabled(){
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
        
    }
    handle_keydown (evt) {
        // console.log(`keydown`, evt)
    }
    handle_keyup (evt) {
        // console.log(`keyup`, evt)
    }
    handle_keypress (evt) {
        // console.log(`keypress`, evt)
    }

    handle_mousemove (evt) {
        this.pointer_position.x = evt.pageX
        this.pointer_position.y = evt.pageY
        // console.log(`mousemove`, evt)
    }
    handle_mouseover (evt) {
        // console.log(`mouseover`, evt)
    }
    handle_mousedown (evt) {
        // console.log(`mousedown`, evt)
    }
    handle_mouseup (evt) {
        // console.log(`mouseup`, evt)
    }
    handle_click (evt) {
        // console.log(`click`, evt)
    }
    handle_mouseout (evt) {
        // console.log(`mouseout`, evt)
    }
}

export default InputComponent;
