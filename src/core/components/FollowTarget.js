/* created by @sanyabeast 8/14/2021 1:31:45 AM
 *
 *
 */

import Component from "core/Component";
import * as THREE from 'three';

class FollowTarget extends Component {
    offset = [0, 0, 0];
    on_created() {
        this.log(`FollowTarget`, "component created");
    }
    on_tick(time_delta) {
        if (this.target) {
            this.object.position.x = this.target.position.x + this.offset[0];
            this.object.position.y = this.target.position.y + this.offset[1];
            this.object.position.z = this.target.position.z + this.offset[2];
        }
    }
}

export default FollowTarget;
