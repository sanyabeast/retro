/* created by @sanyabeast 8/14/2021 1:31:45 AM
 *
 *
 */

import { log, makeid, datetime, is_none, hex_to_hsl, hsl_to_rgb, hex_to_rgb, request_text_sync, console, get_most_suitable_dict_keys } from "retro/utils/Tools";
import * as Tools from "retro/utils/Tools";
import BasicObject from "retro/BasicObject";
import { get, set, isObject, isArray, isNumber, isUndefined, isNull, isBoolean, isFunction, isString, map, keys, values, forEach, throttle, debounce } from "lodash-es"
import ResourceManager from "retro/ResourceManager"
import Schema from "retro/utils/Schema"
import GameObject from "./GameObject"

const proxied_game_object_methods = [
    "add",
    "remove",
    "load_prefab",
    "set_prefab",
    "save_prefab",
    "destroy",
    "get_components",
    "traverse_components",
    "traverse_child_components",
    "get_component",
    "find_child_component_of_type",
    "find_component_of_type",
    "find_child_component_of_type",
    "find_child_components_of_type",
    "find_components_of_type",
    "find_component_with_tag",
    "setup_components",
    "create_child",
    "remove_child",
    "add_component",
    "remove_component",
    "to_local_pos",
    "to_world_pos",
]

const proxied_game_object_props = [
    "children",
    "components",
    "refs",
    "states",
    "tasks"
]

class Component extends BasicObject {
    is_component = true
    subject = null;
    static tick_rate = 1
    static prev_tick_time = +new Date()
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
    get_gizmo_render_data() {
        return []
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
    get component_name() {
        return this.constructor.component_name;
    }
    static tick(instances) {
        let now = +new Date()
        let delta = now - this.prev_tick_time
        let min_delta = 1000 / this.tick_rate
        if (delta > min_delta) {
            this.prev_tick_time = now
            this.on_tick(delta / (1000 / 60), instances)
        }
    }
    static on_tick(delta, instances) {
        ///
    }
}


/**inline components (components that logic is confgured directly in prefab using special syntax (see retro/SCHEMA.yaml -> COMPONENT)) */
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

    forEach(params.methods, (method_data, method_name) => {
        if (isNumber(method_data.throttle)) {
            result.prototype[method_name] = throttle(result.prototype[method_name], method_data.throttle)
        } else if (isNumber(method_data.debounce)) {
            result.prototype[method_name] = debounce(result.prototype[method_name], method_data.debounce)
        }
    })


    log("Component", `just created new inline component "${name}"`)
    return result
}
proxied_game_object_methods.forEach(method_name => {
    Component.prototype[method_name] = function () {
        let game_object = this.game_object
        if (game_object) {
            return game_object[method_name](...arguments)
        }
    }
})

proxied_game_object_props.forEach(prop_name => {
    Object.defineProperty(Component.prototype, prop_name, {
        get: function () {
            let game_object = this.game_object
            if (game_object) {
                return game_object[prop_name]
            } else {
                return undefined
            }
        }
    })
})
Component.component_name = "Component";
export default Component;
