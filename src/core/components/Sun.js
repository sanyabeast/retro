
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
    d_distance = 50
    n_intensity = 0.25
    d_intensity = 5
    n_height = -50
    d_height = 100
    n_emissive = 1.25
    d_emissive = 4
    n_color = "#da5a6a"
    d_color = "#e9c28a"
    sun_size = 3

    d_hemi_sky_color = "#f3ead7"
    d_hemi_ground_color = "#f3ead7"

    n_hemi_sky_color = "#34116a"
    n_hemi_ground_color = "#da5a6a"

    d_hemi_intensity = 1.5
    n_hemi_intensity = 0.05

    d_amb_color = "#f9e9e5"
    n_amb_color = "#0000ff"

    d_amb_intensity = 1.5
    n_amb_intensity = 0.05

    shadows_enabled = true
    shadow_resolution = 1024
    cycling = 0
    use_postfx = true

    n_grain_power = 0.09
    d_grain_power = 0.025

    n_bloom_smoothing = 0.55
    n_bloom_threshold = 0.15
    d_bloom_smoothing = 0.7
    d_bloom_threshold = 0.88

    /**private */
    light = undefined
    hemi_light = undefined
    amb_light = undefined
    d_color3 = undefined
    n_color3 = undefined


    tick_rate = 10
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
        let amb_light = this.amb_light = new THREE.AmbientLight()

        amb_light.color.set_any(this.d_amb_color)

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
        }, {
            object: this.amb_light,
            parent: this.object
        }]
    }
    on_update(props) {
        super.on_update(...arguments)
        props.forEach(prop => {
            switch (prop) {
                case "time": {
                    let t = (this.time % 1)
                    let p = Math.sin((t * Math.PI * 2) - Math.PI / 2)
                    p = (p + 1) / 2

                    // console.log(`day_progress: ${p}`)
                    let d = this.lerp(this.n_distance, this.d_distance, p)
                    let pos_x = Math.sin(t * Math.PI * 2) * d
                    let pos_z = Math.cos(t * Math.PI * 2) * d
                    let pos_y = this.lerp(this.n_height, this.d_height, p)
                    this.subject.position.set(pos_x, pos_y, pos_z)
                    this.position[0] = pos_x
                    this.position[1] = pos_y
                    this.position[2] = pos_z

                    let intensity = this.lerp(this.n_intensity, this.d_intensity, Math.pow(p, 0.2))
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

                    let hemi_intensity = this.lerp(this.n_hemi_intensity, this.d_hemi_intensity, Math.pow(p, 0.2))
                    this.hemi_light.intensity = hemi_intensity
                    this.hemi_light.color.set_any(c_hemi_sky)
                    this.hemi_light.groundColor.set_any(c_hemi_ground)

                    /**ambinet */
                    let amb_intensity = this.lerp(this.n_amb_intensity, this.d_amb_intensity, Math.pow(p, 0.2))

                    let d_amb_color = hex_to_rgb(this.d_amb_color)
                    let n_amb_color = hex_to_rgb(this.n_amb_color)

                    let c_amb_color = [
                        this.lerp(n_amb_color[0], d_amb_color[0], p),
                        this.lerp(n_amb_color[1], d_amb_color[1], p),
                        this.lerp(n_amb_color[2], d_amb_color[2], p)
                    ]

                    this.amb_light.color.set_any(c_amb_color)
                    this.amb_light.intensity = amb_intensity

                    if (this.use_postfx) {
                        let postfx = this.find_component_of_type("Postprocessing")
                        if (postfx) {
                            postfx.grain_power = this.lerp(this.n_grain_power, this.d_grain_power, p)
                            postfx.bloom_smoothing = this.lerp(this.n_bloom_smoothing, this.d_bloom_smoothing, p)
                            postfx.bloom_threshold = this.lerp(this.n_bloom_threshold, this.d_bloom_threshold, p)
                        }

                    }

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
