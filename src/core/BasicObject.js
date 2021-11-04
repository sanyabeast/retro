
import * as THREE from "three"
import { log, error, makeid, datetime, is_none, hex_to_hsl, hsl_to_rgb, hex_to_rgb, request_text_sync, console, get_most_suitable_dict_keys } from "core/utils/Tools";
import { get, set, isObject, isArray, isNumber, isUndefined, isNull, isBoolean, isFunction, isString, map, keys, values, forEach } from "lodash-es"
import ResourceManager from "core/ResourceManager"
import Schema from "core/utils/Schema"

let id = 0
const exclude_props = [
    "components",
    "children"
]

const $v3 = new THREE.Vector3()

class BasicObject extends THREE.EventDispatcher {
    tick_rate = 30
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
                rate: 15,
                enabled: true
            }
        }
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
    /**math */
    round(x, n) {
        if (x % 5 == 0) {
            return Math.floor(x / n) * n;
        } else {
            return Math.floor(x / n) * n + n;
        }
    }
    wait(d) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, d);
        });
    }
    lerp(start, end, amt) {
        if (isNumber(start) && isNumber(end)) {
            return (1 - amt) * start + amt * end;
        } else if (isArray(start) && isArray(end)) {
            let r = []
            start.forEach((v, i) => {
                r[i] = this.lerp(start[i], end[i], amt)
            })
            return r
        } else {
            this.log(`cannot lerp: unknown type "${typeof start}"`, start, end)
        }
    }
    clamp(v, min, max) {
        v = Math.max(min, v)
        v = Math.min(max, v)
        return v
    }
    log() {
        log(this.constructor.name, ...arguments);
    }
    error() {
        error(this.constructor.name, ...arguments);
    }
    shuffle_array(arr) {
        return arr.sort(() => (Math.random() > .5) ? 1 : -1);
    }
    random_range(min, max) {
        return Math.random() * (max - min) + min;
    }
    random_choice(arr) {
        return arr[Math.floor(Math.random() * arr.length)]
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