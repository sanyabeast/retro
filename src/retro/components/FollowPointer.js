/* created by @sanyabeast 8/20/2021 08:11:31 AM
 *
 *
 */

import Component from "retro/Component";

class FollowPointer extends Component {
    offset = [0, 0, 0];
    on_create() {
    }
    handle_pointermove(evt) {
        let global_pos = this.globals.camera.screen_to_world(evt.pointer_a);
        this.object.position = [
            global_pos[0] + this.offset[0],
            global_pos[1] + this.offset[1],
            global_pos[2] + this.offset[2]
        ]
    }
}

export default FollowPointer;
