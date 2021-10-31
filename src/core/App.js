/* created by @sanyabeast 8/14/2021 1:31:45 AM
 *
 *
 */

import ResourceManager from "core/utils/ResourceManager";
import DevGUI from "core/gui/DevGUI.vue"
import * as THREE from 'three';
import DataComputed from "core/utils/DataComputed";
import GameObject from "core/GameObject";
import { log, console } from "core/utils/Tools"

class CoreApp extends GameObject {
    /**private */
    dom = undefined
    globals = undefined
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
        let stage = this.stage = this.globals.stage = new GameObject(prefab)
        this.add(stage)
        return stage
    }
    setup_app() {
        this.globals = {
            stage: undefined,
            dom_rect: { left: 0, top: 0, width: 1, height: 1 },
            uniforms: {
                bc: { value: new THREE.Vector2(0, 1), type: "v2" },
                time: { value: 0, type: "f" },
                resolution: { value: new THREE.Vector2(1, 1), type: "v2" },
                pixel_ratio: { value: window.devicePixelRatio, type: "f" },
                mouse: { value: new THREE.Vector2(0, 0), type: "v2" },
                camera_pos: { value: new THREE.Vector3(), type: "v3" },
            },
            get resolution() {
                return this.uniforms.resolution.value;
            },
            get pixel_ratio() {
                return this.uniforms.pixel_ratio.value;
            },
            get mouse() {
                return this.uniforms.mouse.value;
            },
            mouse: null,
            log: this.log
        }

        let dom = this.dom = document.createElement("div");
        this.define_global_var("dom", a => dom)
        this.dom.style.width = "100%";
        this.dom.style.height = "100%";
        this.dom.style.position = "relative";
        this.dom.style.userSelect = "none"
        this.dom.classList.add("root-dom")

        F_GLOBAL_TICK_SKIP = new DataComputed(() => {
            return this.globals.tick_skip
        })
        window.F_THREE_PATCH_PROPS = (o) => {
            o.app = this;
            o.globals = this.globals;
        };
        window.F_BROADCAST_HOOK = () => {
            console.log("BRDCST HOOK ")
        }
        window.F_PATCH_COMP_PROPS = (o) => {
            o.app = this;
            o.globals = this.globals;
        }
        window.F_THREE_PATCH_UNIFORMS = (uniforms, object) => {
            for (let k in this.globals.uniforms) {
                uniforms[k] = {
                    type: this.globals.uniforms[k].type,
                    value: new DataComputed(() => {
                        return this.globals.uniforms[k].value;
                    }, 4),
                };
            }
            uniforms.object_position = {
                type: "v3",
                value: new DataComputed(() => {
                    return object.position;
                }),
            };
        };
    }
    get_background_color() {
        return "linear-gradient(#131638, #69003a)"
    }
    on_tick() {
        let time = this.globals.uniforms.time.value
        let camera = this.find_component_of_type("CameraComponent")
    }
    start() {
        let clock = this.find_component_of_type("ClockComponent")
        this.handle_game_start()
        if (clock) {
            log(`App`, `starting clock...`)
            clock.begin_tick()
        } else {
            log(`App`, `cant find clock component. application did not started`)
        }
    }
}

export default CoreApp;
