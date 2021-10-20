
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import Component from "core/Component";
import AssetManager from "core/utils/AssetManager";
import * as THREE from 'three';

import OrbitControls from "three/examples/js/controls/OrbitControls"

class OrbitControlsComponent extends Component {
    auto_rotate = false
    auto_rotate_speed = 1
    damping_factor = 1
    enable_damping = true
    enable_pan = true
    enable_zoom = true
    enable_rotate = true
    keypan_speed = 7
    max_distance = Infinity
    max_polar_angle = Math.PI
    max_zoom = Infinity
    min_distance = 0.1
    min_zoom = 0.01
    pan_speed = 1
    rotate_speed = 1
    target = [0, 0, 0]
    keys = ["a", "w", "d", "s"]
    /**private */
    controls = undefined
    get_reactive_props() {

        return [
            "auto_rotate",
            "auto_rotate_speed",
            "damping_factor",
            "enable_damping",
            "enable_pan",
            "enable_zoom",
            "enable_rotate",
            "keypan_speed",
            "max_distance",
            "max_polar_angle",
            "max_zoom",
            "min_distance",
            "min_zoom",
            "pan_speed",
            "rotate_speed",
            "target",
            "keys"
        ].concat(super.get_reactive_props())
    }
    on_update(props) {
        let controls = this.controls
        props.forEach(prop => {
            switch (prop) {
                case "keys": {
                    controls.keys = {
                        LEFT: this.keys[0], //left arrow
                        UP: this.keys[1], // up arrow
                        RIGHT: this.keys[2], // right arrow
                        BOTTOM: this.keys[3]// down arrow
                    }
                    break;
                }
                case "target": {
                    controls.target = new THREE.Vector3(...this.target)
                    break
                }
                default: {
                    controls.autoRotate = this.auto_rotate
                    controls.autoRotateSpeed = this.auto_rotate_speed
                    controls.dampingFactor = this.damping_factor
                    controls.enableDamping = this.enable_damping
                    controls.enablePan = this.enable_pan
                    controls.enableZoom = this.enable_zoom
                    controls.enableRotate = this.enable_rotate
                    controls.keypanSpeed = this.keypan_speed
                    controls.maxDistance = this.max_distance
                    controls.maxPolarAngle = this.max_polar_angle
                    controls.maxZoom = this.max_zoom
                    controls.minDistance = this.min_distance
                    controls.minZoom = this.min_zoom
                    controls.panSpeed = this.pan_speed
                    controls.rotateSpeed = this.rotate_speed
                }
            }
        })
    }
    on_created() {
        let camera = this.find_component_of_type("CameraComponent")
        if (camera) {
            const controls = this.controls = new OrbitControls.OrbitControls(camera.subject, this.globals.dom);
        } else {
            console.error(`OrbitControls requires "CameraComponent" presense on scene`)
        }
    }
    on_tick(time_delta) {
        this.controls.update();
    }
}

OrbitControlsComponent.DEFAULT = {
    auto_rotate: false,
    auto_rotate_speed: 1,
    damping_factor: 1,
    enable_damping: true,
    enable_pan: true,
    enable_zoom: true,
    enable_rotate: true,
    keypan_speed: 7,
    max_distance: Infinity,
    max_polar_angle: Math.PI,
    max_zoom: Infinity,
    min_distance: 0.1,
    min_zoom: 0.01,
    pan_speed: 1,
    rotate_speed: 1,
    target: [0, 0, 0],
    keys: ["a", "w", "d", "s"],
}

export default OrbitControlsComponent;
