/* created by @sanyabeast 8/14/2021 1:31:45 AM
 *
 *
 */

import ResourceManager from "retro/ResourceManager";
import GameObject from "retro/GameObject";
import { log, console } from "retro/utils/Tools"



class RetroApp extends GameObject {
    /**private */
    dom = undefined
    stage = undefined
    stage_prefab = undefined
    constructor(params) {
        super({
            ...params,
        });

        this.setup_app()
        this.define_global_var("app", a => this)
        this.load_prefab(ResourceManager.load_prefab(PRESET.PERSISTENT_SCENE_PREFAB, {
            "components.renderer.params.pixel_ratio": Math.min(window.devicePixelRatio, 2)
        }))

    }
    reload_stage() {
        this.unload_stage()
        this.load_stage(this.stage_prefab)
    }
    unload_stage() {
        let stage = this.stage
        stage.destroy()
        this.remove(stage)
    }
    load_stage(prefab, prefab_options) {
        this.stage_prefab = prefab
        let stage = this.stage = new GameObject(ResourceManager.load_prefab(prefab, prefab_options))
        this.define_global_var("stage", a => stage)
        this.add(stage)
        this.start()
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

export default RetroApp;
