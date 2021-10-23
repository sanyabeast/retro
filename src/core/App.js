/* created by @sanyabeast 8/14/2021 1:31:45 AM
 *
 *
 */

import AssetManager from "core/utils/AssetManager";
import DevGUI from "core/gui/DevGUI.vue"
import * as THREE from 'three';
import GameObject from "core/GameObject";
import { log } from "core/utils/Tools"

class CoreApp extends GameObject {
    constructor(params) {
        super({
            ...params,
        });

        this.globals.app = this

        this.load_prefab(AssetManager.load_prefab("core.kit_basic_scene", {
            "components.renderer.params.pixel_ratio": Math.min(window.devicePixelRatio, 2),
            "components.devgui.params.root_component": DevGUI
        }))

    }
    get_background_color () {
        return "linear-gradient(#131638, #69003a)"
    }
    on_tick(){
        let time = this.globals.uniforms.time.value
        let camera = this.find_component_of_type("CameraComponent")
    }
    start () {
        let clock = this.find_component_of_type("ClockComponent")
        if (clock){
            log(`App`, `starting clock...`)
            clock.begin_tick()
        } else {
            log(`App`, `cant find clock component. application did not started`)
        }
    }
}

export default CoreApp;
