/* created by @sanyabeast 8/14/2021 1:31:45 AM
 *
 *
 */

import { log } from "core/utils/Tools";
import EventDispatcher from "core/utils/EventDispatcher";

let id = 0
const exclude_props = [
    "components"
]

class Component extends EventDispatcher {

    needs_update = false
    object = null;
    subject = null;
    _enabled = true;
    tick_skip = 1;
    tick = 0;
    _params_applied = false;
    globals = undefined
    constructor(params) {
        super(params);
        if (window.F_PATCH_COMP_PROPS) {
            window.F_PATCH_COMP_PROPS(this)
        }
        this.id = id
        id++
        this._params = params;
        if (this.topics) {
            this.topics.forEach(event_name => this.listen(event_name))
        }
        this.tick = Math.floor(Math.random() * this.tick_skip)

    }

    save_prefab(){
        let r = {
            enabled: this.enabled,
            tick_skip: this.tick_skip,
            name: this.name,
            ref: this._ref
        }
        return r
    }

    get_reactive_props() {
        return []
    }

    get_render_data (){
        return undefined
    }

    apply_params() {
        if (!this._params_applied) {
            this._params_applied = true;
            for (let k in this._params) {
                switch (k) {
                    case "on_tick": {
                        this._on_tick = params[k]
                    }
                    case "on_enabled": {
                        this._on_enabled = params[k]
                    }
                    case "on_disabled": {
                        this._on_disabled = params[k]
                    }
                    case "on_created": {
                        this._on_created = params[k]
                    }
                    case "on_destroy": {
                        this._on_created = params[k]
                    }
                    default: {
                        if (exclude_props.indexOf(k) < 0) {
                            this[k] = this._params[k]

                        }
                    }
                }

                // Object.defineProperty(this, k, {
                //     value: this._params[k],
                //     configurable: true,
                //     enumerable: true,
                //     writable: true,
                // });
            }
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
        return this._enabled;
    }
    set enabled(v) {
        if (v !== this._enabled) {
            if (v) {
                this.on_enabled();
            } else {
                this.on_disabled();
            }

            this._enabled = v;
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

    load_prefab(){
        return this.object.load_prefab(...arguments)
    }

    add_component(data) {
        if (typeof data === 'object') {
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
