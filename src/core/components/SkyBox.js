
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import Component from "core/Component";
import ResourceManager from "core/ResourceManager";
import * as THREE from 'three';

class SkyBox extends Component {
    bakground = "#ffffff"
    color = "#ffffff"
    cubemap = undefined
    cubemap_format = undefined
    texture = undefined
    /**private */
    scene_background = undefined
    refraction_map = undefined
    get_reactive_props() {
        return [
            "cubemap",
            super.get_reactive_props()
        ]
    }
    on_update(props) {
        super.on_update(props)
        props.forEach(prop => {
            switch (prop) {
                case "cubemap": {
                    let scene = this.globals.app
                    scene.background = this.scene_background = scene.environment = this.create_background(
                        this.color,
                        this.cubemap,
                        this.texture,
                        THREE.CubeRefractionMapping
                    )

                    scene.refraction_map = this.refraction_map = scene.environment = this.create_background(
                        this.color,
                        this.cubemap,
                        this.texture,
                        THREE.CubeRefractionMapping
                    )
                    break
                }
            }
        })
    }
    on_create() {

    }
    create_background(color = "#ffffff", cubemap = undefined, texture = undefined, mapping = THREE.UVMapping) {
        if (cubemap === undefined && texture === undefined) {
            let c = new THREE.Color()
            c.set_any(color)
            return c
        } else {
            if (typeof cubemap === "string") {
                let t = ResourceManager.load_cubemap(this.cubemap, this.cubemap_format)
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
