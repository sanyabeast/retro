/* created by @sanyabeast 9/6/2021
 *
 *
 */

import SceneComponent from "retro/SceneComponent";
import ResourceManager from "retro/ResourceManager";
import { ShaderMaterial } from 'three';

import { Text } from "troika-three-text";

class TextComponent extends SceneComponent {
    text = ""
    font_size = 16
    color = "#ffffff"
    opacity = 1
    anchor_x = 0.5
    anchor_y = 0.5
    save_prefab() {
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
    get_reactive_props() {
        return ["text", "font_size", "color", "opacity", "anchor_x", "anchor_y"].concat(super.get_reactive_props())
    }
    get_render_data() {
        return {
            object: this.subject,
            parent: this.game_object
        }
    }
    on_create() {
        const subject = this.subject = new Text();

        this.meta.layers.normal = false

        subject.depthWrite = false
        subject.depthTest = false
        subject.stencilWrite = false
        subject.material._depthMaterial = subject._depthMaterial = new ShaderMaterial({
            vertexShader: `
                void main(){
                    gl_FragCoord = vec4(0., 0., 0., 1.);
                }
            `
        })
        this.init_visibility_rule()
    }
    on_update(props) {
        super.on_update(...arguments)
        let subject = this.subject
        let changed = false

        if (subject.text !== this.text) {
            subject.text = this.text
            changed = true
        }
        if (subject.fontSize !== this.font_size) {
            subject.fontSize = this.font_size / 100
            changed = true
        }
        if (subject.color !== this.color) {
            subject.color = this.color
            changed = true
        }
        if (subject.fillOpacity !== this.opacity) {
            subject.fillOpacity = this.opacity
            changed = true
        }
        if (subject.anchorX !== this.anchor_x) {
            subject.anchorX = this.anchor_x
            changed = true
        }
        if (subject.anchorY !== this.anchor_y) {
            subject.anchorY = this.anchor_y
            changed = true
        }

        if (changed) {
            subject.sync();
        }
    }

    set_text(text) {
        this.text = text
    }
}

export default TextComponent;