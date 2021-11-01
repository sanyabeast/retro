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


class Component extends BasicObject {
    object = null;
    subject = null;
    tick_rate = 30
    tick_enabled = true
    debug_log_this = false
    UUID = undefined
    constructor(params) {
        super(params);
        this.meta.object_type = "component"
    }
    save_prefab() {
        let r = {
            enabled: this.enabled,
            name: this.name,
            ref: this._ref
        }
        return r
    }
    on_update() {
        super.on_update(...arguments);
    }
    on_create() {
        super.on_create(...arguments);
    }
    on_destroy() {
        super.on_destroy(...arguments);
    }
    on_tick(td) {
        super.on_tick()
    }
    on_start(td) {
        super.on_start(...arguments);
    }
    on_enable() {
        super.on_enable(...arguments);
    }
    on_disable() {
        super.on_disable(...arguments);
    }
    get parent() {
        let r = null;
        if (this.object && this.object.parent) {
            r = this.object.parent;
        }
        return r;
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
    find_child_component_of_type(component_name) {
        return this.object.find_child_component_of_type(component_name);
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
    remove_child() {
        return this.object.remove_child(...arguments)
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
