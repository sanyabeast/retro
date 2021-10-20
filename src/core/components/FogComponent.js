
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import Component from "core/Component";
import AssetManager from "core/utils/AssetManager";
import * as THREE from 'three';

class FogComponent extends Component {
    color = "#ffffff"
    density = 1
    near = 0.025
    far = 10
    on_created() {
        this.fog_exp = new THREE.FogExp2(this.color, this.density)
        this.fog = new THREE.Fog(this.color, this.near, this.far)
    }
    on_enabled() {
        let scene = this.globals.app
        console.log(scene)
        scene.background = this.color
        scene.fog = this.fog_exp
    }
    on_tick(time_delta) {

    }
}

FogComponent.DEFAULT = {

    color: "#394047",
    density: 0.075
}

export default FogComponent;
