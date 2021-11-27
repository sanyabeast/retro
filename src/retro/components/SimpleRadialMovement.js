
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import Component from "retro/Component";
import ResourceManager  from "retro/ResourceManager";

class SimpleRadialMovement extends Component {
    speed = 1;
    radius = 2
    on_create() {
    }
    on_tick(time_data) {
        this.game_object.position[0] = Math.sin((+new Date()/1000) * this.speed) * this.radius
        this.game_object.position[1] = Math.cos((+new Date()/1000) * this.speed) * this.radius
        this.game_object.position = this.game_object.position
    }
}

export default SimpleRadialMovement;
