
import { Vector3, EventDispatcher } from "three"
import { log, error, makeid, datetime, is_none, hex_to_hsl, hsl_to_rgb, hex_to_rgb, request_text_sync, console, get_most_suitable_dict_keys, recreate_reference_properties, spawn_retro_greetings } from "retro/utils/Tools";
import { get, set, isObject, isArray, isNumber, isUndefined, isNull, isBoolean, isFunction, isString, map, keys, values, forEach, method, isNil } from "lodash-es"
import ResourceManager from "retro/ResourceManager"
import Schema from "retro/utils/Schema"
import * as Tools from "retro/utils/Tools"
import GameObject from "./GameObject";

if (!PRESET.NO_GREETING) {
    spawn_retro_greetings()
}

let id: number = 0
const exclude_props: string[] = [
    "components",
    "children"
]

const properties_excluded_from_recreation: string[] = [
    "meta",
    "globals",
    "tools"
]

const $v3: Vector3 = new Vector3()

export default class BasicObject extends EventDispatcher implements IRetroObject {
    tick_rate: number = PRESET.DEFAULT_TICKRATE
    tick_enabled: boolean = true
    debug_log_this: boolean = false
    UUID: string
    meta: IRetroObjectMeta
    tools: IRetroTools
    id: number
    _children: GameObject[]
    get children(): GameObject[] { return this._children }
    set children(value: GameObject[]){this._children = value}
    globals: IGlobalsDict
    _game_object: GameObject
    _on_enable?: Function
    _on_disable?: Function
    _on_create?: Function
    _on_destroy?: Function
    _on_tick?: (td: IRetroObjectTimeData) => void
    _on_start?: Function

