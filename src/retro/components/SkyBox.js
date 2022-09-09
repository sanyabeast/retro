
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import SceneComponent from "retro/SceneComponent";
import ResourceManager from "retro/ResourceManager";
import { CubeRefractionMapping, Color, LightProbe, UVMapping } from 'three';
import { LightProbeGenerator } from 'three/examples/jsm/lights/LightProbeGenerator';

class SkyBox extends SceneComponent {
    bakground = "#ffffff"
    color = "#ffffff"
    cubemap = undefined
    cubemap_format = undefined
    cubemap_gamma = 1
    texture = undefined
    light_probe_enabled = false
    light_probe_intensity = 0.45
    /**private */
    scene_background = undefined
    refraction_map = undefined
    light_probe = undefined
    light_probe_updated = false
    brightness = 1
    tint_color = "#ffffff"
    get_reactive_props() {
        return [
            "cubemap",
            "light_probe_intensity",
            "light_probe_enabled",
            "brightness",
            "tint_color",
            ...super.get_reactive_props()
        ]
    }
    on_update(props) {
        super.on_update(props)
        props.forEach(prop => {
            switch (prop) {
                case "cubemap": {
                    this.light_probe_updated = false
                    let scene = this.globals.app
                    scene.background = this.scene_background = scene.environment = this.create_background(
                        this.color,
                        this.cubemap,
                        this.texture,
                        CubeRefractionMapping,
                        cubemap => {
                            if (this.light_probe_enabled) {
                                this.light_probe.copy(LightProbeGenerator.fromCubeTexture(this.scene_background));
                                this.light_probe_updated = true
                                this.log(`lightprobe updated`)
                            }
                        }
                    )
                    scene.refraction_map = this.refraction_map = scene.environment = this.create_background(
                        this.color,
                        this.cubemap,
                        this.texture,
                        CubeRefractionMapping
                    )
                    break
                }
                case "light_probe_intensity": {
                    this.light_probe.intensity = this.light_probe_intensity
                    break
                }
                case "light_probe_enabled": {
                    if (this.light_probe_enabled && this.light_probe_updated === false) {
                        this.light_probe.copy(LightProbeGenerator.fromCubeTexture(this.scene_background));
                        this.light_probe_updated = true
                    }
                }
                case "brightness": {
                    this.renderer_component.set_background_brightness(this.brightness + (1 - this.cubemap_gamma))
                }
                case "tint_color": {
                    this.renderer_component.set_background_tint(this.tint_color)
                }
            }
        })
    }
    get_render_data() {
        return [
            {
                object: this.light_probe,
                parent: this.game_object,
                visible: this.light_probe_enabled
            }
        ]
    }
    on_create() {
        this.renderer_component = this.find_component_of_type("Renderer");
        let light_probe = this.light_probe = new LightProbe()
        light_probe.intensity = this.light_probe_intensity
    }
    create_background(color = "#ffffff", cubemap = undefined, texture = undefined, mapping = UVMapping, onload = () => { }) {
        if (cubemap === undefined && texture === undefined) {
            let c = new Color()
            c.set_any(color)
            return c
        } else {
            if (typeof cubemap === "string") {
                let t = ResourceManager.load_cubemap(this.cubemap, this.cubemap_format, onload)
                t.mapping = mapping
                return t
            }
        }
    }
    on_tick(time_data) {

    }
}

SkyBox.DEFAULT = {
    color: "#ff00ff",
    cubemap: "res/retro/plugins/extra-assets/cubemaps/icelake_1",
    cubemap_format: "jpg"
}

export default SkyBox;
