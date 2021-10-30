
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import Component from "core/Component";
import AssetManager  from "core/utils/AssetManager";
import * as THREE from 'three';

class SimpleRotator extends Component {
    speed = 1;
    axis = new THREE.Vector3(0, 0, 1)
    on_create() {
    }
    on_tick(time_delta) {
        this.object.rotation.x += this.axis.x * this.speed
        this.object.rotation.y += this.axis.y * this.speed
        this.object.rotation.z += this.axis.z * this.speed
    }
}

export default SimpleRotator;
