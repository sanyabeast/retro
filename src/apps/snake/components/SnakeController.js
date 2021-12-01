import Component from "retro/Component";
import ResourceManager from "retro/ResourceManager";
import { log, error, is_none, console } from "retro/utils/Tools"
import { isString, isObject, isFunction, isArray, isNumber, isBoolean, isUndefined, isNull, map, filter, keys, values, set, get, unset } from "lodash-es"
import Schema from "retro/utils/Schema"
import GameObject from "retro/GameObject";

class SnakeController extends Component {
    teams = ["neutral"]
    start_length = 4
    snake_part_prefab = "snake.actors.snake_part"
    steering_speed = 2
    snake_direction = 0
    snake_speed = 1
    snake_moving = false
    color = "#009688"
    position = [0, 0, 0]
    game_controller = undefined
    /**private */
    parts = undefined
    get length() { return this.parts.length; }
    get last_part() { return this.parts[this.parts.length - 1]; }
    get head_part() { return this.parts[0]; }
    on_create() {
        this.parts = []
        let persistent_parts = this.find_child_components_of_type("SnakePartController")
        persistent_parts.forEach((snake_part) => {
            snake_part.position = this.position
            snake_part.snake_controller = this
            this.parts.push(snake_part)
        })
        this.log(`created`)
        for (let a = 0; a < this.start_length; a++) {
            this.grow()
        }
    }
    get_reactive_props() {
        return [
            "color",
            "position",
            "teams",
            ...super.get_reactive_props()
        ]
    }
    on_update(props) {
        super.on_update(props)
        props.forEach((prop) => {
            switch (prop) {
                case "color": {
                    this.head_part.color = this.color
                    break
                }
                case "position": {
                    this.head_part.position = this.position
                    break
                }
            }
        })
    }
    grow() {
        let snake_part_prefab = ResourceManager.load_prefab(this.snake_part_prefab, {
            "components.controller.params.before_part": this.last_part,
            "components.controller.params.color": this.color
        })
        let part_object = new GameObject(snake_part_prefab)
        // console.log(part_object, snake_part_prefab, this)

        let snake_part = part_object.get_component("SnakePartController")
        snake_part.snake_controller = this
        this.parts.push(snake_part)
        this.add(part_object)
    }
    start_moving() {
        this.snake_moving = true
    }
    stop_moving() {
        this.snake_moving = false
    }
    on_tick(time_data) {
        this.head_part.snake_direction = this.snake_direction
        if (this.snake_moving) {
            this.head_part.snake_speed = this.snake_speed
        } else {
            this.head_part.snake_speed = 0
        }
        if (this.color !== this.head_part.color) {
            this.head_part.color = this.color
        }

        this.position[0] = this.head_part.position[0]
        this.position[1] = this.head_part.position[1]
        this.position[2] = this.head_part.position[2]
    }
    steer_right(delta = 1000 / 60) {
        this.snake_direction += this.steering_speed * delta
    }
    steer_left(delta = 1000 / 60) {
        this.snake_direction -= this.steering_speed * delta
    }
    begin_overlap(data) {
        if (this.game_controller !== undefined) {
            this.game_controller.handle_snake_begin_overlap(data)
        }
    }
    end_overlap(data) {
        if (this.game_controller !== undefined) {
            this.game_controller.handle_snake_end_overlap(data)
        }
    }
    /**teams and fractions */
    add_team(team_name) { this.teams.push(team_name); this.teams = this.teams; }
    remove_team(team_name) { this.teams.splice(this.teams.indexOf(team_name), 1); this.teams = this.teams; }
    in_team(team_name) { return this.teams.indexOf(team_name) > -1; }
    clear_teams() { return this.teams = []; }
    split_snake(index){
        // let new_snake = 
        // this.log(`splitting snake`, index)
    }
}

export default SnakeController;
