
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import Component from "retro/Component";
import ResourceManager from "retro/ResourceManager";
import { log, error, is_none, console } from "retro/utils/Tools"
import { isString, isObject, isFunction, isArray, isNumber, isBoolean, isUndefined, isNull, map, filter, keys, values, set, get, unset } from "lodash-es"
import Schema from "retro/utils/Schema"

class SnakeGameController extends Component {
    user_snake = undefined
    use_first_found_snake_as_user_snake = true
    emenies = {}
    food_prefabs = [
        "snake.pickups.food_apple_1"
    ]
    enemies = {}
    food_items = {}
    active_pickups = []
    on_create() {

    }
    on_tick(time_data) {
        let input = this.find_component_of_type("InputComponent")
        if (input.is_keypress("enter")) {
            if (this.user_snake) {
                if (!this.user_snake.snake_controller.snake_moving) {
                    this.user_snake.snake_controller.start_moving()
                    let current_length_title = this.find_component_with_tag("current_length_title")
                    if (current_length_title) {
                        current_length_title.text = `CURRENT LENGTH: ${this.user_snake.snake_controller.length}`
                    }
                } else {
                    // this.user_snake.snake_controller.stop_moving()
                    // let current_length_title = this.find_component_with_tag("current_length_title")
                    // if (current_length_title) {
                    //     current_length_title.text = "PRESS `ENTER` TO START MOVING"
                    // }
                }
            } else {
                let current_length_title = this.find_component_with_tag("current_length_title")
                if (current_length_title) {
                    current_length_title.text = `NO USER SNAKES (?!)`
                }
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

        this.tools.loop.for_x(12, i => this.spawn_food())
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

        snake_controller.clear_teams()
        snake_controller.add_team("user")
        snake_controller.game_controller = this
    }
    spawn_pickup(prefab, params) {
        let position = [
            this.tools.random.range(-15, 15),
            0,
            this.tools.random.range(-15, 15)
        ]
        let game_object = this.create_game_object(ResourceManager.load_prefab(prefab, {
            ...params,
            position: position
        }))

        let id = game_object.UUID

        this.active_pickups[id] = game_object
        this.add(game_object)
    }
    spawn_food() {
        let prefab = this.tools.random.choice(this.food_prefabs)
        this.log(`prepare to spawn food "${prefab}"`)
        this.spawn_pickup(prefab, {})
    }
    despawn_pickup(pickup_controller, options) {
        let game_object = pickup_controller.game_object
        let id = game_object.UUID
        delete this.active_pickups[id]
        pickup_controller.despawn(options, () => {
            this.remove(game_object)
        })
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

        snake_controller.clear_teams()
        snake_controller.add_team("enemy")
        snake_controller.game_controller = this
        this.log(`addingt enemy snake with uuid "${uuid}"`)
    }
    handle_snake_begin_overlap(data) {
        let snake_part = data.part
        let is_head = snake_part.is_head
        let snake_controller = snake_part.snake_controller
        let is_user_snake = snake_controller.in_team("user")
        let collider = data.collider
        if (!collider) {
            this.log(`no collider`, data)
            return
        }
        if (collider.has_layer("pickup") && is_head) {
            let pickup_controller = collider.get_component("PickupController")
            let pickup_type = pickup_controller.type
            this.log(`${is_user_snake ? 'user`s' : 'enemy`s'} snake overlaps pickup: "${pickup_type}"`, data)
            switch (pickup_type) {
                case "food": {
                    snake_controller.grow()
                    this.despawn_pickup(pickup_controller, {
                        snake_part: snake_part
                    })
                    this.spawn_food()
                    if (is_user_snake) {
                        let current_length_title = this.find_component_with_tag("current_length_title")
                        if (current_length_title) {
                            current_length_title.text = `CURRENT LENGTH: ${snake_controller.length}`
                        }
                    }
                    break
                }
            }
        }

    }
    handle_snake_end_overlap(data) {
        this.log(`snake end overlap`, data)
    }
}

export default SnakeGameController;
