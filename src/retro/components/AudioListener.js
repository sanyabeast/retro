import SceneComponent from "retro/SceneComponent";
import ResourceManager from "retro/ResourceManager";
import { Object3D } from 'three';
import { log, error, is_none, console } from "retro/utils/Tools"
import { isString, isObject, isFunction, isArray, isNumber, isBoolean, isUndefined, isNull, map, filter, keys, values, set, get, unset } from "lodash-es"
import Schema from "retro/utils/Schema"

class AudioListener extends SceneComponent {
    anchor = undefined
    audio_listener = undefined
    bound_object = undefined
    master_volume = 1
    /**private */
    animated_master_volume = 0
    on_create() {
        this.log(`created`)
        this.audio_listener = this.globals.audio_listener
        this.anchor = new Object3D()
    }
    on_destroy() {
        super.on_destroy(...arguments)
    }
    on_tick(time_data) {
    }
    get_render_data() {
        return [
            {
                object: this.globals.audio_listener,
                parent: this.bound_object || this.globals.camera
            }
        ]
    }
    get_reactive_props() {
        return [
            "master_volume"
        ].concat(super.get_reactive_props())
    }
    on_update(props) {
        super.on_update(props)

        props.forEach(prop => {
            switch (prop) {
                case "master_volume": {
                    this.audio_listener.setMasterVolume(this.master_volume)
                }
            }

        })
    }
}

export default AudioListener;
