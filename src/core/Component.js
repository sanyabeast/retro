/* created by @sanyabeast 8/14/2021 1:31:45 AM
 *
 *
 */

import { log, makeid, datetime, is_none, hex_to_hsl, hsl_to_rgb, hex_to_rgb, request_text_sync, console, get_most_suitable_dict_keys } from "core/utils/Tools";
import * as Tools from "core/utils/Tools";
import BasicObject from "core/BasicObject";
import { get, set, isObject, isArray, isNumber, isUndefined, isNull, isBoolean, isFunction, isString, map, keys, values, forEach } from "lodash-es"
import ResourceManager from "core/ResourceManager"
import Schema from "core/utils/Schema"

let id = 0
const exclude_props = [
    "components",
    "children"
]

class Component extends BasicObject {
    tick_data = undefined
    object = null;
    subject = null;
    tick_rate = 15
    tick_enabled = true
    debug_log_this = false
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
                rate: 15,
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
        if (params && params.debug_log_this === true) {
            this.log(this)
        }

    }
    tick(tick_data) {
        this.meta.ticking.rate = this.tick_rate
        this.meta.ticking.enabled = this.tick_enabled

        if (this.meta.ticking.enabled) {
            let now = +new Date()
            if (now - this.meta.ticking.prev_time >= (1000 / this.meta.ticking.rate)) {
                let d = now - this.meta.ticking.prev_time
                let delta = this.meta.ticking.delta = d / (1000)
                this.meta.ticking.ticks++
                this.meta.ticking.now = now
                this.meta.ticking.prev_time = now
                this.on_tick(this.meta.ticking)
            }
        }
    }
    get UUID() {
        if (!this.meta.UUID) {
            this.meta.UUID = `COMP_${this.component_name}_${this.id}`
        }
        return this.meta.UUID
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
                    case "on_start": {
                        this._on_start = params[k]
                        break
                    }
                    case "on_enable": {
                        this._on_enable = params[k]
                        break
                    }
                    case "on_disable": {
                        this._on_disable = params[k]
                        break
                    }
                    case "on_create": {
                        this._on_create = params[k]
                        break
                    }
                    case "on_destroy": {
                        this._on_create = params[k]
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
    on_create() {
        if (this._on_create) this._on_create(td)
    }
    on_destroy() {
        if (this._on_destroy) this._on_destroy(td)
        ResourceManager.undefine_all_global_vars(this.UUID)
    }
    on_tick(td) {
        if (this._on_tick) this._on_tick(td)
    }
    on_start(td) {
        if (this._on_start) this._on_start(td)
    }
    on_enable() {
        if (this._on_enable) this._on_enable(td)
    }
    on_disable() {
        if (this._on_disable) this._on_disable(td)
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
                this.on_enable();
            } else {
                this.on_disable();
            }

            this.meta.enabled = v;
        }
    }
    get refs() {
        return this.object.refs;
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
    create_child() {
        return this.object.create_child(...arguments)
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
    /**global vars definition */
    define_global_var(name, getter, setter) {
        ResourceManager.define_global_var(this.UUID, name, getter, setter)
    }
    undefine_global_var(name) {
        ResourceManager.undefine_global_var(this.UUID, name)
    }
}


/**inline components (components that logic is confgured directly in prefab using special syntax (see core/SCHEMA.yaml -> COMPONENT)) */
Component.create = (params, name) => {
    name = isString(name) ? name : `Component_${makeid(16, false, true, false)}`
    let Comp = Component
    let reactive_props_list = ""
    let all_props_code = ""
    let all_methods_code = ""
    let { datetime, hsl_to_rgb, hex_to_rgb, hex_to_hsl, request_text_sync, is_none } = Tools
    let is_string = isString
    let is_object = isObject
    let is_function = isFunction
    let is_boolean = isBoolean
    let is_number = isNumber
    let is_array = isArray
    let is_undefined = isUndefined
    let schema = Schema

    if (isObject(params.props)) {
        reactive_props_list = map(keys(params.props), name => `"${name}"`).join(", ")
        forEach(params.props, (value, prop_name) => {
            let prop_code =
                `this.${prop_name} = ${JSON.stringify(value)};`
            all_props_code =
                `${all_props_code}
                ${prop_code}`
        })
    }
    if (isObject(params.methods)) {
        forEach(params.methods, (method_data, method_name) => {
            let method_code = `
            ${method_name}(${isArray(method_data.args) ? method_data.args.join(", ") : ""}){
                ${isString(method_data.body) ? method_data.body : ""}
            }
            `
            all_methods_code = `
            ${all_methods_code}
            ${method_code}
            `
        })
    }
    let code = `
        class ${name} extends Comp {
            constructor(params){
                super(params);
                this.is_inline = true;
                ${all_props_code}
                ${isString(params.construct) ? params.construct : ""}
            }
            get_reactive_props(){
                return [
                    ${reactive_props_list}
                ].concat(super.get_reactive_props())
            }
            ${all_methods_code}
        }

        ${name};
    `
    let result = eval(code)
    log("Component", `just created new inline component "${name}"`)
    return result
}


Component.component_name = "Component";

export default Component;
