
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import SceneComponent from "core/SceneComponent";
import AssetManager from "core/utils/AssetManager";
import { union } from "lodash";
import { Vector2 } from "spine-ts-threejs";
import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

class SkySphere extends SceneComponent {
    time = 0
    use_sun_time = true
    use_exposure = true

    d_turbidity = 20
    d_rayleigh = 0
    d_mie_coeff = 0.1
    d_mie_direct = 0
    d_elevation = 90
    d_azimuth = 180
    d_exposure = 1
    d_opacity = 1

    n_turbidity = 20
    n_rayleigh = 4
    n_mie_coeff = 0.1
    n_mie_direct = 0
    n_elevation = -90
    n_azimuth = 180
    n_opacity = 0.5
    n_exposure = 1

    /**private */
    tick_rate = 10

    on_created() {
        let sky = this.subject = new Sky();
        sky.scale.setScalar(450000);
        let sun = this.sun_vector = new THREE.Vector3();

        let material = sky.material
        material.blending = THREE.CustomBlending;
        material.blendEquation = THREE.AddEquation; //default
        material.blendSrc = THREE.SrcAlphaFactor; //default
        material.blendDst = THREE.OneMinusSrcAlphaFactor; //default

    }
    get_render_data() {
        return [{
            object: this.subject,
            parent: this.object
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

                    let c_turbidity = this.lerp(this.n_turbidity, this.d_turbidity, p)
                    let c_rayleigh = this.lerp(this.n_rayleigh, this.d_rayleigh, p)
                    let c_mie_coeff = this.lerp(this.n_mie_coeff, this.d_mie_coeff, p)
                    let c_mie_direct = this.lerp(this.n_mie_direct, this.d_mie_direct, p)
                    let c_elevation = this.lerp(this.n_elevation, this.d_elevation, p)
                    let c_azimuth = this.lerp(this.n_azimuth, this.d_azimuth, p)
                    let c_exposure = this.lerp(this.n_exposure, this.d_exposure, p)
                    let c_opacity = this.lerp(this.n_opacity, this.d_opacity, p)


                    const uniforms = this.subject.material.uniforms;
                    uniforms['turbidity'].value = c_turbidity;
                    uniforms['rayleigh'].value = c_rayleigh
                    uniforms['mieCoefficient'].value = c_mie_coeff
                    uniforms['mieDirectionalG'].value = c_mie_direct
                    // uniforms['opacity'].value = c_opacity

                    // console.log(uniforms['opacity'].value)

                    if (this.use_sun_time === true) {
                        let sun = this.find_component_of_type("Sun")
                        uniforms['sunPosition'].value.copy(sun.sphere.position);
                    } else {
                        const phi = THREE.MathUtils.degToRad(90 - c_elevation);
                        const theta = THREE.MathUtils.degToRad(c_azimuth);
                        this.sun_vector.setFromSphericalCoords(1, phi, theta);
                        uniforms['sunPosition'].value.copy(this.sun_vector);
                    }

                    break
                }
            }
        })
    }
    on_tick(time_delta) {
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
