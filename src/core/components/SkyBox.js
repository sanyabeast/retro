
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import SceneComponent from "core/SceneComponent";
import ResourceManager from "core/ResourceManager";
import * as THREE from 'three';
import { LightProbeGenerator } from 'three/examples/jsm/lights/LightProbeGenerator';

class SkyBox extends SceneComponent {
    bakground = "#ffffff"
    color = "#ffffff"
    cubemap = undefined
    cubemap_format = undefined
    texture = undefined
    light_probe_enabled = true
    light_probe_intensity = 0.5
    /**private */
    scene_background = undefined
    refraction_map = undefined
    light_probe = undefined
    light_probe_updated = false
    get_reactive_props() {
        return [
            "cubemap",
            "light_probe_intensity",
            "light_probe_enabled",
            super.get_reactive_props()
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
                        THREE.CubeRefractionMapping,
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
                        THREE.CubeRefractionMapping
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
        let light_probe = this.light_probe = new THREE.LightProbe()
        light_probe.intensity = this.light_probe_intensity
    }
    create_background(color = "#ffffff", cubemap = undefined, texture = undefined, mapping = THREE.UVMapping, onload = () => { }) {
        if (cubemap === undefined && texture === undefined) {
            let c = new THREE.Color()
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
    on_tick(time_delta) {

    }
}

SkyBox.DEFAULT = {
    color: "#ff00ff",
    cubemap: "res/core/cubemaps/icelake_1",
    cubemap_format: "jpg"
}

export default SkyBox;
