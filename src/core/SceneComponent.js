/* created by @sanyabeast 8/14/2021 1:31:45 AM
 *
 *
 */

import { log } from "core/utils/Tools";
import Component from "core/Component";
import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

let id = 0
const exclude_props = [
    "components"
]

class SceneComponent extends Component {
    subject = null;
    position = [0, 0, 0]
    scale = [1, 1, 1]
    rotation = [0, 0, 0]
    visible = true
    frustum_culled = false
    render_layer = 0
    render_index = 0
    render_order = 0
    debug_transform = false
    is_scene_component = true
    /**private */
    transform_gizmo = undefined
    constructor(params) {
        super(params);
        this.position = [...this.position]
        this.scale = [...this.scale]
        this.rotation = [...this.rotation]

    }
    save_prefab() {
        let r = {
            ...super.save_prefab(),
            position: this.position,
            scale: this.scale,
            rotation: this.rotation,
            visible: this.visible,
            render_layer: this.render_layer,
            render_index: this.render_index,
            render_order: this.render_order,
            frustum_culled: this.frustum_culled,
        }
        return r
    }
    get_reactive_props() {
        return [
            "position",
            "scale",
            "rotation",
            "visible",
            "frustum_culled",
            "render_layer",
            "render_index",
            "render_order"
        ].concat(super.get_reactive_props())
    }
    init_visibility_rule() {
        if (typeof this.visibility_rule === "function") {
            Object.defineProperty(subject, "visible", {
                get: () => {
                    return this.visibility_rule()
                }
            })
        }
    }
    on_update(props) {
        if (this.subject instanceof THREE.Object3D) {
            props.forEach((prop) => {
                switch (prop) {
                    case "position": {
                        if (Array.isArray(this.position)) {
                            this.subject.position.set(
                                this.position[0],
                                this.position[1],
                                this.position[2]
                            );
                        } else if (typeof this.position === "object") {
                            this.subject.position.set(
                                this.position.x,
                                this.position.y,
                                this.position.z
                            )
                        }

                        break;
                    }
                    case "scale": {
                        if (Array.isArray(this.scale)) {
                            this.subject.scale.set(
                                this.scale[0],
                                this.scale[1],
                                this.scale[2]
                            );
                        } else if (typeof this.scale === "object") {
                            this.subject.scale.set(
                                this.scale.x,
                                this.scale.y,
                                this.scale.z
                            )
                        }

                        break;
                    }
                    case "rotation": {
                        if (Array.isArray(this.rotation)) {
                            this.subject.rotation.set(
                                this.rotation[0],
                                this.rotation[1],
                                this.rotation[2]
                            );
                        } else if (typeof this.rotation === "object") {
                            this.subject.rotation.set(
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
                    case "render_layer": {
                        this.subject.render_layer = this.render_layer;
                        break
                    }
                    case "render_index": {
                        this.subject.render_index = this.render_index;
                        break
                    }
                    case "render_order": {
                        this.subject.renderOrder = this.render_order;
                        break
                    }
                }
            })
        } else {
            return false
        }
    }

    on_tick() {
        if (this.debug_transform) {
            let camera = this.find_component_of_type("CameraComponent")
            if (!this.transform_gizmo) {
                this.transform_gizmo = new TransformControls(camera, this.globals.dom)
            }
            if (!this.transform_gizmo.parent) {
                this.transform_gizmo.camera = camera.subject
                this.transform_gizmo.attach(this.subject)
            }
        }

    }

    get_render_data() {
        if (this.enabled && this.subject && this.object) {
            return {
                object: this.subject,
                parent: this.object
            }
        }
    }
    set_position(x, y, z) {
        this.position = [
            x === undefined ? this.position[0] : x,
            y === undefined ? this.position[1] : y,
            z === undefined ? this.position[2] : z,
        ]
    }

    set_scale(x, y, z) {
        this.scale = [
            x === undefined ? this.scale[0] : x,
            y === undefined ? this.scale[1] : y,
            z === undefined ? this.scale[2] : z,
        ]
    }

    set_rotation(x, y, z) {
        this.rotation = [
            x === undefined ? this.rotation[0] : x,
            y === undefined ? this.rotation[1] : y,
            z === undefined ? this.rotation[2] : z,
        ]
    }
}

SceneComponent.component_name = "SceneComponent";

SceneComponent.DEFAULT = {
    position: [0, 0, 0],
    scale: [1, 1, 1],
    rotation: [0, 0, 0]
}

export default SceneComponent;
