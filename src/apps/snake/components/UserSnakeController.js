
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import Component from "retro/Component";
import ResourceManager from "retro/ResourceManager";
import * as THREE from 'three';
import { log, error, is_none, console } from "retro/utils/Tools"
import { isString, isObject, isFunction, isArray, isNumber, isBoolean, isUndefined, isNull, map, filter, keys, values, set, get, unset } from "lodash-es"
import Schema from "retro/utils/Schema"

class UserSnakeController extends Component {
    snake_controller = undefined
    on_create() {
        this.log(`created`)
        let snake_controller = this.snake_controller = this.get_component("SnakeController")
    }
    on_tick(time_data) {
        let input = this.find_component_of_type("InputComponent")
        if (input.is_keypress("d")) {
            this.snake_controller.steer_right(time_data.delta)
        } else if (input.is_keypress("a")) {
            this.snake_controller.steer_left(time_data.delta)
        }

        if (input.is_keypress("space")) {
            this.snake_controller.grow()
        }
    }
}

export default UserSnakeController;