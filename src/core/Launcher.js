/* created by @sanyabeast 8/14/2021 1:31:45 AM
 *
 *
 */


import AssetManager from "core/utils/AssetManager";
import * as THREE from 'three';

import { log, get_app_name } from "core/utils/Tools";
import Stats from "core/utils/Stats";
import DataComputed from "core/utils/DataComputed";
import EventDispatcher from "core/utils/EventDispatcher";


let AppObject = null
const APP_NAME = get_app_name()


if (APP_NAME === undefined) {
    console.log(`[Launcher] no app`)
} else {
    console.log(`[Launcher] loading application "${APP_NAME}"`)
    AppObject = require(`apps/${APP_NAME}/App`)
    AppObject = AppObject.default

}
class Launcher extends EventDispatcher {
    dom = null;
    globals = {
        skeleton_scale: 0.001,
        rendering_mode: 0,
        tick_skip: 1,
        _need_render: true,
        get need_render() { return this._need_render },
        set need_render(v) {
            this._need_render = v
        },
        transparent_background: false,
        rendering_postprocessing: true,
        rendering_antialias: false,
        dom_bounding_rect: { left: 0, top: 0, width: 1, height: 1 },
        show_stats: false,
        state: {
            debug: true,
            rendering_postprocessing: false,
            show_stats: true,
            transparent_background: true,
            rendering_antialias: false,
            forced_stop_motion: false,
            max_rocket_speed: 100
        },
        uniforms: {
            bc: { value: new THREE.Vector2(0, 1), type: "v2" },
            time: { value: 0, type: "f" },
            resolution: { value: new THREE.Vector2(1, 1), type: "v2" },
            pixel_ratio: { value: window.devicePixelRatio, type: "f" },
            mouse: { value: new THREE.Vector2(0, 0), type: "v2" },
            camera_pos: { value: new THREE.Vector3(), type: "v3" },
        },
        raycaster: new THREE.Raycaster(),
        dom: null,
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
    };
    stats = new Stats();
    constructor(params) {
        super();
        params = {
            outline: true,
            callbacks: {},
            ...params,
        };

        for (let param_k in params) {
            this.globals[param_k] = params[param_k];
        }

        this.stats.set_enabled(this.globals.show_stats);

        this.dom = this.globals.dom = document.createElement("div");
        this.dom.style.width = "100%";
        this.dom.style.height = "100%";
        this.dom.style.position = "relative";

        this.globals.launcher = this;
        this.globals.wait = this.wait;
        this.globals.stats = this.stats;

        F_GLOBAL_TICK_SKIP = new DataComputed(() => {
            return this.globals.tick_skip
        })
        window.F_THREE_PATCH_PROPS = (o) => {
            o.app = this;
            o.globals = this.globals;
        };

        window.F_BROADCAST_HOOK = this.handle_broadcast_hook.bind(this)
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

        this.init();
    }
    async init() {
        if (AppObject !== null) {
            this.app = this.globals.app = new AppObject();
            let bg_color = this.app.get_background_color()
            this.dom.style.background = bg_color
            this.log(`Launcher`, "initialized");
        }
    }
    wait(d) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, d);
        });
    }
    destroy() {
        this.app.destroy()
        this.app = null
        this.dom.remove()
    }
    handle_broadcast_hook(event_name, payload) {
        this.emit(`${event_name}`, payload)
    }
}

export default Launcher;
