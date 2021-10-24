
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import Component from "core/Component";
import AssetManager from "core/utils/AssetManager";
import * as THREE from 'three';

class SkyBox extends Component {
    bakground = "#ffffff"
    color = "#ffffff"
    cubemap = undefined
    cubemap_format = undefined
    texture = undefined
    /**private */
    scene_background = undefined
    on_created() {
        let scene = this.globals.app
        scene.background = this.scene_background = scene.environment = this.create_background(
            this.color,
            this.cubemap,
            this.texture
        )

        console.log(scene.background)
    }
    create_background(color = "#ffffff", cubemap = undefined, texture = undefined) {
        if (cubemap === undefined && texture === undefined) {
            let c = new THREE.Color()
            c.set_any(color)
            return c
        } else {
            if (typeof cubemap === "string") {
                let t = AssetManager.load_cubemap(this.cubemap, this.cubemap_format)
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
