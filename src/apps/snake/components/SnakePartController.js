import Component from "retro/Component";
import ResourceManager from "retro/ResourceManager";
import * as THREE from 'three';
import { log, error, is_none, console } from "retro/utils/Tools"
import { isString, isObject, isFunction, isArray, isNumber, isBoolean, isUndefined, isNull, map, filter, keys, values, set, get, unset } from "lodash-es"
import Schema from "retro/utils/Schema"

class SnakePartController extends Component {
    snake_speed = 2
    snake_direction = Math.PI / 3
    before_part = undefined
    distance_between_parts = 1
    jam_speed = 1
    jam_delta = 0.333
    jam_min = 0.7
    jam_max = 1
    jam_phase = 0
    /*private*/
    part_direction = 0
    part_index = 0
    get is_head() {
        return this.before_part === undefined
    }
    on_create() {
        this.log(`created`)
    }
    on_tick(time_data) {
        if (this.before_part) {
            this.part_index = this.before_part.part_index + 1
        }
        this.move_part(time_data)
        this.update_jam(time_data)
    }
    move_part(time_data) {
        let direction = 0
        if (this.is_head) {
            direction = this.snake_direction
        } else {
            direction = this.tools.direction(this.game_object.position, this.before_part.game_object.position)
            // console.log(direction, this.game_object.position, this.before_part.game_object.position)
        }

        if (isNumber(direction)) {
            this.game_object.position = [
                this.game_object.position[0] + Math.sin(direction) * this.snake_speed * time_data.delta,
                this.game_object.position[1],
                this.game_object.position[2] - Math.cos(direction) * this.snake_speed * time_data.delta,
            ]
        } else if (isArray(direction)) {
            let distance = this.tools.distance(this.game_object.position, this.before_part.game_object.position)
            let distance_correction = (distance * this.snake_speed) / this.distance_between_parts
            this.game_object.position = [
                this.game_object.position[0] + direction[0] * time_data.delta * distance_correction,
                this.game_object.position[1],
                this.game_object.position[2] + direction[2] * time_data.delta * distance_correction,
            ]
        }


    }
    update_jam(time_data) {
        let before_part = this.before_part
        if (!before_part) {
            this.jam_phase = (this.jam_phase + (this.jam_speed * this.snake_speed) * time_data.delta) % 1
        } else {
            this.jam_phase = (before_part.jam_phase + this.jam_delta) % 1
        }
        let scale = (Math.sin((1 - this.jam_phase) * Math.PI) * (this.jam_max - this.jam_min)) + this.jam_min
        scale = this.tools.lerp(1, scale, (1 - 1 / (this.part_index + 1)))
        this.game_object.scale = [
            scale,
            scale,
            scale
        ]
    }
}

export default SnakePartController;
