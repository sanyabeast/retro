import SceneComponent from "retro/SceneComponent";
import ResourceManager from "retro/ResourceManager";
import { SpotLight, Color } from 'three';
import { log, error, is_none, console } from "retro/utils/Tools"
import { isString, isObject, isFunction, isArray, isNumber, isBoolean, isUndefined, isNull, map, filter, keys, values, set, get, unset, debounce, throttle } from "lodash-es"
import Schema from "retro/utils/Schema"

class Lantern extends SceneComponent {
    color = "#ffffff"
    distance = 10
    intenisty = 10
    angle = Math.PI / 6
    penumbra = 0
    decay = 2
    constructor() {
        super(...arguments)
        this.toggle_light = debounce(this.toggle_light, 150)
    }
    on_create() {
        let light = this.light = this.subject = new SpotLight(new Color(), this.intenisty, this.distance, this.angle, this.penumbra, this.decay)
        light.color.set_any(this.color)
    }
    get_render_data() {
        return [
            {
                object: this.subject,
                parent: this.globals.camera
            }
        ]
    }
    on_tick(time_data) {
        let input = this.find_component_of_type("InputComponent");
        if (input.is_keypress("q")) {
            this.toggle_light()
        }
    }
    toggle_light() {
        this.light.visible = !this.light.visible
    }
    get_reactive_props() {
        return [].concat(super.get_reactive_props())
    }
    on_update(props) {
        super.on_update(props)
    }
}

export default Lantern;
