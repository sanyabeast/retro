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

const proxied_game_object_methods: Array<string> = [
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
    "get_component_with_tag",
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

const proxied_game_object_props: Array<string> = [
    "children",
    "components",
    "refs",
    "states",
    "tasks"
]

export default class Component extends BasicObject implements IRetroComponent {
    static component_name: string = "Component"
    static tick_rate: number = 1
    static prev_tick_time: number = +new Date()
    is_component: boolean = true
    subject: any = null;
    name: string
    tag: string
    _ref: any
    context: any
    constructor(params: object) {
        super(params);
        this.meta.object_type = "component"
    }
    save_prefab(): IGeneratedPrefab {
        let r: IGeneratedPrefab = {
            enabled: this.enabled,
            name: this.name,
            ref: this._ref
        }
        return r
    }
    get_gizmo_render_data(): Array<object> {
        return []
    }
    // override on_update(props: any): void {
    //     super.on_update(props);
    // }
    // override on_create(): void {
    //     super.on_create();
    // }
    // override async on_destroy(): Promise<void> {
    //     super.on_destroy();
    // }
    // override on_tick(td: IRetroObjectTimeData): void {
    //     super.on_tick(td)
    // }
    // override on_start(): void {
    //     super.on_start();
    // }
    // override on_enable(): void {
    //     super.on_enable();
    // }
    // override on_disable(): void {
    //     super.on_disable();
    // }
    get component_name(): string {
        return (this.constructor as any).component_name;
    }
    static tick(instances: Array<Component>): void {
        let now: number = ResourceManager.globals.now
        let delta: number = now - this.prev_tick_time
        let min_delta: number = 1000 / this.tick_rate
        if (delta > min_delta) {
            this.prev_tick_time = now
            this.on_tick(delta / (1000 / 60), instances)
        }
    }
    static on_tick(delta: number, instances: Array<Component>): void { }

    static create: Function

    /**proxying gameobject things */
    /**methods */
    add (...args: any) { return this.game_object.add.apply(this.game_object, args) }
    remove (...args: any) { return this.game_object.remove.apply(this.game_object, args) }
    load_prefab (...args: any) { return this.game_object.load_prefab.apply(this.game_object, args) }
    set_prefab (...args: any) { return this.game_object.set_prefab.apply(this.game_object, args) }
    override async destroy (...args: any) { return await this.game_object.destroy.apply(this.game_object, args) }
    get_components (...args: any) { return this.game_object.get_components.apply(this.game_object, args) }
    traverse_components (...args: any) { return this.game_object.traverse_components.apply(this.game_object, args) }
    traverse_child_components (...args: any) { return this.game_object.traverse_child_components.apply(this.game_object, args) }
    get_component (...args: any) { return this.game_object.get_component.apply(this.game_object, args) }
    get_component_with_tag (...args: any) { return this.game_object.get_component_with_tag.apply(this.game_object, args) }
    find_child_component_of_type (...args: any) { return this.game_object.find_child_component_of_type.apply(this.game_object, args) }
    find_component_of_type (...args: any) { return this.game_object.find_component_of_type.apply(this.game_object, args) }
    find_child_components_of_type (...args: any) { return this.game_object.find_child_components_of_type.apply(this.game_object, args) }
    find_components_of_type (...args: any) { return this.game_object.find_components_of_type.apply(this.game_object, args) }
    find_component_with_tag (...args: any) { return this.game_object.find_component_with_tag.apply(this.game_object, args) }
    setup_components (...args: any) { return this.game_object.setup_components.apply(this.game_object, args) }
    create_child (...args: any) { return this.game_object.create_child.apply(this.game_object, args) }
    remove_child (...args: any) { return this.game_object.remove_child.apply(this.game_object, args) }
    add_component (...args: any) { return this.game_object.add_component.apply(this.game_object, args) }
    remove_component (...args: any) { return this.game_object.remove_component.apply(this.game_object, args) }
    to_local_pos (...args: any) { return this.game_object.to_local_pos.apply(this.game_object, args) }
    to_world_pos (...args: any) { return this.game_object.to_world_pos.apply(this.game_object, args) }

    /**props */
    override get children (): GameObject[] { return this.game_object.children }
    get components () { return this.game_object.components }
    get refs () { return this.game_object.refs }
    get states () { return this.game_object.states }
    get tasks () { return this.game_object.tasks }
}

/**inline components (components that logic is confgured directly in prefab using special syntax (see retro/SCHEMA.yaml -> COMPONENT)) */
Component.create = (params: IGameObjectPrefabInlineComponentDeclaration, name: string) => {
    name = isString(name) ? name : `Component_${makeid(16, false, true, false)}`
    let Comp = Component
    let reactive_props_list: string = ""
    let all_props_code: string = ""
    let all_methods_code: string = ""

    if (isObject(params.props)) {
        reactive_props_list = map(keys(params.props), (name: string) => `"${name}"`).join(", ")
        forEach(params.props, (value: any, prop_name: string) => {
            let prop_code: string =
                `this.${prop_name} = ${JSON.stringify(value)};`
            all_props_code =
                `${all_props_code}
                ${prop_code}`
        })
    }
    if (isObject(params.methods)) {
        forEach(params.methods, (method_data, method_name) => {
            let method_code: string = `
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
