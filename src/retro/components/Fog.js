
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import Component from "retro/Component";
import ResourceManager from "retro/ResourceManager";
import * as THREE from 'three';

class Fog extends Component {
    color = "#1f3556"
    density = 1
    near = 0.025
    far = 10
    use_linear = false
    get_reactive_props() {
        return [
            "color",
            "density",
            "near",
            "far",
            "use_linear"
        ].concat(super.get_reactive_props())
    }
    on_update(props) {
        props.forEach(prop => {
            switch (prop) {
                case "use_linear": {
                    let scene = this.globals.app
                    scene.background = scene.background || this.color
                    scene.fog = this.use_linear ? this.fog : this.fog_exp
                    break
                }
                default: {
                    this.fog_exp.color.set_any(this.color)
                    this.fog_exp.density = this.density
                    this.fog_exp.near = this.near
                    this.fog_exp.far = this.far

                    this.fog.color.set_any(this.color)
                    this.fog.density = this.density
                    this.fog.near = this.near
                    this.fog.far = this.far
                }
            }
        })
    }
    on_create() {
        this.fog_exp = new THREE.FogExp2()
        this.fog = new THREE.Fog()

        this.fog_exp.color.set_any(this.color)
        this.fog_exp.density = this.density
        this.fog_exp.near = this.near
        this.fog_exp.far = this.far

        this.fog.color.set_any(this.color)
        this.fog.density = this.density
        this.fog.near = this.near
        this.fog.far = this.far
    }
    on_enable() {
        let scene = this.globals.app
        scene.background = scene.background || this.color
        scene.fog = this.fog_exp
    }
    on_tick(time_delta) {

    }
}

Fog.DEFAULT = {
    color: "#1f3556",
    density: 0.035
}

export default Fog;
