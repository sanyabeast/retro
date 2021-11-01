
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

class BasicObject extends THREE.EventDispatcher {
    constructor(params) {
        super(params)
        this.meta = {
            game_object: undefined,
            object_type: "",
            enabled: true,
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
        if (this.need_reactive_update) {
            let updated_props = [...this.meta.updated_reactive_props]
            this.need_reactive_update = false
            this.meta.updated_reactive_props.length = 0
            this.on_update(updated_props)
        }

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
        console.log(props)
    }
    on_create() {
        if (this._on_create) this._on_create(td)
    }
    on_destroy() {
        super.on_destroy(...arguments);
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
    /** */
    get_components(component_name) {
        let game_object = this.game_object
        let r = []
        game_object.components.forEach((component) => {
            if (component.name === component_name) {
                r.push(component)
            }
        })
        return r
    }
    traverse_components(cb, skip_disabled = true, skip_root = false) {
        let game_object = this.game_object
        if (skip_root === false) {
            for (let a = 0; a < game_object.components.length; a++) {
                let comp = game_object.components[a]
                if (skip_disabled && !comp.enabled) continue
                if (cb(comp, game_object) === false) {
                    break
                }
            }
        }

        game_object.traverse_child_components(cb, skip_disabled)
    }
    traverse_child_components(cb, skip_disabled) {
        let game_object = this.game_object
        if (game_object.children) {
            game_object.children.forEach(child => {
                if (skip_disabled === true && !child.enabled) {
                    return
                }
                if (child instanceof GameObject) {
                    child.traverse_components(cb, skip_disabled)
                } else {
                    console.error(`Non-GameObject child added to`, game_object)
                }
            })
        }
    }
    get_component(component_name, cb, on_not_found) {
        let game_object = this.game_object
        let r = undefined
        for (let a = 0; a < game_object.components.length; a++) {
            if (game_object.components[a].name === component_name) {
                r = game_object.components[a]
                break
            }
        }

        if (isFunction(cb)) {
            if (r !== undefined) {
                cb(r)
            } else {
                if (isFunction(on_not_found)) {
                    on_not_found(r)
                }
            }
            return r !== undefined
        } else {
            return r
        }
    }
    find_component_of_type(component_name, cb, on_not_found) {
        let game_object = this.game_object
        let r = undefined
        if (ResourceManager.components_instances[component_name]) {
            for (let k in ResourceManager.components_instances[component_name]) {
                r = ResourceManager.components_instances[component_name][k]
                break
            }
        }
        if (isFunction(cb)) {
            if (r !== undefined) {
                cb(r)
            } else {
                if (isFunction(on_not_found)) {
                    on_not_found(r)
                }
            }
            return r !== undefined
        } else {
            return r
        }
    }
    find_child_component_of_type(component_name, cb, on_not_found) {
        let game_object = this.game_object
        let r = undefined
        game_object.traverse_components((comp) => {
            if (comp.name === component_name) {
                r = comp
                return false
            }
        }, false, true)

        if (isFunction(cb)) {
            if (r !== undefined) {
                cb(r)
            } else {
                if (isFunction(on_not_found)) {
                    on_not_found(r)
                }
            }
            return r !== undefined
        } else {
            return r
        }
    }
    find_child_components_of_type(component_name, cb, on_not_found) {
        let game_object = this.game_object
        let r = []
        game_object.traverse_components((comp) => {
            if (comp.name === component_name) {
                r.push(comp)
            }
        }, false, true)

        if (isFunction(cb)) {
            if (r.length > 0) {
                r.forEach(v => cb(v))
            } else {
                if (isFunction(on_not_found)) {
                    on_not_found(r)
                }
            }
            return r !== undefined
        } else {
            return r
        }
    }
    find_components_of_type(component_name, count) {
        let game_object = this.game_object
        let c = 0
        let r = []
        if (ResourceManager.components_instances[component_name]) {
            for (let k in ResourceManager.components_instances[component_name]) {
                if (count === undefined || c < count) {
                    r.push(ResourceManager.components_instances[component_name][k])
                    c++
                    if (c >= count) {
                        break
                    }
                }
            }
        }
        return r
    }
    find_component_with_tag(tag, cb, on_not_found) {
        let game_object = this.game_object
        let r = ResourceManager.components_tags[tag]

        if (isFunction(cb)) {
            if (r !== undefined) {
                cb(r)
            } else {
                if (isFunction(on_not_found)) {
                    on_not_found(r)
                }
            }
            return r !== undefined
        } else {
            return r
        }
    }
    broadcast(event_name, payload) {
        let game_object = this.game_object
        if (typeof window.F_BROADCAST_HOOK === "function") {
            window.F_BROADCAST_HOOK(event_name, payload)
        }
        if (GameObject.broadcasting[event_name]) {
            for (let k in GameObject.broadcasting[event_name]) {
                let func_name = `handle_${event_name}`
                if (typeof GameObject.broadcasting[event_name][k] === 'function') {
                    typeof GameObject.broadcasting[event_name][k](payload)
                }
                GameObject.broadcasting[event_name][k].components.forEach((component) => {
                    if (typeof component[func_name] === 'function') {
                        typeof component[func_name](payload)
                    }
                })
            }
        }
    }
    listen(event_name) {
        let game_object = this.game_object
        GameObject.broadcasting[event_name] = GameObject.broadcasting[event_name] || {}
        GameObject.broadcasting[event_name][game_object.UUID] = game_object
    }
    setup_components(comp_data) {
        let game_object = this.game_object
        let sorted_comp_list = []
        if (comp_data !== undefined) {
            if (Array.isArray(comp_data)) {
                sorted_comp_list = comp_data
                sorted_comp_list.forEach((data) => {
                })
            } else {
                for (let k in comp_data) {
                    let data = comp_data[k]
                    data.ref = data.ref || k
                    sorted_comp_list.push(data)
                }
            }
        }

        sorted_comp_list = sortBy(sorted_comp_list, item => item.order || 0)
        sorted_comp_list.forEach(comp_data => game_object.add_component(comp_data))
    }
    create_child(prefab) {
        let game_object = this.game_object
        let c = new GameObject(prefab)
        game_object.add(c)
        return c
    }
    remove_child(child) {
        let game_object = this.game_object
        child.destroy();
        game_object.remove(child)
    }
    add_component(data) {
        let game_object = this.game_object
        let component_name = data.name;
        let params = data.params
        let enabled = typeof data.enabled === 'boolean' ? data.enabled : true
        let ref = typeof data.ref === 'string' ? data.ref : undefined
        let creator = undefined
        let suitable_creators = get_most_suitable_dict_keys(ResourceManager.classes_of_components, component_name)
        if (suitable_creators.length > 1) {
            error('GameObject', `ambiguity when tried to created component with alias "${component_name}". got multiple candidates: ${suitable_creators.join(", ")}`)
        } else if (suitable_creators.length === 1) {
            creator = ResourceManager.classes_of_components[suitable_creators[0]]
        }
        let component
        if (isFunction(creator)) {
            component = new creator(params)
        } else if (isObject(creator)) {
            component = Object.assign({}, creator)
        } else if (isUndefined(creator)) {
            if (isObject(data.inline)) {
                if (Schema.validate(data.inline, ":INLINE_COMPONENT")) {
                    creator = Component.create(data.inline, component_name)
                    component = new creator(params)
                }
            }
        }
        if (component !== undefined) {
            component._game_object = game_object
            component.init()
            component.name = component_name
            /**meta params */
            if (Schema.validate(data.meta, ":COMPONENT_PARAMS_META")) {
                let meta_params = component.meta = ResourceManager.mixin_object(component.meta, [data.meta])
            }

            component.apply_params()

            component._enabled = enabled
            if (ref !== undefined) {
                component._ref = ref
                game_object.refs[ref] = component
            } else {
                ref = component_name
                component._ref = ref
                if (game_object.refs[ref] === undefined) {
                    game_object.refs[ref] = component
                }
            }
            game_object.components.push(component)
            component.on_create()
            if (component.enabled) component.on_enable()
            ResourceManager.components_instances[component_name] = ResourceManager.components_instances[component_name] || {}
            ResourceManager.components_instances[component_name][component.UUID] = component

            if (data.tag) {
                component.tag = data.tag
                ResourceManager.components_tags[data.tag] = component
            }
            // console.log(`creating component ${component_name}`, params, creator)
        } else {
            error(`GameObject`, `failed to create component: ${component_name}`, creator)
        }
        return component
    }
    remove_component(data, params) {
        let game_object = this.game_object
        if (typeof data === "string") {
            let component = game_object.refs[data]
            if (component) {
                component.enabled = false
                component.on_destroy(params)
                delete game_object.refs[data]
                for (let a = 0; a < game_object.components.length; a++) {
                    let c = game_object.components[a]
                    if (c.UUID === component.UUID) {
                        game_object.components.splice(a, 1)
                        break
                    }
                }
                let component_name = component.name
                delete ResourceManager.components_instances[component_name][component.UUID]
                delete ResourceManager.components_tags[component.tag]
            }
        } else if (typeof data === "object") {
            let component = data
            component.enabled = false
            component.on_destroy(params)
            let ref = component._ref
            delete game_object.refs[ref]
            for (let a = 0; a < game_object.components.length; a++) {
                let c = game_object.components[a]
                if (c.UUID === component.UUID) {
                    game_object.components.splice(a, 1)
                    break
                }
            }
            let component_name = component.name
            delete ResourceManager.components_instances[component_name][component.UUID]
            delete ResourceManager.components_tags[component.tag]
        }
    }

}

function reactivate(object) {
    let reactive_values = {}
    object.meta.updated_reactive_props = object.meta.updated_reactive_props || []
    object.need_reactive_update = true
    let reactive_props = object.get_reactive_props ? object.get_reactive_props() : []
    reactive_props.forEach((prop) => {
        reactive_values[prop] = object[prop]
        Object.defineProperty(object, prop, {
            get: () => {
                return reactive_values[prop]
            },
            set: (v) => {
                object.need_reactive_update = true
                if (object.meta.updated_reactive_props.indexOf(prop) < 0) {
                    object.meta.updated_reactive_props.push(prop)
                }
                reactive_values[prop] = v
            }
        })
    })
}

export default BasicObject