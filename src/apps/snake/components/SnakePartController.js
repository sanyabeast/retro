import Component from "retro/Component";
import ResourceManager from "retro/ResourceManager";
import * as THREE from 'three';
import { log, error, is_none, console } from "retro/utils/Tools"
import { isString, isObject, isFunction, isArray, isNumber, isBoolean, isUndefined, isNull, map, filter, keys, values, set, get, unset } from "lodash-es"
import Schema from "retro/utils/Schema"

class SnakePartController extends Component {
    speed = 0.1
    snake_direction = Math.PI / 3
    before_part = undefined
    /*private*/
    part_direction = 0
    get is_head() {
        return this.before_part === undefined
    }
    on_create() {
        this.log(`created`)
    }
    on_tick(time_data) {
        if (this.is_head) {
            //this.log(`head`)
            this.move_part(time_data)
        } else {
            //this.log(`not head`)
        }
    }
    move_part(time_data) {
        let direction = 0
        if (this.is_head) {
            direction = this.snake_direction
        } else {
            direction = 
        }

        this.game_object.position = [
            this.game_object.position[0] + Math.sin(direction) * this.speed * time_data.delta,
            this.game_object.position[1],
            this.game_object.position[2] - Math.cos(direction) * this.speed * time_data.delta,
        ]
    }
}

export default SnakePartController;
