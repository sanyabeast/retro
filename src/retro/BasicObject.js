
import { Vector3, EventDispatcher } from "three"
import { log, error, makeid, datetime, is_none, hex_to_hsl, hsl_to_rgb, hex_to_rgb, request_text_sync, console, get_most_suitable_dict_keys } from "retro/utils/Tools";
import { get, set, isObject, isArray, isNumber, isUndefined, isNull, isBoolean, isFunction, isString, map, keys, values, forEach, method } from "lodash-es"
import ResourceManager from "retro/ResourceManager"
import Schema from "retro/utils/Schema"
import * as Tools from "retro/utils/Tools"

if (PRESET.NO_GREETING !== true) {
    console.log(
        `         
%c_____ _____ _____ _____ _____              
%c| __  |   __|_   _| __  |     |            
%c|    -|   __| | | |    -|  |  |            
%c|__|__|_____| |_| |__|__|_____| %cv. ${PACKAGE_DATA.version}
%c- - - - - - - - - - - - - - - - - - - - - - - 
%chttps://github.com/sanyabeast/retro
`,
        'color:#f44336; background: #222',
        'color:#607d8b; background: #222',
        'color:#ffc107; background: #222',
        'color:#03a9f4; background: #222',
        'color:#8bc34a; background: #222',
        'color:#444; background: #222;',
        'color:#9c27b0; background: #222'

    );
}

let id = 0
const exclude_props = [
    "components",
    "children"
]

const properties_excluded_from_recreation = [
    "meta",
    "globals",
    "tools"
]

const $v3 = new Vector3()

