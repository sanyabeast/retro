/* created by @sanyabeast 8/14/2021 1:31:45 AM
 *
 *
 */

import ResourceManager from "core/ResourceManager";
import DevGUI from "core/gui/DevGUI.vue"
import * as THREE from 'three';

import GameObject from "core/GameObject";
import { log, console } from "core/utils/Tools"

class CoreApp extends GameObject {
    /**private */
    dom = undefined
    stage = undefined
    constructor(params) {
        super({
            ...params,
        });

        this.setup_app()
        this.define_global_var("app", a => this)
        this.load_prefab(ResourceManager.load_prefab("core.scenes.persistent", {
            "components.renderer.params.pixel_ratio": Math.min(window.devicePixelRatio, 2),
            "components.devgui.params.root_component": DevGUI
        }))

    }
    load_stage(prefab) {
        let stage = this.stage = new GameObject(prefab)
        this.define_global_var("stage", a => stage)
        this.add(stage)
        return stage
    }
    setup_app() {
        let dom = this.dom = document.createElement("div");

        this.dom.style.width = "100%";
        this.dom.style.height = "100%";
        this.dom.style.position = "relative";
        this.dom.style.userSelect = "none"
        this.dom.classList.add("root-dom")

        this.define_global_var("dom", a => dom)
    }
    get_background_color() {
        return "linear-gradient(#131638, #69003a)"
    }
    on_tick() {
        //
    }
    start() {
        let clock = this.find_component_of_type("ClockComponent")
        this.start_game()
        if (clock) {
            log(`App`, `starting clock...`)
            clock.begin_tick()
        } else {
            log(`App`, `cant find clock component. application did not started`)
        }
    }
}

export default CoreApp;
