
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import SceneComponent from "retro/SceneComponent";
import ResourceManager from "retro/ResourceManager";
import { Vector2, Vector3 } from 'three';
import Tools from "retro/utils/Tools"
const Partykals = require("partykals")
import { map, isString, isArray } from "lodash-es"


class PartykalsComponent extends SceneComponent {

    particles_global_size = 1
    particles_size = 1
    particles_start_size = 1
    particles_end_size = 0
    particles_ttl = 10
    particles_blending = 1
    particles_texture = "res/retro/flake_a.png"
    particles_velocity = "rand:SphereRandomizer?2.5"
    particles_velocity_bonus = [0, 1, 0]
    particles_gravity = -10
    particles_start_alpha = 1
    particles_start_color = "rand:ColorsRandomizer"
    particles_start_color_change_at = 0
    particles_start_alpha_change_at = 0.5
    particles_end_color = "rand:ColorsRandomizer"
    particles_end_alpha = 0
    particles_acceleration = [0, 10, 0]
    particles_rotation = 0
    particles_rotation_speed = Math.PI / 2
    particles_offset = [-0.1, 0.1, 0.1]
    system_particles_count = 1000
    system_perspective = true
    system_speed = 1
    emitters = undefined

    tick_rate = 30

    /**private */
    particle_system = undefined

    constructor() {
        super(...arguments)
        this.emitters = [{
            on_spawn_burst: 0,
            on_interval: "rand:MinMaxRandomizer?0;5",
            interval: "rand:MinMaxRandomizer?0;0.25"
        }]
    }

    get_reactive_props() {
        return [
            "particles_global_size",
            "particles_start_size",
            "particles_end_size",
            "particles_ttl",
            "particles_blending",
            "particles_texture",
            "particles_velocity",
            "particles_velocity_bonus",
            "particles_gravity",
            "particles_start_alpha",
            "particles_start_color",
            "particles_start_color_change_at",
            "particles_start_alpha_change_at",
            "particles_end_color",
            "particles_end_alpha",
            "particles_acceleration",
            "particles_rotation",
            "particles_rotation_speed",
            "particles_offset",
            "system_particles_count",
            'system_perspective',
            "system_speed",
            "emitters",
        ].concat(super.get_reactive_props())
    }

    on_update(props) {
        super.on_update(props)
        console.log(this.particles_velocity)
        try {
            props.forEach(prop => {
                switch (prop) {
                    case "particles_velocity": {
                        if (this.tools.type.is_string(this.particles_velocity)) {
                            this.particles_velocity = this.get_value(this.particles_velocity)
                        }
                        // if (this.tools.type.is_array(this.particles_velocity)) {
                        //     this.particle_system.options.particles.velocity.set(...particles_velocity);
                        // } else {
                        //     this.particle_system.options.particles.velocity = this.particles_velocity;
                        // }

                        break
                    }

                }
            })
        } catch (err) {
            this.error(err)
        }
    }

    get_value(d) {
        if (isString(d)) {
            if (d.startsWith("rand:")) {
                d = d.replace("rand:", "")
                let rand_name = d.split("?")[0]
                let params = d.split("?")[1]
                if (params) {
                    params = params.split(";");
                    params = map(params, (v) => {
                        return JSON.parse(v)
                    })
                } else {
                    params = []
                }

                let v = new Partykals.Randomizers[rand_name](...map(params, (p) => {
                    console.log(p)
                    return this.get_value(p)
                }))

                console.log(d, v)

                return v
            } else {
                return d
            }
        } else if (isArray(d) && d.length === 3) {
            return new Vector3(...d)
        } else {
            return d
        }
    }

    get_emitters() {
        let r = []

        this.emitters.forEach(data => {
            r.push(new Partykals.Emitter({
                onInterval: this.get_value(data.on_interval),
                interval: this.get_value(data.interval),
                onSpawnBurst: this.get_value
            }))
        })

        return r
    }

    on_create() {
        let ps = this.particle_system = new Partykals.ParticlesSystem({
            particles: {
                size: this.get_value(this.particles_size),
                globalSize: this.get_value(this.particles_global_size),
                startSize: this.get_value(this.particles_start_size),
                endSize: this.get_value(this.particles_end_size),
                ttl: this.get_value(this.particles_ttl),
                blending: this.get_value(this.particles_blending),
                texture: this.get_value(this.particles_texture),
                velocity: this.get_value(this.particles_velocity),
                velocityBonus: this.get_value(this.particles_velocity_bonus),
                gravity: this.get_value(this.particles_gravity),
                startAlpha: this.get_value(this.particles_start_alpha),
                startColor: this.get_value(this.particles_start_color),
                startAlphaChangeAt: this.get_value(this.particles_start_alpha_change_at),
                startColorChangeAt: this.get_value(this.particles_start_color_change_at),
                endColor: this.get_value(this.particles_end_color),
                endAlpha: this.get_value(this.particles_end_alpha),
                acceleration: this.get_value(this.particles_acceleration),
                rotation: this.get_value(this.particles_rotation),
                rotationSpeed: this.get_value(this.particles_rotation_speed),
                offset: this.get_value(this.particles_offset)
            },
            system: {
                perspective: this.get_value(this.system_perspective),
                particlesCount: this.get_value(this.system_particles_count),
                emitters: this.get_emitters(this.system_emitters),
                speed: this.get_value(this.system_speed),
                depthWrite: false,
                depthTest: false
            }
        });

        this.subject = this.particle_system.particleSystem
    }
    get_render_data() {
        return {
            object: this.subject,
            parent: this.game_object
        }
    }
    on_tick(time_data) {
        this.particle_system.update()
    }
}

export default PartykalsComponent;
