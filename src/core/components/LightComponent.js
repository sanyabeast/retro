
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import TransformComponent from "core/TransformComponent";
import AssetManager from "core/utils/AssetManager";
import * as THREE from 'three';

class LightComponent extends TransformComponent {
    type = "PointLight"
    intensity = 1
    color = "#eeffdd"
    distance = 0
    decay = 0
    save_prefab(){
        return {
            ...super.save_prefab(),
            type: this.type,
            intensity: this.intensity,
            color: this.color,
            distance: this.distance,
            decay: this.decay,
        }
    }
    on_created() {
        let light = this.subject = new THREE[this.type]({
            intensity: this.intensity,
            color: this.color,
            decay: this.decay,
            distance: this.distance,
        })

        let renderer = this.find_component_of_type("RendererComponent")
        if (renderer) {
            renderer.compile()
        }
    }
    get_render_data() {
        if (this.enabled) {
            return {
                object: this.subject,
                parent: this.object
            }
        }
    }
    get_reactive_props() {
        return [
            "intensity",
            "color",
            "distane",
            "decay"
        ].concat(super.get_reactive_props())
    }
    on_update() {
        this.subject.color.set_any(this.color)
        this.subject.distance = this.distance
        this.subject.intensity = this.intensity
        this.subject.decay = this.decay
    }
    on_tick(time_delta) {
    }
}

export default LightComponent;
