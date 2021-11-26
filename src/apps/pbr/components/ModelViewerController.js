import Component from "retro/Component";
import ResourceManager from "retro/ResourceManager";
import * as THREE from 'three';
import { log, error, is_none, console } from "retro/utils/Tools"
import { isString, isObject, isFunction, isArray, isNumber, isBoolean, isUndefined, isNull, map, filter, keys, values, set, get, unset, throttle, debounce } from "lodash-es"
import Schema from "retro/utils/Schema"

class ModelViewerController extends Component {
    radius = 14
    current_model = 0
    /**private */
    target_rotation = undefined
    tick_rate = 60
    constructor() {
        super(...arguments)
        this.target_rotation = [0, 0, 0]
        //@TODO:
        this.next_model = debounce(this.next_model, 199)
        this.prev_model = debounce(this.prev_model, 199)

    }
    get_reactive_props() {
        return [
            "current_model",
            ...super.get_reactive_props()
        ]
    }
    on_update(props) {
        super.on_update(props)
        props.forEach(prop => {
            switch (prop) {
                case "current_model": {
                    this.update_focus()
                    this.update_caption()
                    break
                }
            }
        })
    }
    on_create() {
        this.log(`created`)
        this.align_items()
        this.current_model = 0
    }
    on_start() {
        this.current_model = this.children.length - 1
    }
    align_items() {
        let items_count = this.children.length;
        let radius = this.radius
        this.children.forEach((child, index) => {
            let circle_progress = index / items_count;
            let pos_x = Math.sin(circle_progress * Math.PI * 2) * radius
            let pos_z = -Math.cos(circle_progress * Math.PI * 2) * radius
            this.log(`setting model #${index + 1} position to [${pos_x}, ${pos_z}]`)
            child.position = [
                pos_x,
                0,
                pos_z
            ]
        })
    }
    update_caption() {
        let caption = this.find_component_with_tag("current_model_title")
        if (caption) {
            caption.text = `#${this.current_model + 1}`
        }
    }
    update_focus() {
        let game_object = this.game_object;
        game_object.position = [
            0,
            0,
            -this.radius
        ]

        let current_game_object_rotation_y = this.game_object.rotation[1]
        let new_game_object_roration_y = ((this.current_model / this.children.length) * Math.PI * 2) + Math.PI

        let target_rotation = this.target_rotation = [
            0,
            new_game_object_roration_y,
            0
        ]
    }
    next_model() {
        this.current_model = (this.current_model + 1) % this.children.length
        this.log(`next_model`)
    }
    prev_model() {
        this.current_model = (this.children.length + this.current_model - 1) % this.children.length
        this.log(`prev_model`)

    }
    on_tick(time_data) {
        this.game_object.rotation = this.tools.math.lerp(
            this.game_object.rotation,
            this.target_rotation,
            0.1
        )
    }
}

export default ModelViewerController;
