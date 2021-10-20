/* created by @sanyabeast 8/20/2021 08:11:31 AM
 *
 *
 */

import Component from "core/Component";
import CanvasText from "core/objects/CanvasText";
import * as THREE from 'three';

class CanvasTextComponent extends Component {
    offset = [0, 0, 0];
    inited = true
    tick_skip = 8
    on_created() {
        this.canvas_text = new CanvasText({
            text: this.text,
            fill_style: this.fill_style,
            gradient: this.gradient,
            background_image: this.background_image,
            fixed_width: this.fixed_width,
            fixed_height: this.fixed_height,
            shrink: this.shrink,
            font_family: this.font_family,
            font_weight: this.font_weight,
            font_size: this.font_size,
            offset_x: this.offset_x,
            offset_y: this.offset_y,
        })

        if (this.position !== undefined) {
            this.canvas_text.position.set(...this.position);
        }
        if (this.scale !== undefined) {
            this.canvas_text.scale.set(...this.scale);
        }
        if (this.rotation !== undefined) {
            this.canvas_text.rotation.set(...this.rotation);
        }

        if (this.frustum_culled !== undefined) {
            this.canvas_text.frustumCulled = this.frustum_culled
        }

        if (typeof this.visibility_rule === "function") {
            Object.defineProperty(this.canvas_text, "visible", {
                get: () => {
                    return this.visibility_rule()
                }
            })
        }

        if (typeof this.render_layer === "number") {
            this.canvas_text.render_layer = this.render_layer
        }

        if (typeof this.render_index === "number") {
            this.canvas_text.render_index = this.render_index
        }
    }
    on_enabled() {
        if (this.inited) {
            this.canvas_text.init()
            this.inited = true
        }
        this.object.add(this.canvas_text)
    }
    on_disabled() {
        this.object.remove(this.canvas_text)
    }
    set_text(t) {
        this.canvas_text.set_text(t)
    }
}

export default CanvasTextComponent;
