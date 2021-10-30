
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import Component from "core/Component";
import AssetManager  from "core/utils/AssetManager";
import * as THREE from 'three';

class SimpleRadialMovement extends Component {
    speed = 1;
    radius = 2
    on_create() {
    }
    on_tick(time_delta) {
        this.object.position.x = Math.sin((+new Date()/1000) * this.speed) * this.radius
        this.object.position.y = Math.cos((+new Date()/1000) * this.speed) * this.radius
    }
}

export default SimpleRadialMovement;