class BasicObject extends EventDispatcher {
    tick_rate = PRESET.DEFAULT_TICKRATE
    tick_enabled = true
    debug_log_this = false
    UUID = undefined
    constructor(params) {
        super(params)
        this.meta = {
            game_object: undefined,
            object_type: "",
            enabled: true,
            lifecycle: {
                never_enabled: true
            },
            reactivated: false,
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
                non_stop: false,
                prev_time: +new Date(),
                delta: 1,
                ticks: 0,
                rate: PRESET.DEFAULT_TICKRATE,
                enabled: true
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
    get game_object() {
        return this._game_object
    }
    recreate_reference_properties() {
        let descriptors = Object.getOwnPropertyDescriptors(this)
        forEach(descriptors, (descriptor, key) => {
            let value = descriptor.value
            if (isObject(value) && value !== null) {
                if (value.__proto__ === window.Object.prototype || value.__proto__ === window.Array.prototype) {
                    if (properties_excluded_from_recreation.indexOf(key) < 0) {
                        //this.log(`recreating reference prop: "${key}"`, value)
                        this[key] = ResourceManager.mixin_object(value)
                    }
                }
            }
        })
    }
    create_game_object() {
        let game_object = this.game_object
        return game_object.create_game_object(...arguments)
    }
    /**calls */
    call_down(method_name, ...args) {

        let game_object = this.game_object
        for (let a = 0; a < game_object.components.length; a++) {
            let comp = game_object.components[a]
            if (!isFunction(comp[method_name])) continue
            comp[method_name](...args)
        }

        if (isFunction(game_object[method_name])) {
            game_object[method_name](...args)
        }

        if (isArray(game_object.children)) {
            this.children.forEach(child => child.call_down(method_name, ...args))
        }
    }
    call_up(method_name, ...args) {
        let game_object = this.game_object
        for (let a = 0; a < game_object.components.length; a++) {
            let comp = game_object.components[a]
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
    is(object_type) {
        return this.meta.object_type === object_type
    }
    init() {
        this.UUID = `${this.constructor.name}_${this.id}`
        reactivate(this)
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
    tick(tick_data) {
        if (this.enabled) {
            if (this.meta.need_reactive_update) {
                let updated_props = [...this.meta.updated_reactive_props]
                this.meta.need_reactive_update = false
                this.meta.updated_reactive_props.length = 0
                this.on_update(updated_props)
            }
            this.meta.ticking.rate = this.tick_rate
            this.meta.ticking.enabled = this.tick_enabled
            if (this.meta.ticking.enabled) {
                let now = +new Date()
                if (this.meta.ticking.non_stop === true || now - this.meta.ticking.prev_time >= (1000 / this.meta.ticking.rate)) {
                    let d = now - this.meta.ticking.prev_time
                    let delta = this.meta.ticking.delta = d / (1000)
                    this.meta.ticking.ticks++
                    this.meta.ticking.now = now
                    this.meta.ticking.prev_time = now
                    this.on_tick(this.meta.ticking)
                }
            }
        }
    }
    get enabled() {
        return this.meta.enabled;
    }
    set enabled(v) {
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
    destroy() {
        /**removing global variables registerd by this object */
        ResourceManager.undefine_all_global_vars(this.UUID)
    }
    /**global vars definition */
    define_global_var(name, getter, setter) {
        ResourceManager.define_global_var(this.UUID, name, getter, setter)
    }
    undefine_global_var(name) {
        ResourceManager.undefine_global_var(this.UUID, name)
    }
    /**lifecycle */
    on_init() {

    }
    on_update(props) {

    }
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
    on_start() {
        if (this._on_start) this._on_start()
    }
    on_enable() {
        if (this._on_enable) this._on_enable()
    }
    on_disable() {
        if (this._on_disable) this._on_disable()
    }

    log() {
        log(this.UUID, ...arguments);
    }
    error() {
        error(this.UUID, ...arguments);
    }
    /*events*/
    on() {
        return this.addEventListener(...arguments)
    }
    off() {
        return this.removeEventListener(...arguments)
    }
    has_listener() {
        return this.hasEventListener(...arguments)
    }
    emit(type, payload) {
        return this.dispatchEvent({ type: type, payload })
    }
    /**unit conversion */
    /**world/local */
}

BasicObject.add_traversal_method = function (context_name = "component", method_name, skip_disabled = false) {
    let callback_name = `on_${method_name}`
    BasicObject.prototype[callback_name] = function () {
        // this.log(`traversal function ${method_name} is not implemented`)
    }
    BasicObject.prototype[method_name] = function (collected = []) {
        let game_object = this.game_object
        if (game_object) {
            switch (context_name) {
                case "component": {
                    game_object.components.forEach((comp, index) => {
                        if (skip_disabled == true && comp.enabled === false) {
                            return
                        }
                        let data = comp[callback_name]()
                        data !== undefined && collected.push(data)
                    })
                    game_object.children.forEach(child => {
                        if (skip_disabled == true && child.visible === false) {
                            return
                        }
                        child[method_name](collected)
                    })
                    break
                }
                case "game_object": {
                    let data = game_object[callback_name]()
                    data !== undefined && collected.push(data)
                    game_object.children.forEach(child => {
                        if (skip_disabled == true && child.visible === false) {
                            return
                        }
                        child[method_name](collected)
                    })
                    break
                }
            }
        } else {
            console.log(`fail`)
        }

        return collected
    }
}

if (process.env.NODE_ENV === "development") {
    window.BasicObject = BasicObject
}

function reactivate(object) {
    if (object.meta.reactivated) {
        return
    }
    let reactive_values = object.meta.reactive_values = {}
    object.meta.updated_reactive_props = object.meta.updated_reactive_props || []
    object.meta.need_reactive_update = true
    let reactive_props = object.get_reactive_props ? object.get_reactive_props() : []
    reactive_props.forEach((prop) => {
        reactive_values[prop] = object[prop]
        Object.defineProperty(object, prop, {
            get: () => {
                return reactive_values[prop]
            },
            set: (v) => {
                object.meta.need_reactive_update = true
                if (object.meta.updated_reactive_props.indexOf(prop) < 0) {
                    object.meta.updated_reactive_props.push(prop)
                }
                reactive_values[prop] = v
            }
        })
    })

    object.meta.reactivated = true
}

export default BasicObject