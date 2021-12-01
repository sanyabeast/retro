
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import Component from "retro/Component";
import ResourceManager from "retro/ResourceManager";
import { log, error, is_none, console } from "retro/utils/Tools"
import { isString, isObject, isFunction, isArray, isNumber, isBoolean, isUndefined, isNull, map, filter, keys, values, set, get, unset } from "lodash-es"
import Schema from "retro/utils/Schema"

class SnakeBotController extends Component {
    target_location = undefined
    behaviour_model = "random"
    behaviour_model_random_params = undefined
    snake_controller = undefined
    target_location_switch_smoothing = 0.5
    direction_switch_smooting = 0.2
    smoothed_target_location = [0, 0, 0]
    constructor() {
        super(...arguments)
        this.target_location = [0, 0, 0]
        this.behaviour_model_random_params = {
            target_location_range: [
                [-40, 0, -40],
                [40, 0, 40]
            ],
            target_location_switch_rate: 10000,
            target_location_last_switch_date: +new Date,
        }
    }
    on_start() {
        this.snake_controller.start_moving()
    }
    on_create() {
        // this.log(`created`)
        let snake_controller = this.snake_controller = this.get_component("SnakeController")
    }
    on_tick(time_data) {
        this.update_behaviour_model(time_data)
        this.move_to_target(time_data)
        //this.log(`kek`)
    }
    move_to_target(time_data) {
        let direction = this.tools.math.direction(this.snake_controller.position, this.target_location)
        //this.log(direction)
        if (!isArray(this.snake_controller.snake_direction)) {
            this.snake_controller.snake_direction = [0, 0, 0]
        }
        this.snake_controller.snake_direction = this.tools.math.lerp(
            this.snake_controller.snake_direction,
            direction,
            this.tools.math.clamp(1 - this.direction_switch_smooting, 0, 1) * time_data.delta
        )
    }
    on_gizmo_draw() {
        return [
            {
                type: "sphere",
                radius: 0.2,
                wireframe: true,
                opacity: 0.2,
                position: this.target_location,
                color: this.snake_controller.color
            }
        ]
    }
    update_behaviour_model(time_data) {
        switch (this.behaviour_model) {
            case "random": return this.update_behaviour_model_random(time_data)
        }
    }
    update_behaviour_model_random() {
        let now = +new Date()
        let time_since_last_update = now - this.behaviour_model_random_params.target_location_last_switch_date
        if (time_since_last_update > this.behaviour_model_random_params.target_location_switch_rate) {
            this.behaviour_model_random_params.target_location_last_switch_date = now
            let new_target_location = [
                this.tools.random.range(
                    this.behaviour_model_random_params.target_location_range[0][0],
                    this.behaviour_model_random_params.target_location_range[1][0]
                ),
                this.tools.random.range(
                    this.behaviour_model_random_params.target_location_range[0][1],
                    this.behaviour_model_random_params.target_location_range[1][1]
                ),
                this.tools.random.range(
                    this.behaviour_model_random_params.target_location_range[0][2],
                    this.behaviour_model_random_params.target_location_range[1][2]
                ),
            ]

            this.target_location = new_target_location
            // this.log(`update random bm`)
        }
    }
}

export default SnakeBotController;