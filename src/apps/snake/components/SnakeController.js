import Component from "retro/Component";
import ResourceManager from "retro/ResourceManager";
import * as THREE from 'three';
import { log, error, is_none, console } from "retro/utils/Tools"
import { isString, isObject, isFunction, isArray, isNumber, isBoolean, isUndefined, isNull, map, filter, keys, values, set, get, unset } from "lodash-es"
import Schema from "retro/utils/Schema"
import GameObject from "retro/GameObject";

class SnakeController extends Component {
    start_length = 3
    snake_part_prefab = "snake.actors.snake_part"

    /**private */
    parts = undefined
    get length() { return this.parts.length; }
    get last_part() { return this.parts[this.parts.length - 1]; }
    on_create() {
        this.parts = []
        let persistent_parts = this.find_child_components_of_type("SnakePartController")
        persistent_parts.forEach((snake_part) => {
            this.parts.push(snake_part)
        })
        this.log(`created`)
        for (let a = 0; a < this.start_length; a++) {
            this.grow()
        }
    }
    grow() {
        let snake_part_prefab = ResourceManager.load_prefab(this.snake_part_prefab, {
            "components.controller.params.before_part": this.last_part
        })
        let part_object = new GameObject(snake_part_prefab)
        console.log(part_object, snake_part_prefab, this)
        this.parts.push(part_object)
        this.add(part_object)
    }
    on_tick(time_data) {

    }
}

export default SnakeController;
