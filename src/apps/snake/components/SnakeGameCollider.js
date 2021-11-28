
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import Component from "retro/Component";
import ResourceManager from "retro/ResourceManager";
import { log, error, is_none, console } from "retro/utils/Tools"
import { isString, isObject, isFunction, isArray, isNumber, isBoolean, isUndefined, isNull, map, filter, keys, values, set, get, unset, forEach } from "lodash-es"
import Schema from "retro/utils/Schema"

const create_colliders_storage = () => {
    ResourceManager.snake_game_colliders = ResourceManager.snake_game_colliders || {
        layers: {},
        intersections: {}
    }
}

const register_collider = (layer_name, collider) => {
    let id = collider.UUID
    ResourceManager.snake_game_colliders.layers[layer_name] = ResourceManager.snake_game_colliders.layers[layer_name] || {}
    ResourceManager.snake_game_colliders.layers[layer_name][id] = collider
}

const deregister_collider = (layer_name, collider) => {
    let id = collider.UUID
    if (ResourceManager.snake_game_colliders.layers[layer_name]) {
        delete ResourceManager.snake_game_colliders.layers[layer_name][id]
    }
}

const get_colliders = (layer_name) => {
    ResourceManager.snake_game_colliders.layers[layer_name] = ResourceManager.snake_game_colliders.layers[layer_name] || {}
    return ResourceManager.snake_game_colliders.layers[layer_name]
}

class SnakeGameCollider extends Component {
    static tick_rate = 5
    tick_rate = 5
    radius = 1
    layers = []
    overlapping = []
    /**private */
    gizmo_color
    world_position = [0, 0, 0]
    intersected_colliders = []
    intersected_ids = []
    overlapping_started = []
    overlapping_ended = []
    on_create() {
        create_colliders_storage()
        this.layers.forEach(layer_name => {
            register_collider(layer_name, this)
        })
        this.update_gizmo_color()
        this.log(`created: "${this.layers.join(", ")}"`)
    }
    on_tick(time_data) {
        this.update_world_position()
        this.check_collision()
        if (this.overlapping_started.length > 0) {
            this.overlapping_started.forEach(UUID => {
                let collider = ResourceManager.get_component_instance("SnakeGameCollider", UUID)
                this.call_down('begin_overlap', {
                    collider
                })
            })
            this.log(`started`, this.overlapping_started)
        }
        if (this.overlapping_ended.length > 0) {
            this.overlapping_ended.forEach(UUID => {
                let collider = ResourceManager.get_component_instance("SnakeGameCollider", UUID)
                this.call_down('end_overlap', {
                    collider
                })
                console.log(collider)
            })
            this.log(`ended`, this.overlapping_ended)
        }
    }
    update_world_position() {
        this.world_position = this.game_object.to_world_pos(this.game_object.position)
    }
    check_collision() {
        let intersected_colliders = []
        let intersected_ids = []
        this.overlapping.forEach(layer_name => {
            let colliders = get_colliders(layer_name)
            forEach(colliders, collider => {
                if (collider.intersects(this)) {
                    intersected_colliders.push(collider)
                    intersected_ids.push(collider.UUID)
                }
            })
        })

        let overlapping_started = this.overlapping_started = filter(intersected_ids, id => this.intersected_ids.indexOf(id) < 0)
        let overlapping_ended = this.overlapping_ended = filter(this.intersected_ids, id => intersected_ids.indexOf(id) < 0)
        this.intersected_ids = intersected_ids
        this.intersected_colliders = intersected_colliders
    }
    intersects(collider) {
        let distance = this.tools.math.distance(
            this.world_position,
            collider.world_position
        )
        let total_radius = collider.radius + this.radius
        return distance < total_radius
    }
    has_layer(layer_name) {
        return this.layers.indexOf(layer_name) > -1
    }
    add_layer(layer_name) {
        this.layers.push(layer_name)
        register_collider(layer_name, this)
        this.update_gizmo_color()
    }
    remove_layer(layer_name) {
        this.layers.splice(this.layers.indexOf(layer_name), 1)
        deregister_collider(layer_name, this)
        this.update_gizmo_color()
    }
    add_overlapping(layer_name) {
        this.overlapping.push(layer_name)
    }
    remove_overlapping(layer_name) {
        this.overlapping.splice(this.overlappings.indexOf(layer_name), 1)
    }
    on_gizmo_draw() {
        return [
            {
                type: "sphere",
                radius: this.radius,
                color: this.gizmo_color,
                opacity: 0.1,
                wireframe: true,
                position: this.game_object.position
            }
        ]
    }
    update_gizmo_color() {
        console.log(this.tools.extra.get_random_color_for_string2(this.layers.join("|")))
        this.gizmo_color = this.tools.extra.get_random_color_for_string2(this.layers.join("|"))
    }
    static on_tick(delta, colliders) {
        console.log(delta, colliders)
    }
}

export default SnakeGameCollider;

