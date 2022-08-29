
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import Component from "retro/Component";
import ResourceManager from "retro/ResourceManager";
import { Vector3 } from 'three';

import { PointerLockControls } from "retro/lib/three/examples/jsm/controls/PointerLockControls";

class PointerLockControlsComponent extends Component {
    // auto_rotate = false
    // auto_rotate_speed = 1
    // damping_factor = 1
    // enable_damping = true
    // enable_pan = true
    // enable_zoom = true
    // enable_rotate = true
    // keypan_speed = 7
    // max_polar_angle = Math.PI
    // min_polar_angle = 0
    // min_azimuth_angle = -Infinity
    // max_azimuth_angle = Infinity
    // max_zoom = Infinity
    // min_distance = 0.1
    // max_distance = Infinity
    // min_zoom = 0.01
    // pan_speed = 1
    // rotate_speed = 1
    // zoom_speed = 1
    // target = [0, 0, 0]
    // position = [0, 0, 0]
    // zoom = 1
    // keys = ["a", "w", "d", "s"]
    /**private */
    move_forward = false;
    move_backward = false;
    move_left = false;
    move_right = false;
    can_jump = false;
    velocity = new Vector3();
    direction = new Vector3();
    controls = undefined

    get_reactive_props() {
        return [
            // "auto_rotate",
            // "auto_rotate_speed",
            // "damping_factor",
            // "enable_damping",
            // "enable_pan",
            // "enable_zoom",
            // "enable_rotate",
            // "keypan_speed",
            // "max_distance",
            // "max_polar_angle",
            // "min_polar_angle",
            // "max_azimuth_angle",
            // "min_azimuth_angle",
            // "max_zoom",
            // "min_distance",
            // "min_zoom",
            // "pan_speed",
            // "rotate_speed",
            // "target",
            // "keys",
            // "zoom_speed",
            // "zoom",
            // "position"
        ].concat(super.get_reactive_props())
    }
    on_enable() {
        this.controls.enabled = true
    }
    on_disable() {
        this.controls.enabled = false
    }
    get_controls_state() {
        return {

        }
    }
    set_controls_state(data) {

    }
    // on_update(props) {
    //     super.on_update(props)
    //     let controls = this.controls
    //     props.forEach(prop => {
    //         switch (prop) {
    //             case "keys": {
    //                 controls.keys = {
    //                     LEFT: this.keys[0], //left arrow
    //                     UP: this.keys[1], // up arrow
    //                     RIGHT: this.keys[2], // right arrow
    //                     BOTTOM: this.keys[3]// down arrow
    //                 }
    //                 break;
    //             }
    //             case "target": {
    //                 controls.target = new Vector3(...this.target)
    //                 break
    //             }
    //             case "position": {
    //                 console.log(controls.object.position, this.position)
    //                 controls.object.position.set(...this.position)
    //                 console.log(controls.object.position, this.position)
    //                 break
    //             }
    //             case "zoom": {
    //                 controls.object.zoom = this.zoom
    //                 break
    //             }
    //             default: {
    //                 controls.autoRotate = this.auto_rotate
    //                 controls.autoRotateSpeed = this.auto_rotate_speed
    //                 controls.dampingFactor = this.damping_factor
    //                 controls.enableDamping = this.enable_damping
    //                 controls.enablePan = this.enable_pan
    //                 controls.enableZoom = this.enable_zoom
    //                 controls.enableRotate = this.enable_rotate
    //                 controls.keypanSpeed = this.keypan_speed
    //                 controls.maxDistance = this.max_distance
    //                 controls.maxPolarAngle = this.max_polar_angle
    //                 controls.minPolarAngle = this.min_polar_angle
    //                 controls.maxAzimuthAngle = this.max_azimuth_angle
    //                 controls.minAzimuthAngle = this.min_azimuth_angle
    //                 controls.maxZoom = this.max_zoom
    //                 controls.minDistance = this.min_distance
    //                 controls.minZoom = this.min_zoom
    //                 controls.panSpeed = this.pan_speed
    //                 controls.rotateSpeed = this.rotate_speed
    //                 controls.zoomSpeed = this.zoom_speed
    //             }
    //         }
    //     })
    // }
    on_create() {
        this.capture_control = this.capture_control.bind(this)
        this.handle_key_down = this.handle_key_down.bind(this)
        this.handle_key_up = this.handle_key_up.bind(this)

        let camera = this.find_component_of_type("CameraComponent")
        if (camera) {
            this.controls = new PointerLockControls(camera.subject, this.globals.dom);
        } else {
            console.error(`OrbitControls requires "CameraComponent" presense on scene`)
        }

        if (this.controls) {
            this.globals.dom.addEventListener('click', this.capture_control);


            document.addEventListener('keydown', this.handle_key_down);
            document.addEventListener('keyup', this.handle_key_up);

            // controls.addEventListener( 'lock', function () {

            //     instructions.style.display = 'none';
            //     blocker.style.display = 'none';

            // } );

            // controls.addEventListener( 'unlock', function () {

            //     blocker.style.display = 'block';
            //     instructions.style.display = '';

            // } );

        }
    }
    on_destroy() {
        this.globals.dom.removeEventListener('click', this.capture_control);
        document.removeEventListener('keydown', this.handle_key_down);
        document.removeEventListener('keyup', this.handle_key_up);
    }
    capture_control() {
        this.controls.lock();
    }
    handle_key_down(event) {
        switch (event.code) {

            case 'ArrowUp':
            case 'KeyW':
                this.move_forward = true;
                break;

            case 'ArrowLeft':
            case 'KeyA':
                this.move_left = true;
                break;

            case 'ArrowDown':
            case 'KeyS':
                this.move_backward = true;
                break;

            case 'ArrowRight':
            case 'KeyD':
                this.move_right = true;
                break;

            case 'Space':
                if (this.can_jump === true) this.velocity.y += 350;
                this.can_jump = false;
                break;

        }

    }
    handle_key_up(event) {

        switch (event.code) {

            case 'ArrowUp':
            case 'KeyW':
                this.move_forward = false;
                break;

            case 'ArrowLeft':
            case 'KeyA':
                this.move_left = false;
                break;

            case 'ArrowDown':
            case 'KeyS':
                this.move_backward = false;
                break;

            case 'ArrowRight':
            case 'KeyD':
                this.move_right = false;
                break;

        }

    };

