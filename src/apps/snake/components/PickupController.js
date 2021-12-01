
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import Component from "retro/Component";
import ResourceManager from "retro/ResourceManager";
import { log, error, is_none, console } from "retro/utils/Tools"
import { isString, isObject, isFunction, isArray, isNumber, isBoolean, isUndefined, isNull, map, filter, keys, values, set, get, unset } from "lodash-es"
import Schema from "retro/utils/Schema"

class PickupController extends Component {
    winking_speed = 0.5
    floating_speed = 1
    spinning_speed_x = 0.5
    spinning_speed_y = 1
    spinning_speed_z = 0.5
    despawn_speed = 2
    /**private */
    mesh_comp = undefined
    winking_cycle = 0
    floating_cycle = 0
    spinning_cycle = 0
    despawn_started = false
    animator = undefined
    on_create() {
        let animator = this.animator = this.get_component("Animator")
        let mesh_comp = this.mesh_comp = this.get_component("MeshComponent")
        let collider = this.collider = this.get_component("FluidCollider")
        mesh_comp.set_material_param("emissive", "#ffffff")
        animator.animate("spawning", {
            duration: 2,
            ease: "ease_out_back",
            target_object: this,
            from_values: {
                "mesh_comp.position": [0, 16, 0],
                "mesh_comp.scale": [0, 0, 0],
            },
            values: {
                "mesh_comp.position": [0, 0, 0],
                "mesh_comp.scale": [1, 1, 1],
            }
        }, {
            on_complete: () => {
                this.collider.enabled = true
            }
        })

        animator.animate("idle", {
            duration: 15,
            target_object: this,
            loop: true,
            from_values: {
                "mesh_comp.rotation": [0, -Math.PI, -0.2]
            },
            values: {
                "mesh_comp.rotation": [0, Math.PI, 0.2]
            }
        })

    }
    on_tick(time_data) {
        // this.winking_cycle += time_data.delta * this.winking_speed
        // this.floating_cycle += time_data.delta * this.floating_speed
        // this.spinning_cycle += time_data.delta * this.spinning_speed_y

        // this.update_transform(time_data.delta)
    }
    update_transform(delta) {
        this.mesh_comp.set_material_param(
            "emissiveIntensity",
            this.tools.math.translate_range(
                Math.sin(this.winking_cycle * Math.PI),
                -1,
                +1,
                0.25,
                1.5
            )
        )

        this.mesh_comp.position = [
            this.mesh_comp.position[0],
            this.tools.math.translate_range(Math.sin(this.floating_cycle * Math.PI), -1, +1, 0.025, 0.15),
            this.mesh_comp.position[2],
        ]

        this.mesh_comp.rotation = [
            this.tools.math.translate_range(Math.sin(this.spinning_cycle * Math.PI * this.spinning_speed_x), -1, +1, -Math.PI / 32, Math.PI / 32),
            this.mesh_comp.rotation[1] + (this.spinning_speed_y * delta || 0),
            this.tools.math.translate_range(Math.sin(this.spinning_cycle * Math.PI * this.spinning_speed_z), -1, +1, -Math.PI / 32, Math.PI / 32),
        ]
    }
    on_gizmo_draw() {
        return [
            {
                type: "sphere",
                radius: 0.2,
                wireframe: true,
                opacity: 1,
                position: this.game_object.position,
                color: "#00ff00"
            }
        ]
    }
    despawn(options, on_despawn_finished) {
        // console.log(options)
        if (this.despawn_started) return
        let animator = this.animator
        this.get_component("FluidCollider").enabled = false
        animator.animate("spawning", {
            duration: 0.5,
            target_object: this,
            ease: "ease_in_quad",
            from_values: {
                "game_object.scale": [1, 1, 1],
                "game_object.position": this.game_object.position
            },
            values: {
                "game_object.scale": [0, 0, 0],
                "game_object.position": options.snake_part.position
            }
        }, {
            on_complete: () => {
                on_despawn_finished()
                this.game_object.destroy()
            }
        })

    }
}

export default PickupController;

