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
    on_create() {
        this.parts = []
        this.log(`created`)
        this.create_intial_parts()
    }
    create_intial_parts() {
        // for (let a = 0; a < this.start_length; a++) {
        //     let part_object = new GameObject(this.snake_part_prefab)
        //     this.parts.push(part_object)
        //     this.add(part_object)
        // }

        // this.parts.forEach((part, index) => {
        //     part.position = [
        //         index,
        //         0,
        //         0
        //     ]
        // })
    }
    on_tick(time_delta) {
        
    }
}

export default SnakeController;
