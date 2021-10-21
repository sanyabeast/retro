
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import TransformComponent from "core/TransformComponent";
import AssetManager from "core/utils/AssetManager";
import * as THREE from 'three';
import { hex_to_hsl, hsl_to_rgb } from "core/utils/Tools";

class Sun extends TransformComponent {
    time = 0.5
    distance = 300
    day_intensity = 2
    night_intensity = 0.3
    day_height = 150
    night_height = -50
    day_emissive = 4
    night_emissive = 1.25
    sun_size = 10
    day_color = "#ffe9a8"
    night_color = "#ffa27a"
    shadows_enabled = true
    shadow_resolution = 512

    /**private */
    light = undefined
    d_color = undefined
    n_color = undefined
    on_created() {
        let light = this.light = new THREE.DirectionalLight()
        let sphere = this.sphere = this.subject = new THREE.Mesh(
            new THREE.SphereBufferGeometry(1, 32, 32),
            new THREE.MeshPhongMaterial({
                emissive: new THREE.Color(1, 1, 1),
                color: new THREE.Color(1, 1, 1),
                emissiveIntensity: 10000,
                fog: false
            })
        )

        sphere.material.emissive.set_any("#f44336")
        sphere.material.color.set_any("#f44336")

        sphere.position.set(1000, 1000, 1000)
        sphere.receiveShadow = false
        sphere.castShadow = false
        sphere.frustumCulled = false

        if (this.shadows_enabled) {
            if (light.shadow) {
                light.shadow.mapSize.width = this.shadow_resolution;
                light.shadow.mapSize.height = this.shadow_resolution;
                light.shadow.camera.near = 0.5;
                light.shadow.camera.far = 1000
            }
            light.castShadow = true
        }


        this.d_color = new THREE.Color()
        this.n_color = new THREE.Color()
        this.d_color.set_any(this.day_color)
        this.n_color.set_any(this.night_color)


        sphere.scale.set(this.sun_size, this.sun_size, this.sun_size)
    }
    get_render_data() {
        return [{
            object: this.light,
            parent: this.object
        }, {
            object: this.sphere,
            parent: this.object
        }]
    }
    on_update(props) {
        super.on_update(...arguments)

        props.forEach(prop => {
            switch (prop) {
                case "time": {
                    let t = (this.time % 1)
                    let p = Math.pow(((Math.sin((1 - t) * Math.PI * 2) + 1) / 2), 5) + 0.1
                    let d = this.distance
                    let pos_x = Math.sin(t * Math.PI * 2) * d
                    let pos_z = Math.cos(t * Math.PI * 2) * d
                    let pos_y = this.lerp(this.night_height, this.day_height, p)
                    this.subject.position.set(pos_x, pos_y, pos_z)

                    let intensity = this.lerp(this.night_intensity, this.day_intensity, p)
                    this.light.intensity = intensity

                    let emissive = this.lerp(this.night_emissive, this.day_emissive, p)
                    this.sphere.material.emissiveIntensity = emissive

                    let n_color_hsl = hex_to_hsl(this.night_color)
                    let d_color_hsl = hex_to_hsl(this.day_color)

                    let c_color = [
                        this.lerp(n_color_hsl[0], d_color_hsl[0], p),
                        this.lerp(n_color_hsl[1], d_color_hsl[1], p),
                        this.lerp(n_color_hsl[2], d_color_hsl[2], p)
                    ]
                    let c_color_rgb = hsl_to_rgb(...c_color)
                    this.light.color.set(c_color_rgb)
                    break
                }
                case "sun_size": {
                    this.sphere.scale.set(this.sun_size, this.sun_size, this.sun_size)
                }
                case "shadows_enabled": {
                    this.light.castShadow = this.shadows_enabled
                }
            }
        })

        this.light.position.set(
            this.sphere.position.x,
            this.sphere.position.y,
            this.sphere.position.z
        )
    }
    on_tick(time_delta) {
        this.time += 0.001
    }
    get_reactive_props() {
        return [
            "time",
            "sun_size",
            "shadows_enabled"
        ].concat(super.get_reactive_props())
    }
}

export default Sun;
