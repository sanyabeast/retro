
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
    distance = 1
    decay = 0
    sky_color = "#ffaaaa"
    ground_color = "#aaaaff"
    shadows_enabled = false
    save_prefab() {
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
        let light
        switch (this.type) {
            case "HemisphereLight": {
                light = this.subject = new THREE.HemisphereLight(this.sky_color, this.ground_color, this.intensity)
                break
            }
            case "DirectionalLight": {
                light = this.subject = new THREE.DirectionalLight({
                    intensity: this.intensity,
                    color: this.color,
                    decay: this.decay,
                    distance: this.distance,
                })

                console.log(light)
                break
            }
            case "PointLight": {
                light = this.subject = new THREE.PointLight(this.color, this.intensity, this.distance, this.decay)
                break
            }
            case "SpotLight": {
                light = this.subject = new THREE.SpotLight(this.color)
                break
            }
            default: {
                light = this.subject = new THREE[this.type]({
                    intensity: this.intensity,
                    color: this.color,
                    decay: this.decay,
                    distance: this.distance,
                })
            }
        }

        if (this.shadows_enabled) {
            if (light.shadow) {
                light.shadow.mapSize.width = 512;
                light.shadow.mapSize.height = 512;
                light.shadow.camera.near = 0.5;
                light.shadow.camera.far = 1000
            }
            light.castShadow = true
        }


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
            "distance",
            "decay",
            "sky_color",
            "ground_color",
            "shadows_enabled"
        ].concat(super.get_reactive_props())
    }
    on_update(props) {
        super.on_update(...arguments)
        props.forEach(prop => {
            switch (prop) {
                case "color": {
                    this.subject.color.set_any(this.color)
                    break
                }
                case "sky_color": {
                    this.subject.color.set_any(this.sky_color)
                    break
                }
                case "ground_color": {
                    if (this.subject.ground_color !== undefined) {
                        this.subject.ground_color.set_any(this.ground_color)
                    }
                    break
                }
                case "shadows_enabled": {
                    this.subject.castShadow = this.shadows_enabled
                    break
                }
                default: {
                    this.subject.distance = this.distance
                    this.subject.intensity = this.intensity
                    this.subject.decay = this.decay
                }
            }
        })


    }
    on_tick(time_delta) {
        super.on_tick(...arguments)
    }
}

export default LightComponent;
