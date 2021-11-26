
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
    use_first_found_snake_as_user_snake = true
    emenies = undefined
    all_pickups = undefined
    pickups = undefined
    food_prefabs = undefined
    food_items = undefined
    constructor() {
        super(...arguments)
        this.enemies = {}
        this.pickups = {}
        this.all_pickups = {}
        this.food_items = {}
        this.food_prefabs = [
            "snake.pickups.food_apple_1"
        ]
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
            if (index === 0 && this.use_first_found_snake_as_user_snake === true) {
                this.register_user_snake(snake_controller)
            } else {
                this.register_enemy_snake(snake_controller)
            }
        })

        this.spawn_food()
        this.spawn_food()
        this.spawn_food()
        this.spawn_food()
        this.spawn_food()
        this.spawn_food()
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
    spawn_pickup(prefab, params) {
        let position = [
            this.tools.random.range(-15, 15),
            0,
            this.tools.random.range(-15, 15)
        ]
        console.log(position)
        console.log(ResourceManager.load_prefab(prefab, {
            ...params,
            position: position
        }))
        let game_object = this.create_game_object(ResourceManager.load_prefab(prefab, {
            ...params,
            position: position
        }))
        this.add(game_object)
    }
    spawn_food() {
        let prefab = this.tools.random.choice(this.food_prefabs)
        this.log(`prepare to spawn food "${prefab}"`)
        this.spawn_pickup(prefab, { })
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
