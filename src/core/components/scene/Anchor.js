
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import SceneComponent from "core/SceneComponent";
import ResourceManager from "core/ResourceManager";
import * as THREE from 'three';
import { log, error, is_none, console } from "core/utils/Tools"
import { isString, isObject, isFunction, isArray, isNumber, isBoolean, isUndefined, isNull, map, filter, keys, values, set, get, unset } from "lodash-es"
import Schema from "core/utils/Schema"
const $v3 = new THREE.Vector3()

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
        this.meta.layers.rendering = false
        this.meta.layers.gizmo = true

        this.subject = new THREE.Mesh(
            new THREE.BoxBufferGeometry(0.1, 0.1, 0.1, 1),
            new THREE.MeshBasicMaterial({ wireframe: true, color: "#00bcd4" })
        )
    }
    get_render_data() {
        return [
            {
                object: this.subject,
                parent: this.parent_object
            }
        ]
    }
    on_destroy() {
        super.on_destroy(...arguments)
    }
    on_tick(time_delta) {

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