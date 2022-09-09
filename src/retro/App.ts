/* created by @sanyabeast 8/14/2021 1:31:45 AM
 *
 *
 */

import ResourceManager from "retro/ResourceManager";
import GameObject from "retro/GameObject";
import Component from "retro/Component";
import { log, console } from "retro/utils/Tools"
import { isNil } from "lodash-es";

let page_reloading_requesting: Boolean = false


class RetroApp extends GameObject {
    /**private */
    dom: HTMLElement = undefined
    stage: GameObject = undefined
    stage_prefab: any = undefined
    constructor(params?: IGameObjectPrefab) {
        super({
            ...params,
        });

        this.setup_app()
        this.define_global_var("app", a => this)
        this.load_prefab(ResourceManager.load_prefab(PRESET.PERSISTENT_SCENE_PREFAB, {
            "components.renderer.params.pixel_ratio": Math.min(window.devicePixelRatio, 2)
        }))
    }
    reload_stage(): void {
        this.unload_stage()
        this.load_stage(this.stage_prefab)
    }
    unload_stage(): void {
        if (!isNil(this.stage)) {
            let stage: GameObject = this.stage
            stage.destroy()
            this.remove(stage)
            delete this.stage
        }
    }
    load_stage(prefab: any, prefab_options?: any): GameObject {
        this.stage_prefab = prefab
        let stage: GameObject = this.stage = new GameObject(ResourceManager.load_prefab(prefab, prefab_options))
        this.define_global_var("stage", a => stage)
        this.add(stage)
        this.start()
        return stage
    }
    setup_app(): void {
        let dom: HTMLElement = this.dom = document.createElement("div");
        this.dom.style.width = "100%";
        this.dom.style.height = "100%";
        this.dom.style.position = "relative";
        this.dom.style.userSelect = "none"
        this.dom.classList.add("root-dom")
        this.define_global_var("dom", a => dom)
    }
    override async on_destroy(): Promise<void> {
        await super.on_destroy()
        this.dom.remove()
        delete this.dom
    }
    get_background_color(): string {
        return "linear-gradient(#131638, #69003a)"
    }
    override tick(force: boolean = false): void {
        super.tick(force)
        // if (IS_PROD && PRESET.WORK_IN_BACKGROUND_MOBILE !== true) {
        if (IS_PROD && PRESET.WORK_IN_BACKGROUND_MOBILE !== true) {
            if (this.stage && this.tools.device.is_mobile && !this.tools.screen.is_document_visible) {
                console.log(`page goes background: unloading app`)
                this.unload_stage()
            }
            if (this.tools.device.is_mobile && this.tools.screen.is_document_visible && isNil(this.stage)) {
                if (!page_reloading_requesting) {
                    page_reloading_requesting = true
                    window.location.reload()
                }
            }
        }
    }
    start(): void {
        let clock: IClockComponent = this.find_component_of_type("ClockComponent") as unknown as IClockComponent
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