
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import SceneComponent from "retro/SceneComponent";
import ResourceManager from "retro/ResourceManager";
import { SphereBufferGeometry, MeshBasicMaterial, Mesh, Object3D, Vector3 } from 'three';
import { log, error, is_none, console } from "retro/utils/Tools"
import { isString, isObject, isFunction, isArray, isNumber, isBoolean, isUndefined, isNull, map, filter, keys, values, set, get, unset } from "lodash-es"
import Schema from "retro/utils/Schema"
const $v3 = new Vector3()

class Anchor extends SceneComponent {
    parent_object = undefined
    /**private */
    get is_attached() {
        return this.parent_object !== undefined
    }
    get world_position() {
        $v3.set(0, 0, 0)
        let r = this.subject.localToWorld($v3)
        return [r.x, r.y, r.z]
    }
    on_create() {
        this.subject = new Object3D()
        this.anchor_gizmo = new Mesh(
            new SphereBufferGeometry(0.05, 2, 2),
            new MeshBasicMaterial({ wireframe: true, color: "#ff00ff" })
        )
    }
    get_render_data() {
        return [
            {
                object: this.subject,
                parent: this.parent_object,
                layers: { rendering: true }
            }
        ]
    }
    get_gizmo_render_data() {
        return [
            {
                object: this.anchor_gizmo,
                parent: this.subject,
                layers: { gizmo: true }
            }
        ]
    }
    on_destroy() {
        super.on_destroy(...arguments)
    }
    on_tick(time_data) {

    }
    get_reactive_props() {
        return [].concat(super.get_reactive_props())
    }
    on_update(props) {
        super.on_update(props)
    }
    attach_to(game_object) {
        this.parent_object = game_object === null ? undefined : game_object
    }

}

export default Anchor;