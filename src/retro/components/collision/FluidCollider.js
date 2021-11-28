
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

let current_collision_state = {}

class FluidCollider extends Component {
    static tick_rate = 5
    tick_rate = 5
    radius = 1
    layers = []
    overlapping = []
    group = undefined
    /**private */
    gizmo_color
    world_position = [0, 0, 0]
    on_create() {
        create_colliders_storage()
        this.layers.forEach(layer_name => {
            register_collider(layer_name, this)
        })
        this.update_gizmo_color()
        this.log(`created: "${this.layers.join(", ")}"`)
    }
    on_tick(time_data) { }
    static on_tick(delta, colliders) {
        let new_collision_state = {}
        let new_collision_tests = []
        let cached_intersection_checks = {}
        forEach(colliders, (collider_a, uuid) => {
            if (collider_a.enabled === false) return
            collider_a.update_world_position()
            forEach(colliders, (collider_b, uuid) => {
                if (collider_b.enabled === false) return
                if (collider_a.id === collider_b.id) return
                if (collider_a.group !== undefined && collider_a.group === collider_b.group) return
                collider_b.update_world_position()
                let comp_id = `${collider_a.id}*${Math.max(collider_b.id)}`
                let unique_comp_id = `${Math.min(collider_a.id, collider_b.id)}*${Math.max(collider_a.id, collider_b.id)}`
                let checking_result = new_collision_state[comp_id]
                if (checking_result === undefined) {
                    checking_result = {}
                    let need_check = collider_a.overlaps_layers(collider_b.layers)
                    let is_intersecting = false
                    if (need_check) {
                        if (cached_intersection_checks[unique_comp_id] !== undefined) {
                            is_intersecting = cached_intersection_checks[unique_comp_id]
                        } else {
                            if (collider_b.intersects(collider_a)) {
                                cached_intersection_checks[unique_comp_id] = is_intersecting = true
                            }
                        }
                    }
                    checking_result = {
                        need_check: need_check,
                        is_intersecting: is_intersecting,
                        collider_a: collider_a,
                        collider_b: collider_b,
                        comp_id: comp_id,
                        unique_comp_id
                    }

                    new_collision_tests.push(checking_result)
                    new_collision_state[comp_id] = checking_result
                }
            })
        })

        if (new_collision_tests.length > 0) {
            new_collision_tests.forEach(state => {
                let prev_state = current_collision_state[state.comp_id]
                if (!prev_state) {
                    current_collision_state[state.comp_id] = prev_state = {
                        is_intersecting: false,
                        comp_id: state.comp_id
                    }
                }
                let begin_overlap = prev_state.is_intersecting === false && state.is_intersecting === true
                let end_overlap = prev_state.is_intersecting === true && state.is_intersecting === false
                let collider_a = state.collider_a
                let collider_b = state.collider_b
                if (begin_overlap) {
                    collider_a.call_down("begin_overlap", {
                        collider: collider_b
                    })
                }

                if (end_overlap) {
                    collider_a.call_down("end_overlap", {
                        collider: collider_b
                    })
                }
            })
        }

        current_collision_state = new_collision_state
    }
    overlaps_layers(layers) {
        let r = false
        layers.forEach(layer_name => {
            if (this.overlapping.indexOf(layer_name) > -1) {
                r = true
            }
        })
        return r
    }
    update_world_position() {
        this.world_position = this.game_object.to_world_pos(this.game_object.position)
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

}

export default FluidCollider;

