
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import Component from "retro/Component";
import ResourceManager from "retro/ResourceManager";
import { Vector3 } from 'three';

import MapControls from "three/examples/js/controls/OrbitControls"

class MapControlsComponent extends Component {
    auto_rotate = false
    auto_rotate_speed = 1
    damping_factor = 1
    enable_damping = true
    enable_pan = true
    enable_zoom = true
    enable_rotate = true
    keypan_speed = 7
    max_polar_angle = Math.PI
    min_polar_angle = 0
    min_azimuth_angle = -Infinity
    max_azimuth_angle = Infinity
    max_zoom = Infinity
    min_distance = 0.1
    max_distance = Infinity
    min_zoom = 0.01
    pan_speed = 1
    rotate_speed = 1
    zoom_speed = 1
    target = [0, 0, 0]
    position = [0, 0, 0]
    zoom = 1
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
            "min_polar_angle",
            "max_azimuth_angle",
            "min_azimuth_angle",
            "max_zoom",
            "min_distance",
            "min_zoom",
            "pan_speed",
            "rotate_speed",
            "target",
            "keys",
            "zoom_speed",
            "zoom",
            "position"
        ].concat(super.get_reactive_props())
    }
    on_enable() {
        this.controls.enabled = true
    }
    on_disable() {
        this.controls.enabled = false
    }
    on_destroy() {
        this.controls.dispose()
    }
    get_controls_state() {
        return {
            target: [this.controls.target.x, this.controls.target.y, this.controls.target.z],
            position: [this.controls.object.position.x, this.controls.object.position.y, this.controls.object.position.z],
            zoom: this.controls.object.zoom
        }
    }
    set_controls_state(data) {
        this.target = data.target || [0, 0, 0]
        this.position = data.position || [0, 0, -10]
        this.zoom = data.zoom || 1
    }
    on_update(props) {
        super.on_update(props)
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
                    controls.target = new Vector3(...this.target)
                    break
                }
                case "position": {
                    controls.object.position.set(...this.position)
                    break
                }
                case "zoom": {
                    controls.object.zoom = this.zoom
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
                    controls.minPolarAngle = this.min_polar_angle
                    controls.maxAzimuthAngle = this.max_azimuth_angle
                    controls.minAzimuthAngle = this.min_azimuth_angle
                    controls.maxZoom = this.max_zoom
                    controls.minDistance = this.min_distance
                    controls.minZoom = this.min_zoom
                    controls.panSpeed = this.pan_speed
                    controls.rotateSpeed = this.rotate_speed
                    controls.zoomSpeed = this.zoom_speed
                }
            }
        })
    }
    on_create() {
        this.controls = new MapControls.MapControls(this.globals.camera, this.globals.dom);
    }
    on_tick(time_data) {
        this.controls.update();
    }
}

MapControlsComponent.DEFAULT = {
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
    min_distance: 0.01,
    min_zoom: 0.01,
    pan_speed: 1,
    rotate_speed: 1,
    target: [0, 0, 0],
    keys: ["a", "w", "d", "s"],
}

export default MapControlsComponent;
