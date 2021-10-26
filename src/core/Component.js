/* created by @sanyabeast 8/14/2021 1:31:45 AM
 *
 *
 */

import { log } from "core/utils/Tools";
import EventDispatcher from "core/utils/EventDispatcher";
import { get, isObject, isArray } from "lodash-es"
import AssetManager from "core/utils/AssetManager"
import Schema from "core/utils/Schema"

let id = 0
const exclude_props = [
    "components"
]


class Component extends EventDispatcher {
    tick_data = undefined
    object = null;
    subject = null;
    enabled = true;
    globals = undefined
    tick_rate = 30
    tick_enabled = true
    constructor(params) {
        super(params);
        this.meta = {
            enabled: true,
            layers: {
                rendering: true,
                normal: true,
                raycast: false,
                collision: false,
                gizmo: false,
                lights: false
            },
            params_applied: false,
            params: {},
            ticking: {
                prev_time: +new Date(),
                delta: 1,
                ticks: 0,
                rate: 30,
                enabled: true
            }
        }


        /**common patch */
        if (window.F_PATCH_COMP_PROPS) {
            window.F_PATCH_COMP_PROPS(this)
        }
        this.id = id
        id++
        this.meta.params = params || this.meta.params;
        if (this.topics) {
            this.topics.forEach(event_name => this.listen(event_name))
        }
    }
    tick(tick_data) {
        this.meta.ticking.rate = this.tick_rate
        this.meta.ticking.enabled = this.tick_enabled

        if (this.meta.ticking.enabled) {
            let now = +new Date()
            if (now - this.meta.ticking.prev_time >= (1000 / this.meta.ticking.rate)) {
                let d = now - this.meta.ticking.prev_time
                let delta = d / (1000 / 60)
                this.meta.ticking.ticks++
                this.meta.ticking.now = now
                this.meta.ticking.prev_time = now
                this.on_tick(this.meta.ticking)
            }

        }
    }
    save_prefab() {
        let r = {
            enabled: this.enabled,
            name: this.name,
            ref: this._ref
        }
        return r
    }
    get_reactive_props() {
        return []
    }
    force_update() {
        let reactive_props = this.get_reactive_props()
        reactive_props.forEach(prop => {
            this[prop] = this[prop]
        })
    }
    apply_params() {
        let params = this.meta.params
        if (!this.meta.params_applied) {
            this.meta.params_applied = true;
            for (let k in params) {
                switch (k) {
                    case "on_tick": {
                        this._on_tick = params[k]
                        break
                    }
                    case "on_enabled": {
                        this._on_enabled = params[k]
                        break
                    }
                    case "on_disabled": {
                        this._on_disabled = params[k]
                        break
                    }
                    case "on_created": {
                        this._on_created = params[k]
                        break
                    }
                    case "on_destroy": {
                        this._on_created = params[k]
                        break
                    }
                    default: {
                        if (exclude_props.indexOf(k) < 0) {
                            this[k] = params[k]

                        }
                    }
                }
            }
        }

        if (isArray(this.meta.layers.include)) {
            this.meta.layers.include.forEach(name => {
                this.meta.layers[name] = true
            })
        }

        if (isArray(this.meta.layers.exclude)) {
            this.meta.layers.exclude.forEach(name => {
                this.meta.layers[name] = true
            })
        }


    }
    on_update() { }
    on_created() {
        if (this._on_created) this._on_created(td)
    }
    on_destroy() {
        if (this._on_destroy) this._on_destroy(td)
    }
    on_tick(td) {
        if (this._on_tick) this._on_tick(td)
    }
    on_enabled() {
        if (this._on_enabled) this._on_enabled(td)
    }
    on_disabled() {
        if (this._on_disabled) this._on_disabled(td)
    }
    get parent() {
        let r = null;
        if (this.object && this.object.parent) {
            r = this.object.parent;
        }
        return r;
    }
    get enabled() {
        return this.meta.enabled;
    }
    set enabled(v) {
        if (v !== this.meta.enabled) {
            if (v) {
                this.on_enabled();
            } else {
                this.on_disabled();
            }

            this.meta.enabled = v;
        }
    }
    get refs() {
        return this.object.refs;
    }
    get camera() {
        return this.globals.camera;
    }
    get scene() {
        return this.globals.scene;
    }
    get children() {
        return this.object.children;
    }
    get components() {
        return this.object.components;
    }
    get states() {
        return this.object.states;
    }
    get tasks() {
        return this.object.tasks;
    }

    get component_name() {
        return this.constructor.component_name;
    }

    listen(event_name) {
        return this.object.listen(event_name);
    }

    broadcast(event_name, payload) {
        return this.object.broadcast(event_name, payload);
    }

    get_component(component_name) {
        return this.object.get_component(component_name);
    }

    find_component_of_type(component_name) {
        return this.object.find_component_of_type(component_name);
    }

    find_component_with_tag(tag) {
        return this.object.find_component_with_tag(tag);
    }


    find_components_of_type(component_name) {
        return this.object.find_components_of_type(component_name);
    }

    setup_components(data) {
        if (Array.isArray(data)) {
            return this.object.setup_components(data)

        }
    }

    load_prefab() {
        return this.object.load_prefab(...arguments)
    }

    add_component(data) {
        if (isObject(data)) {
            return this.object.add_component(data)

        }
    }

    remove_component(data) {
        return this.object.remove_component(data)
    }

    get_components(component_name) {
        return this.object.get_components(component_name);
    }

    lerp(start, end, amt) {
        return (1 - amt) * start + amt * end;
    }
    log() {
        log(this.constructor.name, ...arguments);
    }
    shuffle_array(arr) {
        return arr.sort(() => (Math.random() > .5) ? 1 : -1);
    }
    random_range(min, max) {
        return Math.random() * (max - min) + min;
    }
}

Component.component_name = "Component";

export default Component;
