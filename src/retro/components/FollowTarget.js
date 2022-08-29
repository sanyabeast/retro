/* created by @sanyabeast 8/14/2021 1:31:45 AM
 *
 *
 */

import Component from "retro/Component";

class FollowTarget extends Component {
    offset = [0, 0, 0];
    on_create() {
        this.log(`FollowTarget`, "component created");
    }
    on_tick(time_data) {
        if (this.target) {
            this.game_object.position[0] = this.target.position.x + this.offset[0];
            this.game_object.position[1] = this.target.position.y + this.offset[1];
            this.game_object.position[2] = this.target.position.z + this.offset[2];
            this.game_object.position = this.game_object.position
        }
    }
}

export default FollowTarget;