    on_tick(time_data) {
        let camera = this.find_component_of_type("CameraComponent")
        camera.position[0] = camera.subject.position.x
        camera.position[1] = camera.subject.position.y
        camera.position[2] = camera.subject.position.z
        // this.controls.update();

        let controls = this.controls
        let velocity = this.velocity
        let direction = this.direction
        let move_forward = this.move_forward
        let move_backward = this.move_backward
        let move_left = this.move_left
        let move_right = this.move_right
        let can_jump = this.can_jump

        if (controls.isLocked === true) {
            const on_object = true
            const delta = time_data.delta;
            velocity.x -= velocity.x * 10.0 * delta;
            velocity.z -= velocity.z * 10.0 * delta;
            velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass
            direction.z = Number(move_forward) - Number(move_backward);
            direction.x = Number(move_right) - Number(move_left);
            direction.normalize(); // this ensures consistent movements in all directions

            if (move_forward || move_backward) velocity.z -= direction.z * 400.0 * delta;
            if (move_left || move_right) velocity.x -= direction.x * 400.0 * delta;

            if (on_object === true) {
                velocity.y = Math.max(0, velocity.y);
                can_jump = true;

            }

            controls.moveRight(- velocity.x * delta);
            controls.moveForward(- velocity.z * delta);

            controls.getObject().position.y += (velocity.y * delta); // new behavior

            if (controls.getObject().position.y < 0) {

                velocity.y = 0;
                controls.getObject().position.y = 0;

                can_jump = true;

            }

        }
    }
}

PointerLockControlsComponent.DEFAULT = {

}

export default PointerLockControlsComponent;
