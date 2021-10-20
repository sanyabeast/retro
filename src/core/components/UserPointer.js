/* created by @sanyabeast 8/14/2021 1:31:45 AM
 *
 *
 */

import * as THREE from 'three';
import Component from "core/Component";
import { debounce } from "lodash-es";

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

class UserPointer extends Component {
    pointer_a = [0, 0];
    pointer_b = [0, 0];
    prev_pointer_a = [0, 0];
    prev_pointer_b = [0, 0];
    delta_a = [0, 0];
    delta_b = [0, 0];
    down = false;
    prev_down_time = -1
    dbl_click_duration = 300
    dbl_click = false
    raycasting = false;
    event_map = {
        move: ["mousemove", "touchmove"],
        over: ["mouseover"],
        out: ["mouseout"],
        down: ["mousedown", "touchstart"],
        press: ["click", "tap"],
        up: ["mouseup", "touchend"],
        scroll: ["mousewheel"],
    };
    event_alias = {};
    constructor(params) {
        super({
            events: ["move"],
            ...params,
        });
        this.check_raycasting_events_debounced = debounce(
            this.check_raycasting_events_debounced,
            50
        );
        this.handle_event = this.handle_event.bind(this);
        for (let k in this.event_map) {
            this.event_map[k].forEach((event_type) => {
                this.event_alias[event_type] = k;
            });
        }
        this.log(`UserPointer`, "component initialized");
    }

    on_enabled() {
        for (let k in this.event_map) {
            if (this.events.indexOf(k) > -1) {
                this.event_map[k].forEach((event_type) => {
                    document.body.addEventListener(
                        event_type,
                        this.handle_event
                    );
                });
            }
        }
    }

    on_disabled() {
        for (let k in this.event_map) {
            this.event_map[k].forEach((event_type) => {
                document.body.removeEventListener(
                    event_type,
                    this.handle_event
                );
            });
        }
    }

    check_pointer(x, y) {
        let rect = this.globals.dom_bounding_rect;
        return x > rect.left && (x < rect.left + rect.width) && y > rect.top && (y < rect.top + rect.height)
    }

    handle_event(evt) {
        if (!this.enabled) {
            return;
        }

        let now = +new Date()
        let rect = this.globals.dom_bounding_rect;
        let event_type = evt.type;
        let alias = this.event_alias[event_type];
        let pointer_a = this.pointer_a;
        let scroll_down = evt.wheelDelta > 0;

        if (evt.touches && evt.touches.length > 0) {
            if (!this.down && !this.check_pointer(evt.touches[0].pageX, evt.touches[0].pageY)) {
                return
            }
            pointer_a[0] = evt.touches[0].pageX - rect.left;
            pointer_a[1] = evt.touches[0].pageY - rect.top;
        } else if (!evt.touches) {
            if (!this.down && !this.check_pointer(evt.pageX, evt.pageY)) {
                return
            }
            pointer_a[0] = evt.pageX - rect.left;
            pointer_a[1] = evt.pageY - rect.top;
        }



        let delta_a = this.delta_a;
        delta_a[0] =
            (pointer_a[0] - this.prev_pointer_a[0]) *
            this.globals.uniforms.pixel_ratio.value;
        delta_a[1] =
            (pointer_a[1] - this.prev_pointer_a[1]) *
            this.globals.uniforms.pixel_ratio.value;


        if (alias === "down") {
            this.down = true;
            if (now - this.prev_down_time < this.dbl_click_duration) {
                alias = "dblclick"
            }
            this.prev_down_time = now
        }
        if (alias === "up") {
            this.down = false;
        }

        if (this.down && alias === "move") {
            alias = "drag";
        }

        if (typeof this.object[`handle_pointer${alias}`] === "function") {
            this.object[`handle_pointer${alias}`]({
                pointer_a: pointer_a,
                delta_a,
                scroll_down,
            });
        }
        this.components.forEach((component) => {
            if (typeof component[`handle_pointer${alias}`] === "function") {
                component[`handle_pointer${alias}`]({
                    pointer_a: pointer_a,
                    delta_a,
                    scroll_down,
                    date: now
                });
            }
        });

        this.prev_pointer_a[0] = pointer_a[0];
        this.prev_pointer_a[1] = pointer_a[1];

        mouse.x = (pointer_a[0] / this.globals.resolution.x) * 2 - 1;
        mouse.y = -(pointer_a[1] / this.globals.resolution.y) * 2 + 1;

        if (this.raycasting) {
            if (alias !== "move" && alias !== "drag") {
                this.check_raycasting_events(alias);
            } else {
                this.check_raycasting_events_debounced(alias);
            }
        }
    }

    check_raycasting_events(event_type) {
        raycaster.setFromCamera(mouse, this.globals.camera);
        let objects = [];

        if (typeof this.object.get_raycasted === "function") {
            objects = objects.concat(this.object.get_raycasted());
        }
        this.components.forEach((component) => {
            // console.log(component.constructor.name)
            if (typeof component.get_raycasted === "function") {
                objects = objects.concat(component.get_raycasted());
            }
        });

        const intersects = raycaster.intersect_objects(objects);
        if (typeof this.object.handle_raycasted === "function") {
            this.object.handle_raycasted(intersects, event_type);
        }
        this.components.forEach((component) => {
            // console.log(component.constructor.name)
            if (typeof component.handle_raycasted === "function") {
                component.handle_raycasted(intersects, event_type);
            }
        });
    }
    check_raycasting_events_debounced(event_type) {
        return this.check_raycasting_events(event_type);
    }
}

export default UserPointer;
