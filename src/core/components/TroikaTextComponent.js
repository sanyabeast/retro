/* created by @sanyabeast 9/6/2021
 *
 *
 */

import TransformComponent from "core/TransformComponent";
import AssetManager from "core/utils/AssetManager";
import * as THREE from 'three';

import { Text } from "troika-three-text";

class TroikaTextComponent extends TransformComponent {
    text = ""
    font_size = 1
    color = "#ffffff"
    opacity = 1
    anchor_x = 0.5
    anchor_y = 0.5
    save_prefab(){
        return {
            ...super.save_prefab(),
            text: this.text,
            font_size: this.font_size,
            color: this.color,
            opacity: this.opacity,
            anchor_x: this.anchor_x,
            anchor_y: this.anchor_y,
        }
    }
    ger_reactive_props() {
        return ["text", "font_size", "color", "opacity", "anchor_x", "anchor_y"].concat(super.get_reactive_props())
    }
    get_render_data () {
        return {
            object: this.subject,
            parent: this.object
        }
    }
    on_created() {
        const subject = this.subject = new Text();
        this.init_visibility_rule()
    }
    on_update() {
        super.on_update(...arguments)
        let subject = this.subject
        subject.text = this.text;
        subject.fontSize = this.font_size
        subject.color = this.color;
        subject.fillOpacity = this.opacity
        subject.anchorX = this.anchor_x
        subject.anchorY = this.anchor_y
        subject.sync();
    }

    set_text(text) {
        this.text = text
    }
}

export default TroikaTextComponent;