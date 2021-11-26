import Component from "retro/Component";
import ResourceManager from "retro/ResourceManager";
import { log, error, is_none, console } from "retro/utils/Tools"
import { isString, isObject, isFunction, isArray, isNumber, isBoolean, isUndefined, isNull, map, filter, keys, values, set, get, unset } from "lodash-es"
import Schema from "retro/utils/Schema"

class SnakePartController extends Component {
    color = "#ff0000"
    snake_speed = 2
    snake_direction = Math.PI / 3
    before_part = undefined
    distance_between_parts = 0.5
    jam_speed = 1
    jam_delta = 0.333
    jam_min = 0.7
    jam_max = 1
    jam_phase = 0
    flexibility = 0.7
    position = undefined
    /*private*/
    part_direction = 0
    part_index = 0
    mesh_comp = undefined
    grow_cycle = 0
    grow_speed = 0.7
    constructor() {
        super(...arguments)
        this.position = this.position || [0, 0, 0]
    }
    get is_head() {
        return this.before_part === undefined
    }
    on_create() {
        this.log(`created`)
        let mesh_comp = this.mesh_comp = this.get_component("MeshComponent")
        mesh_comp.subject.material.color.set_any(this.color)
        console.log(mesh_comp)

        if (this.before_part) {
            this.game_object.position = this.before_part.game_object.position
        }
    }
    on_tick(time_data) {
        if (this.before_part) {
            this.part_index = this.before_part.part_index + 1
        }

        this.move_part(time_data)
        this.update_jam(time_data)

        if (this.before_part && this.before_part.color !== this.color) {
            this.color = this.before_part.color
        }
        this.position[0] = this.game_object.position[0]
        this.position[1] = this.game_object.position[1]
        this.position[2] = this.game_object.position[2]

        this.grow_cycle += time_data.delta * this.grow_speed
        if (this.grow_cycle <= 1) {
            this.mesh_comp.scale = [
                this.grow_cycle,
                this.grow_cycle,
                this.grow_cycle
            ]
        }
    }
    get_reactive_props() {
        return [
            "color",
            "position",
            super.get_reactive_props()
        ]
    }
    on_update(props) {
        super.on_update(props)
        props.forEach(prop => {
            switch (prop) {
                case "color": {
                    this.mesh_comp.subject.material.color.set_any(this.color)
                    break
                }
                case "position": {
                    this.game_object.position = this.position
                    break
                }
            }
        })
    }
    move_part(time_data) {
        let direction = 0
        if (this.is_head) {
            direction = this.snake_direction
        } else {
            direction = this.tools.math.direction(this.game_object.position, this.before_part.game_object.position)
            // console.log(direction, this.game_object.position, this.before_part.game_object.position)
        }

        if (isNumber(direction)) {
            this.game_object.position = [
                this.game_object.position[0] + Math.sin(direction) * this.snake_speed * this.tools.math.clamp(time_data.delta, 0, 1),
                this.game_object.position[1],
                this.game_object.position[2] - Math.cos(direction) * this.snake_speed * this.tools.math.clamp(time_data.delta, 0, 1),
            ]
        } else if (isArray(direction)) {
            if (this.is_head) {
                this.game_object.position = [
                    this.game_object.position[0] + direction[0] * this.tools.math.clamp(time_data.delta, 0, 1),
                    this.game_object.position[1],
                    this.game_object.position[2] + direction[2] * this.tools.math.clamp(time_data.delta, 0, 1),
                ]
            } else {
                let distance = this.tools.math.distance(this.game_object.position, this.before_part.game_object.position)
                let distance_correction = distance / this.distance_between_parts
                // console.log(this.UUID, distance_correction, this.snake_speed)
                // this.game_object.position = [
                //     this.game_object.position[0] + direction[0] * distance_correction,
                //     this.game_object.position[1],
                //     this.game_object.position[2] + direction[2] * distance_correction,
                // ]
                this.game_object.scale = [
                    distance_correction,
                    distance_correction,
                    distance_correction
                ]
                this.game_object.position = [
                    this.before_part.game_object.position[0] - direction[0] * this.distance_between_parts,
                    this.before_part.game_object.position[1] - direction[1] * this.distance_between_parts,
                    this.before_part.game_object.position[2] - direction[2] * this.distance_between_parts,
                ]
            }
        }


    }
    update_jam(time_data) {
        let before_part = this.before_part
        if (!before_part) {
            this.jam_phase = (this.jam_phase + (this.jam_speed) * this.tools.math.clamp(time_data.delta, 0, 1)) % 1
        } else {
            this.jam_phase = (before_part.jam_phase + this.jam_delta) % 1
        }
        let scale = (Math.sin((1 - this.jam_phase) * Math.PI) * (this.jam_max - this.jam_min)) + this.jam_min
        scale = this.tools.math.lerp(1, scale, (1 - 1 / (this.part_index + 1)))
        this.game_object.scale = [
            scale,
            scale,
            scale
        ]
    }
}

export default SnakePartController;
