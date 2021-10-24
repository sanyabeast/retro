
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import Component from "core/Component";
import AssetManager from "core/utils/AssetManager";
import * as THREE from 'three';
import MeshComponent from "core/components/MeshComponent";

class ParticlesRenderer extends Component {
    max_life_time = 100
    particles_count = 50
    particles = []
    particle_degree = Math.PI + (Math.PI / 6)
    particle_speed = 1
    speed_multiplier = 1
    particle_scale = 1
    origin_object = null
    origin_offset = new THREE.Vector3(0, 0, 0)
    origin_position = new THREE.Vector3(0, 0, 0)
    current_tick = 0
    emitter_offset = 3
    opacity = 1
    wobble_a = 1
    min_speed = 0
    max_speed = 0
    life_time_scale = 0.2
    sprite_texture = "res/core/smoke_a.png"
    render_data = []

    get_render_data() {
        return this.render_data
    }

    on_created() {
        let camera = this.find_component_of_type("CameraComponent")
        let viewport_size = camera.subject.get_viewport_size()
        let origin_position = this.origin_position

        if (!this.origin_object) {
            this.origin_object = this.object
        }
        if (this.origin_object) {
            this.origin_object.getWorldPosition(this.origin_position)
        }

        for (let a = 0; a < this.particles_count; a++) {
            let scale = 0
            let particle = MeshComponent.create_mesh({
                extra_data: {
                    particle_size: scale,
                    life_time: 0,
                    particle_inited: false,
                },
                render_layer: this.render_layer,
                render_index: this.particles_count - a,
                geometry_id: `particles_${this.id}`,
                geometry: [
                    "PlaneBufferGeometry",
                    [0.33, 0.33, 1]
                ],
                material: [
                    // "MeshBasicMaterial",
                    // {v
                    //     map: AssetManager.load_texture("res/particle_0.png"),
                    //     transparent: true,
                    // }
                    this.material_name || "@core.particle_a",
                    {
                        "uniforms.particle_size.value": scale,
                        "uniforms.particle_index.value": a,
                        "uniforms.color_a.value": this.color_a,
                        "uniforms.color_b.value": this.color_b,
                        "uniforms.opacity.value": this.opacity,
                        "uniforms.map.value": `${this.sprite_texture}`
                    }
                ],
                position: [
                    origin_position.x + this.origin_offset.x,
                    origin_position.y + this.origin_offset.y,
                    origin_position.z + this.origin_offset.z
                ],
                scale: [scale, scale, scale],
                rotation: [0, 0, Math.random() * Math.PI * 2]
            })

            this.render_data.push({
                object: particle,
                parent: this.object
            })

            this.particles.push(particle)

        }
    }
    on_tick(time_delta) {
        if (!this.origin_object) {
            this.origin_object = this.object
        }
        if (this.origin_object) {
            this.origin_object.getWorldPosition(this.origin_position)
        }

        this.current_tick++
        let time = this.globals.uniforms.time.value
        let camera = this.find_component_of_type("CameraComponent")


        this.particles.forEach((particle, index) => {
            if (index * this.emitter_offset > this.current_tick) {
                return
            }

            if (!particle.extra_data.particle_inited) {
                particle.extra_data.particle_inited = true
                let origin_position = this.origin_position

                if (this.origin_object) {
                    this.origin_object.getWorldPosition(this.origin_position)
                }

                particle.extra_data.life_time = 0
                particle.position.set(
                    origin_position.x + this.origin_offset.x,
                    origin_position.y + this.origin_offset.y,
                    origin_position.z + this.origin_offset.z
                )

                new_scale = this.calc_new_scale(particle.extra_data.life_time)
            }

            let new_scale = this.calc_new_scale(particle.extra_data.life_time)

            particle.extra_data.life_time++

            let r_speed = (this.particle_speed * this.speed_multiplier) * 0.1
            if (this.max_speed > 0) {
                r_speed = Math.min(this.max_speed, r_speed)
            }

            if (this.min_speed > 0) {
                r_speed = Math.max(this.min_speed, r_speed)
            }

            particle.position.x += Math.cos(this.particle_degree + Math.PI) * r_speed
            particle.position.y += Math.sin(this.particle_degree + Math.PI) * r_speed
            particle.position.y += (Math.sin(time + index / 2. + Math.random()) / 50) * this.wobble_a
            particle.position.z = Math.sin((particle.extra_data.life_time / this.max_life_time) * Math.PI * 2) * 0.1

            particle.rotation.y = Math.sin(time + index) * Math.PI

            // particle.uniform("opacity").value = Math.pow(1. - (particle.extra_data.life_time / this.max_life_time), 2.) * this.opacity

            let need_reset = false

            need_reset = particle.extra_data.life_time > this.max_life_time


            if (need_reset) {
                let origin_position = this.origin_position

                if (this.origin_object) {
                    this.origin_object.getWorldPosition(this.origin_position)
                }

                particle.extra_data.life_time = 0
                particle.position.set(
                    origin_position.x + this.origin_offset.x,
                    origin_position.y + this.origin_offset.y,
                    origin_position.z + this.origin_offset.z
                )

                new_scale = this.calc_new_scale(particle.extra_data.life_time)
            }

            particle.scale.set(
                new_scale,
                new_scale,
                new_scale
            );

        })
    }
    calc_new_scale(life_time) {
        return (1 + (life_time * this.life_time_scale)) * this.particle_scale
    }
}

export default ParticlesRenderer;
