
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import TransformComponent from "core/TransformComponent";
import AssetManager from "core/utils/AssetManager";
import * as THREE from 'three';
import { hex_to_hsl, hsl_to_rgb, hex_to_rgb } from "core/utils/Tools";

class Sun extends TransformComponent {
    time = 0.5

    n_distance = 500
    d_distance = 150
    n_intensity = 0.01
    d_intensity = 1
    n_height = -50
    d_height = 100
    n_emissive = 1.25
    d_emissive = 4
    n_color = "#da5a6a"
    d_color = "#a4e4e2"
    sun_size = 3

    d_hemi_sky_color = "#f3ead7"
    d_hemi_ground_color = "#eeffee"

    n_hemi_sky_color = "#34116a"
    n_hemi_ground_color = "#da5a6a"

    d_hemi_intensity = 0.4
    n_hemi_intensity = 0.0025

    shadows_enabled = true
    shadow_resolution = 1024
    cycling = 0

    /**private */
    light = undefined
    hemi_light = undefined
    d_color3 = undefined
    n_color3 = undefined
    on_created() {

        /*dir light*/
        let light = this.light = new THREE.DirectionalLight()
        if (this.shadows_enabled) {
            if (light.shadow) {
                light.shadow.mapSize.width = this.shadow_resolution;
                light.shadow.mapSize.height = this.shadow_resolution;
                light.shadow.camera.near = 0.5;
                light.shadow.camera.far = 2000
            }
            light.castShadow = true
        }

        let hemi_light = this.hemi_light = new THREE.HemisphereLight()

        /**sphere */
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



        this.d_color3 = new THREE.Color()
        this.n_color3 = new THREE.Color()
        this.d_color3.set_any(this.d_color)
        this.n_color3.set_any(this.n_color)


        sphere.scale.set(this.sun_size, this.sun_size, this.sun_size)
    }
    get_render_data() {
        return [{
            object: this.light,
            parent: this.object
        }, {
            object: this.sphere,
            parent: this.object
        }, {
            object: this.hemi_light,
            parent: this.object
        }]
    }
    on_update(props) {
        super.on_update(...arguments)
        props.forEach(prop => {
            switch (prop) {
                case "time": {
                    let t = (this.time % 1)
                    let p = Math.pow(((Math.sin((1 - t) * Math.PI * 2) + 1) / 2), 5) + 0.3
                    let d = this.lerp(this.n_distance, this.d_distance, p)
                    let pos_x = Math.sin(t * Math.PI * 2) * d
                    let pos_z = Math.cos(t * Math.PI * 2) * d
                    let pos_y = this.lerp(this.n_height, this.d_height, p)
                    this.subject.position.set(pos_x, pos_y, pos_z)
                    this.position[0] = pos_x
                    this.position[1] = pos_y
                    this.position[2] = pos_z

                    let intensity = this.lerp(this.n_intensity, this.d_intensity, p)
                    this.light.intensity = intensity

                    let emissive = this.lerp(this.n_emissive, this.d_emissive, p)
                    this.sphere.material.emissiveIntensity = emissive

                    let n_color_hsl = hex_to_hsl(this.n_color)
                    let d_color_hsl = hex_to_hsl(this.d_color)

                    let c_color = [
                        this.lerp(n_color_hsl[0], d_color_hsl[0], p),
                        this.lerp(n_color_hsl[1], d_color_hsl[1], p),
                        this.lerp(n_color_hsl[2], d_color_hsl[2], p)
                    ]
                    let c_color_rgb = hsl_to_rgb(...c_color)
                    this.light.color.set(c_color_rgb)

                    /**hemi */
                    let n_hemi_sky_color = hex_to_rgb(this.n_hemi_sky_color)
                    let n_hemi_ground_color = hex_to_rgb(this.n_hemi_ground_color)
                    let d_hemi_sky_color = hex_to_rgb(this.d_hemi_sky_color)
                    let d_hemi_ground_color = hex_to_rgb(this.d_hemi_ground_color)

                    let c_hemi_sky = [
                        this.lerp(n_hemi_sky_color[0], d_hemi_sky_color[0], p),
                        this.lerp(n_hemi_sky_color[1], d_hemi_sky_color[1], p),
                        this.lerp(n_hemi_sky_color[2], d_hemi_sky_color[2], p)
                    ]

                    let c_hemi_ground = [
                        this.lerp(n_hemi_ground_color[0], d_hemi_ground_color[0], p),
                        this.lerp(n_hemi_ground_color[1], d_hemi_ground_color[1], p),
                        this.lerp(n_hemi_ground_color[2], d_hemi_ground_color[2], p)
                    ]

                    let hemi_intensity = this.lerp(this.n_hemi_intensity, this.d_hemi_intensity, p)
                    this.hemi_light.intensity = hemi_intensity
                    this.hemi_light.color.set_any(c_hemi_sky)
                    this.hemi_light.groundColor.set_any(c_hemi_ground)
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
        super.on_tick(time_delta)
        if (this.cycling > 0) {
            let step = (1 / 86400) * this.cycling * time_delta.delta
            this.time = (this.time + step) % 1
        }
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
