import SceneComponent from "core/SceneComponent";
import ResourceManager from "core/ResourceManager";
import * as THREE from 'three';
import { log, error, is_none, console } from "core/utils/Tools"
import { isString, isObject, isFunction, isArray, isNumber, isBoolean, isUndefined, isNull, map, filter, keys, values, set, get, unset } from "lodash-es"
import Schema from "core/utils/Schema"

class AudioListener extends SceneComponent {
    anchor = undefined
    audio_listener = undefined
    on_create() {
        this.log(`created`)
        this.audio_listener = this.globals.audio_listener
        this.anchor = new THREE.Object3D()
    }
    on_destroy() {
        super.on_destroy(...arguments)
    }
    on_tick(time_delta) {

    }
    get_render_data() {
        return [
            {
                object: this.globals.audio_listener,
                parent: this.globals.camera
            }
        ]
    }
    get_reactive_props() {
        return [].concat(super.get_reactive_props())
    }
    on_update(props) {
        super.on_update(props)
    }
}

export default AudioListener;
