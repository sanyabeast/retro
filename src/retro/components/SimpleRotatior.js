
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import Component from "retro/Component";
import ResourceManager from "retro/ResourceManager";
import { Vector3 } from 'three';

class SimpleRotator extends Component {
    speed = 1;
    axis = new THREE.Vector3(0, 0, 1)
    on_create() {
    }
    on_tick(time_data) {
        this.game_object.rotation[0] += this.axis.x * this.speed
        this.game_object.rotation[1] += this.axis.y * this.speed
        this.game_object.rotation[2] += this.axis.z * this.speed
        this.game_object.rotation = this.game_object.rotation
    }
}

export default SimpleRotator;