    constructor(params: any) {
        super()
        this.meta = {
            persistence_inited: false,
            persistence_autosave: false,
            has_persistent_state: false,
            game_object: undefined,
            object_type: "",
            enabled: true,
            need_reactive_update: true,
            updated_reactive_props: [],
            lifecycle: {
                never_enabled: true
            },
            reactive_values: {},
            reactivated: false,
            layers: {
                rendering: true,
                normal: true,
                raycast: false,
                collision: false,
                gizmo: false,
                lights: false,
                include: [],
                exclude: []
            },
            params_applied: false,
            params: {},
            ticking: {
                non_stop: false,
                prev_time: +new Date(),
                delta: 1,
                ticks: 0,
                rate: PRESET.DEFAULT_TICKRATE,
                enabled: true,
            }
        }
        this.tools = Tools.tools
        this.id = id
        id++
        this.meta.params = params || this.meta.params;
        if (params && params.debug_log_this === true) {
            this.log(this)
        }
        /**common patch */
        if (window.F_PATCH_COMP_PROPS) {
            window.F_PATCH_COMP_PROPS(this)
        }
    }
    get game_object(): GameObject {
        return this._game_object
    }
    set game_object(game_object: BasicObject) {
        this._game_object = this.game_object
    }
    public recreate_reference_properties(this) {
        let descriptors: { [x: string]: TypedPropertyDescriptor<any> } = Object.getOwnPropertyDescriptors(this)
        forEach(descriptors, (descriptor: TypedPropertyDescriptor<any>, key: string) => {
            let value: ReflectedObject = descriptor.value as ReflectedObject
            if (!isNil(value)) {
                if (value.__proto__ === window.Object.prototype || value.__proto__ === window.Array.prototype) {
                    if (properties_excluded_from_recreation.indexOf(key) < 0) {
                        //this.log(`recreating reference prop: "${key}"`, value)
                        this[key] = ResourceManager.mixin_object(value)
                    }
                }
            }
        })
    }
    public create_game_object(prefab: object): GameObject {
        let game_object = this.game_object
        return game_object.create_game_object(prefab)
    }
    /**calls */
    public call_inside(method_name, ...args: any) {
        let game_object: GameObject = this.game_object
        for (let a = 0; a < game_object.components.length; a++) {
            let comp: IRetroComponent = game_object.components[a]
            if (!isFunction(comp[method_name])) continue
            comp[method_name](...args)
        }
        if (isFunction(game_object[method_name])) {
            game_object[method_name](...args)
        }

        if (isArray(game_object.children)) {
            this.children.forEach(child => child.call_inside(method_name, ...args))
        }
    }
    public call_up(method_name: string, ...args: any) {
        let game_object: GameObject = this.game_object
        for (let a = 0; a < game_object.components.length; a++) {
            let comp: IRetroComponent = game_object.components[a]
            if (!isFunction(comp[method_name])) continue
            comp[method_name](...args)
        }

        if (isFunction(game_object[method_name])) {
            game_object[method_name](...args)
        }

        if (game_object.parent !== undefined) {
            game_object.parent.call_up(method_name, ...args);
        }

    }
    public is(object_type: string): boolean {
        return this.meta.object_type === object_type
    }
    public init(): void {
        this.UUID = `${this.constructor.name}_${this.id}`
        this.init_reactivity()
    }
    public get_reactive_props(): string[] {
        return []
    }
    public force_update(props: string[]): void {
        let reactive_props: string[] = props ?? this.get_reactive_props()
        reactive_props.forEach((prop: string) => {
            this[prop] = this[prop]
        })
    }
    public apply_params(): void {
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
                        this.on_destroy = params[k]
                        break
                    }
                    case "enabled": {
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
    public update(params: object): void {
        forEach(params, (k: any, v: string) => {
            this[v] = k
        })
    }
    public tick(force: boolean = false): void {
        if (this.enabled) {
            if (this.meta.need_reactive_update) {
                let updated_props: string[] = [...this.meta.updated_reactive_props]
                this.meta.need_reactive_update = false
                this.meta.updated_reactive_props.length = 0
                this.on_update(updated_props)
            }
            this.meta.ticking.rate = this.tick_rate
            this.meta.ticking.enabled = this.tick_enabled

            if (this.meta.ticking.enabled || force == true) {
                let now: number = this.globals.now
                if (force == true || this.meta.ticking.non_stop === true || now - this.meta.ticking.prev_time > (1000 / this.meta.ticking.rate)) {
                    let d: number = now - this.meta.ticking.prev_time
                    this.meta.ticking.delta = d / (1000)
                    this.meta.ticking.ticks++
                    this.meta.ticking.prev_time = now
                    this.on_tick(this.meta.ticking)
                    ResourceManager.TICK_ID++
                }
            }
        }
    }
    get enabled(): boolean {
        return this.meta.enabled;
    }
    set enabled(v: boolean) {
        if (v !== this.meta.enabled || this.meta.lifecycle.never_enabled === true) {
            this.meta.lifecycle.never_enabled = false
            this.meta.enabled = v;
            if (v) {
                this.on_enable();
            } else {
                this.on_disable();
            }
        }
    }
    public async destroy(): Promise<void> {
        /**removing global variables registerd by this object */
        this.on_disable()
        await this.on_destroy()
        ResourceManager.undefine_all_global_vars(this.UUID)
    }
    /**global vars definition */
    protected define_global_var(name: string, getter: Function, setter?: Function): void {
        ResourceManager.define_global_var(this.UUID, name, getter, setter)
    }
    protected undefine_global_var(name: string): void {
        ResourceManager.undefine_global_var(this.UUID, name)
    }
    /**lifecycle */
    public on_init(): void { }
    public on_update(props: string[]): void {
        props.forEach((prop_name: string) => this.on_change(prop_name, this[prop_name]))
    }
    public on_change(prop_name: string, value: any): void { }
    public on_create(): void {
        if (isFunction(this._on_create)) this._on_create()
    }
    public async on_destroy(): Promise<void> {
        if (isFunction(this._on_destroy)){
            await this._on_destroy()
        }
    }
    public on_tick(td: IRetroObjectTimeData): void {
        if (isFunction(this._on_tick)) this._on_tick(td)
    }
    public on_start(): void {
        if (isFunction(this._on_start)) this._on_start()
    }
    public on_enable(): void {
        if (isFunction(this._on_enable)) this._on_enable()
    }
    public on_disable(): void {
        if (isFunction(this._on_disable)) this._on_disable()
    }

    protected log(...args: any): void {
        log(this.UUID, ...args);
    }
    protected error(...args: any): void {
        error(this.UUID, ...args);
    }
    public static log(...args: any): void {
        log(this.name, ...args);
    }
    public static error(...args: any): void {
        error(this.name, ...args);
    }
    /*events*/
    public on(type, listener): void {
        return this.addEventListener(type, listener)
    }
    public off(type, listener): void {
        return this.removeEventListener(type, listener)
    }
    public has_listener(type, listener): boolean {
        return this.hasEventListener(type, listener)
    }
    public emit(type, payload): void {
        return this.dispatchEvent({ type: type, payload })
    }
    /**unit conversion */
    /**world/local */

    /**persistance */
    public on_ready(): void {
        this.init_persistence()
    }
    protected init_persistence(): void {
        if (!this.meta.persistence_inited) {
            let persistent_props_list: string[] = this.get_persistent_props()
            this.meta.has_persistent_state = isArray(persistent_props_list) && persistent_props_list.length > 0

            if (this.meta.has_persistent_state) {
                this.load_persistent_state()
            } else {
                this.clear_persistent_state()
            }

            this.meta.persistence_inited = true
        }
    }
    public get_persistent_props(): string[] {
        return []
    }
    public save_persistent_state(): void {
        if (this.meta.has_persistent_state && "localStorage" in window) {
            let save_data: { [x: string]: any } = {}
            let persistent_props: string[] = this.get_persistent_props()
            let save_key: string = this.UUID
            forEach(persistent_props, (prop_name: string, index: number) => {
                save_data[prop_name] = get(this, prop_name)
            })
            try {
                window.localStorage.setItem(save_key, JSON.stringify(save_data))
            } catch (err) {
                console.warn(err)
            }
        }
    }
    public load_persistent_state(): void {
        if (this.meta.has_persistent_state && "localStorage" in window) {
            let save_key: string = this.UUID
            let persistent_props: string[] = this.get_persistent_props()
            let save_data_json: string = window.localStorage.getItem(save_key)

            if (isString(save_data_json)) {
                let save_data: object = JSON.parse(save_data_json)
                forEach(save_data, (prop_data: any, prop_name: string) => {
                    if (persistent_props.indexOf(prop_name) > -1) {
                        set(this, prop_name, prop_data)
                    }
                })
            }
        }
    }
    public clear_persistent_state(): void {
        if ("localStorage" in window) {
            let save_key: string = this.UUID
            window.localStorage.removeItem(save_key)
        }
    }

    private init_reactivity(): void {
        if (this.meta.reactivated) {
            return
        }
        let reactive_values: any = this.meta.reactive_values;
        this.meta.updated_reactive_props = this.meta.updated_reactive_props || []
        this.meta.need_reactive_update = true
        let reactive_props: string[] = this.get_reactive_props ? this.get_reactive_props() : []
        reactive_props.forEach((prop: string) => {
            reactive_values[prop] = this[prop]
            Object.defineProperty(this, prop, {
                get: () => {
                    return reactive_values[prop]
                },
                set: (v) => {
                    this.meta.need_reactive_update = true
                    if (this.meta.updated_reactive_props.indexOf(prop) < 0) {
                        this.meta.updated_reactive_props.push(prop)
                    }
                    reactive_values[prop] = v
                }
            })
        })

        this.meta.reactivated = true
    }

    public static add_traversal_method(context_name: string = "component", method_name: string, skip_disabled: boolean = false): void {
        let callback_name: string = `on_${method_name}`
        BasicObject.prototype[callback_name] = function () {
            // this.log(`traversal function ${method_name} is not implemented`)
        }
        BasicObject.prototype[method_name] = function (collected_result: Array<any> = []): Array<any> {
            let game_object: GameObject = this.game_object
            if (game_object) {
                switch (context_name) {
                    case "component": {
                        game_object.components.forEach((comp, index) => {
                            if (skip_disabled == true && comp.enabled === false) {
                                return
                            }
                            let data: any = comp[callback_name]()
                            data !== undefined && collected_result.push(data)
                        })
                        game_object.children.forEach(child => {
                            if (skip_disabled == true && child.visible === false) {
                                return
                            }
                            child[method_name](collected_result)
                        })
                        break
                    }
                    case "game_object": {
                        let data: any = game_object[callback_name]()
                        data !== undefined && collected_result.push(data)
                        game_object.children.forEach((child: GameObject) => {
                            if (skip_disabled == true && child.visible === false) {
                                return
                            }
                            child[method_name](collected_result)
                        })
                        break
                    }
                }
            } else {
                console.log(`fail`)
            }

            return collected_result
        }
    }
}
