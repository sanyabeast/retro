/* created by @sanyabeast 8/14/2021 1:31:45 AM
 *
 *
 */

import { Mesh, Material, Color, Sprite, SpriteMaterial } from 'three';
import ResourceManager from "retro/ResourceManager";
import SceneComponent from "retro/SceneComponent";
import { set, get, isString, isFunction, isArray, isNumber } from "lodash-es"
import { log, error, console } from "retro/utils/Tools"

class SpriteComponent extends SceneComponent {
    src = null;
    tick_rate = 5
    on_create() {
        let subject = this.subject = new Sprite(new SpriteMaterial({
            map: this.src
        }))
    }
    on_tick() {
    }
    get_render_data() {
        return [{
            object: this.subject,
            parent: this.game_object
        }]
    }
    get_reactive_props() {
        return [
        ].concat(super.get_reactive_props())
    }
    on_update(props) {
        super.on_update(...arguments)
        
    }
    on_enable() {
        this.globals.need_update_render_list = true
    }
    on_disable() {
        this.globals.need_update_render_list = true
    }
    on_destroy() {
        super.on_destroy(...arguments)
        // this.object.remove(this.subject);
        // this.globals.need_update_render_list = true
    }
}

export default SpriteComponent;
