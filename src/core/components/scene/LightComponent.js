
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import SceneComponent from "core/SceneComponent";
import ResourceManager from "core/ResourceManager";
import * as THREE from 'three';

const LAMP_ICON_TEXTURE = new THREE.TextureLoader().load('res/core/gizmo/lamp_a.png');
const LAMP_ICON_MATERIAL = new THREE.SpriteMaterial({ map: LAMP_ICON_TEXTURE });

class LightComponent extends SceneComponent {
    type = "PointLight"
    intensity = 1
    color = "#eeffdd"
    distance = 1
    decay = 0
    sky_color = "#ffaaaa"
    ground_color = "#aaaaff"
    shadows_enabled = false
    /**private */
    gizmo_lamp_icon = undefined
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
    on_create() {
        let light

        this.meta.layers.lights = true

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


        let renderer = this.find_component_of_type("Renderer")
        if (renderer) {
            renderer.compile()
        }

        /**gizmo */
        const gizmo_lamp_icon = this.gizmo_lamp_icon = new THREE.Sprite(LAMP_ICON_MATERIAL);
        gizmo_lamp_icon.scale.set(0.05, 0.05, 0.05)
        gizmo_lamp_icon.material.sizeAttenuation = false
        gizmo_lamp_icon.material.depthTest = false
        gizmo_lamp_icon.material.depthWrite = false
        gizmo_lamp_icon.renderOrder = 1
    }
    get_render_data() {
        return [{
            object: this.subject,
            parent: this.game_object
        }]
    }
    get_gizmo_render_data() {
        return [{
            object: this.gizmo_lamp_icon,
            parent: this.subject,
            layers: { gizmo: true }
        }]
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
