
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

class SnakeGameController extends Component {
    user_snake = undefined
    emenies = undefined
    constructor() {
        super(...arguments)
        this.enemies = {}
    }
    on_create() {

    }
    on_tick(time_data) {
        let input = this.find_component_of_type("InputComponent")
        if (input.is_keypress("enter")) {
            if (this.user_snake) {
                this.user_snake.snake_controller.start_moving()
            } else {
                this.log(`no user snakes found`)
            }
        }
    }
    on_start() {
        let snakes = this.find_components_of_type("SnakeController")
        snakes.forEach((snake_controller, index) => {
            if (index === 0) {
                this.register_user_snake(snake_controller)
            } else {
                this.register_enemy_snake(snake_controller)
            }
        })
    }
    register_user_snake(snake_controller) {

        let user_snake_controller = snake_controller.get_component("UserSnakeController")
        if (user_snake_controller === undefined) {
            snake_controller.add_component({
                name: "UserSnakeController",
                params: {
                    pass: true
                }
            })
        }
        this.log(`registering user snake with uuid "${snake_controller.UUID}"`)
        this.user_snake = {
            snake_controller,
            user_controller: user_snake_controller
        }
        console.log(user_snake_controller)
    }
    register_enemy_snake(snake_controller, params) {
        let uuid = snake_controller.UUID

        let bot_controller = snake_controller.get_component("SnakeBotController")
        if (bot_controller === undefined) {
            snake_controller.add_component({
                name: "SnakeBotController",
                params: {
                    pass: true,
                    ...params
                }
            })
        }
        this.enemies[uuid] = {
            snake_controller,
            bot_controller
        }
        this.log(`addingt enemy snake with uuid "${uuid}"`)
    }
}

export default SnakeGameController;
