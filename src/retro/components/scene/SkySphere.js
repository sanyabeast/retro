
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import SceneComponent from "retro/SceneComponent";
import ResourceManager from "retro/ResourceManager";
import { Vector3, HemisphereLight, CustomBlending, AddEquation, SrcAlphaFactor, OneMinusSrcAlphaFactor, MathUtils } from 'three';
import { hex_to_hsl, hsl_to_rgb, hex_to_rgb, console } from "retro/utils/Tools";



class SkySphere extends SceneComponent {
    time = 0
    use_sun_time = true
    use_exposure = true

    d_turbidity = 0
    d_rayleigh = 1
    d_mie_coeff = 0.1
    d_mie_direct = 0
    d_elevation = 45
    d_azimuth = 180
    d_exposure = 1
    d_opacity = 1

    n_turbidity = 20
    n_rayleigh = 1
    n_mie_coeff = 0.1
    n_mie_direct = 0
    n_elevation = 0
    n_azimuth = 180
    n_opacity = 0.5
    n_exposure = 1

    /**hemi light */
    d_hemi_sky_color = "#f3ead7"
    d_hemi_ground_color = "#f3ead7"

    n_hemi_sky_color = "#34116a"
    n_hemi_ground_color = "#da5a6a"

    d_hemi_intensity = 1.5
    n_hemi_intensity = 0.05

    /**private */
    tick_rate = 15
    hemi_light = undefined

    on_create() {
        let sky = this.subject = ResourceManager.create_object("SkyMesh");
        console.log(sky)

        let sun = this.sun_vector = new Vector3();

        let hemi_light = this.hemi_light = new HemisphereLight()

        let material = sky.material
        material.blending = CustomBlending;
        material.blendEquation = AddEquation; //default
        material.blendSrc = SrcAlphaFactor; //default
        material.blendDst = OneMinusSrcAlphaFactor; //default

    }
    get_render_data() {
        return [{
            object: this.subject,
            parent: this.game_object
        }, {
            object: this.hemi_light,
            parent: this.game_object,
            layers: {
                ...this.meta.layers,
                lights: true
            }
        }]
    }
    get_reactive_props() {
        return [
            "time"
        ].concat(super.get_reactive_props())
    }
    on_update(props) {
        super.on_update(props)
        props.forEach(prop => {
            switch (prop) {
                case "time": {
                    let t = (this.time % 1)
                    let p = Math.sin((t * Math.PI * 2) - Math.PI / 2)
                    p = (p + 1) / 2

                    let c_turbidity = this.tools.math.lerp(this.n_turbidity, this.d_turbidity, p)
                    let c_rayleigh = this.tools.math.lerp(this.n_rayleigh, this.d_rayleigh, p)
                    let c_mie_coeff = this.tools.math.lerp(this.n_mie_coeff, this.d_mie_coeff, p)
                    let c_mie_direct = this.tools.math.lerp(this.n_mie_direct, this.d_mie_direct, p)
                    let c_elevation = this.tools.math.lerp(this.n_elevation, this.d_elevation, p)
                    let c_azimuth = this.tools.math.lerp(this.n_azimuth, this.d_azimuth, p)
                    let c_exposure = this.tools.math.lerp(this.n_exposure, this.d_exposure, p)
                    let c_opacity = this.tools.math.lerp(this.n_opacity, this.d_opacity, p)


                    const uniforms = this.subject.material.uniforms;
                    uniforms['turbidity'].value = c_turbidity;
                    uniforms['rayleigh'].value = c_rayleigh
                    uniforms['mie_coefficient'].value = c_mie_coeff
                    uniforms['mie_directional_g'].value = c_mie_direct
                    uniforms['opacity'].value = c_opacity

                    // console.log(uniforms['opacity'].value)

                    if (this.use_sun_time === true) {
                        let sun = this.find_component_of_type("Sun")
                        uniforms['sun_position'].value.copy(sun.sphere.position);
                    } else {
                        const phi = MathUtils.degToRad(90 - c_elevation);
                        const theta = MathUtils.degToRad(c_azimuth);
                        this.sun_vector.setFromSphericalCoords(1, phi, theta);
                        uniforms['sun_position'].value.copy(this.sun_vector);
                    }

                    /**hemi */
                    let n_hemi_sky_color = hex_to_rgb(this.n_hemi_sky_color)
                    let n_hemi_ground_color = hex_to_rgb(this.n_hemi_ground_color)
                    let d_hemi_sky_color = hex_to_rgb(this.d_hemi_sky_color)
                    let d_hemi_ground_color = hex_to_rgb(this.d_hemi_ground_color)

                    let c_hemi_sky = [
                        this.tools.math.lerp(n_hemi_sky_color[0], d_hemi_sky_color[0], p),
                        this.tools.math.lerp(n_hemi_sky_color[1], d_hemi_sky_color[1], p),
                        this.tools.math.lerp(n_hemi_sky_color[2], d_hemi_sky_color[2], p)
                    ]

                    let c_hemi_ground = [
                        this.tools.math.lerp(n_hemi_ground_color[0], d_hemi_ground_color[0], p),
                        this.tools.math.lerp(n_hemi_ground_color[1], d_hemi_ground_color[1], p),
                        this.tools.math.lerp(n_hemi_ground_color[2], d_hemi_ground_color[2], p)
                    ]

                    let hemi_intensity = this.tools.math.lerp(this.n_hemi_intensity, this.d_hemi_intensity, Math.pow(p, 0.2))
                    this.hemi_light.intensity = hemi_intensity
                    this.hemi_light.color.set_any(c_hemi_sky)
                    this.hemi_light.groundColor.set_any(c_hemi_ground)

                    break
                }
            }
        })
    }
    on_tick(time_data) {
        if (this.use_sun_time) {
            let sun = this.find_component_of_type("Sun")
            if (sun) {
                this.time = sun.time
                if (sun.show_sphere === true) {
                    sun.show_sphere = false
                }
            } else {
                console.error(`[SkySphere] cannot get time from sun. no Sun found`)
            }
        }
    }
}

export default SkySphere;
