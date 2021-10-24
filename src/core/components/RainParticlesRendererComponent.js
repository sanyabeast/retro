
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import Component from "core/Component";
import AssetManager from "core/utils/AssetManager";
import * as THREE from 'three';
import MeshComponent from "core/components/MeshComponent";

class RainParticlesRenderer extends Component {
    particles_count = 50
    particles = []
    particle_degree = Math.PI + (Math.PI / 6)
    particle_speed = 5
    min_particle_scale = 0.05
    max_particle_scale = 0.7
    particlets_position_z = -10
    speed_multiplier = 1
    render_data = []

    on_created() {
        let camera = this.find_component_of_type("CameraComponent")
        let viewport_size = camera.subject.get_viewport_size(this.particlets_position_z)
        for (let a = 0; a < this.particles_count; a++) {
            let scale = this.random_range(this.min_particle_scale, this.max_particle_scale)
            let particle = MeshComponent.create_mesh({
                render_layer: 3,
                render_index: a,
                geometry: [
                    "PlaneBufferGeometry",
                    [0.33, 0.33, 1]
                ],
                material: [
                    // "MeshBasicMaterial",
                    // {
                    //     map: AssetManager.load_texture("res/particle_0.png"),
                    //     transparent: true,
                    // }
                    this.material_id || "@core.particle_a",
                    {
                        "uniforms.particle_size.value": scale,
                        "uniforms.particle_index": a,
                        "uniforms.map.value": `${this.sprite_texture}`
                    }
                ],
                position: [
                    Math.random() * viewport_size[0] - (viewport_size[0] / 2),
                    Math.random() * viewport_size[1] - (viewport_size[1] / 2),
                    this.particlets_position_z
                ],
                scale: [scale, scale, scale]
            })

            this.render_data.push({
                object: particle,
                parent: this.object
            })


            // particle.uniform("map").value = AssetManager.load_texture(this.sprite_texture)

            this.particles.push(particle)

        }
    }
    get_render_data(){
        return this.enabled ? this.render_data : undefined
    }
    on_tick(time_delta) {
        let time = this.globals.uniforms.time.value
        let camera = this.find_component_of_type("CameraComponent")
        let viewport_size = camera.subject.get_viewport_size(this.particlets_position_z)

        this.particles.forEach((particle, index) => {
            let offset = Math.sin(index)
            let particle_size = particle.scale.x

            // particle.uniform("particle_degree").value = this.particle_degree
            // particle.uniform("particle_speed").value = this.particle_speed

            particle.position.x += Math.cos(this.particle_degree + Math.PI) * (this.particle_speed * this.speed_multiplier) * 0.01 * Math.pow(particle_size / 2, 2)
            particle.position.y += Math.sin(this.particle_degree + Math.PI) * (this.particle_speed * this.speed_multiplier) * 0.01 * Math.pow(particle_size / 2, 2)


            if (particle.position.x < -viewport_size[0] / 2) {
                particle.position.y = Math.random() * viewport_size[1] - viewport_size[1] / 2
                particle.position.x = +viewport_size[0] / 2
            } else {
                if (particle.position.y < -viewport_size[0] / 2) {
                    particle.position.y = +viewport_size[1] / 2
                    particle.position.x = Math.random() * viewport_size[0] - viewport_size[0] / 2
                } else {
                    if (particle.position.x > viewport_size[0] / 2) {
                        particle.position.y = -Math.random() * viewport_size[1] + viewport_size[1] / 2
                        particle.position.x = -viewport_size[0] / 2
                    } else {
                        if (particle.position.y > viewport_size[0] / 2) {
                            particle.position.y = -viewport_size[1] / 2
                            particle.position.x = -Math.random() * viewport_size[0] + viewport_size[0] / 2
                        }
                    }
                }
            }


        })
    }
}

export default RainParticlesRenderer;
