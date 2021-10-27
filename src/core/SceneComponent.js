/* created by @sanyabeast 8/14/2021 1:31:45 AM
 *
 *
 */

import { log , console } from "core/utils/Tools";
import Component from "core/Component";
import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { get, isObject, isArray } from "lodash-es"

let id = 0
const exclude_props = [
    "components"
]

const ANCHOR_GIZMO_GEOMETRY = new THREE.SphereBufferGeometry(0.0125, 8, 8)
const ANCHOR_GIZMO_MATERIAL = new THREE.MeshNormalMaterial({
    color: "#ff0000",
    opacity: 0.5,
    ransparent: true,
    depthWrite: false,
    depthTest: false,
    fog: false
})

class SceneComponent extends Component {
    subject = null;
    position = [0, 0, 0]
    scale = [1, 1, 1]
    rotation = [0, 0, 0]
    visible = true
    frustum_culled = false
    render_order = 0
    is_scene_component = true
    /**private */
    transform_gizmo = undefined
    anchor_gizmo = undefined
    constructor(params) {
        super(params);

        this.position = [...this.position]
        this.scale = [...this.scale]
        this.rotation = [...this.rotation]

        /**gizmos */
        let anchor_gizmo = this.anchor_gizmo = new THREE.Mesh(
            ANCHOR_GIZMO_GEOMETRY,
            ANCHOR_GIZMO_MATERIAL

        )
        anchor_gizmo.renderOrder = 1

        // const axes_gizmo = this.axes_gizmo = new THREE.AxesHelper(0.25);
        // axes_gizmo.material.depthWrite = false
        // axes_gizmo.material.depthTest = false
        // axes_gizmo.material.transparent = true
        // axes_gizmo.material.fog = false
        // axes_gizmo.renderOrder = 1
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
            "render_order"
        ].concat(super.get_reactive_props())
    }

    get_render_data() {
        return []
    }
    get_gizmo_render_data() {
        if (this.subject) {
            return [{
                object: this.anchor_gizmo,
                parent: this.subject,
                layers: { gizmo: true }
            }/*, {
                object: this.axes_gizmo,
                parent: this.subject,
                layers: { gizmo: true }
            }*/]
        } else {
            return []
        }
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
        if (isObject(this.subject)) {
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

    }

    get_render_data() {
        if (this.subject && this.object) {
            return [{
                object: this.subject,
                parent: this.object
            }]
        } else {
            return []
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
