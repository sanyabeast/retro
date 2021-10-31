
import * as THREE from 'three';
import { Group } from 'three/src/objects/Group';
import AssetManager from 'core/utils/AssetManager';
import { Task, TaskScheduler } from "core/utils/TaskScheduler"
import StateMachine from "core/utils/StateMachine"
import { isObject, isString, isFunction, isUndefined, forEach } from "lodash-es"
import { error, get_most_suitable_dict_keys } from "core/utils/Tools"
import Schema from "core/utils/Schema"
import Component from "core/Component"


class GameObject extends Group {
    tick_id = 0
    NodeConstructor = undefined
    constructor(prefab) {
        super(...arguments)
        this.extra_data = {}
        this.components = []
        this.states = new StateMachine(prefab && prefab.states ? prefab.states : {}, this)
        this.tasks = new TaskScheduler(prefab && prefab.tasks ? prefab.tasks : [])

        if (typeof window.F_THREE_PATCH_PROPS === "function") {
            window.F_THREE_PATCH_PROPS(this)
        }

        this.load_prefab(prefab)

    }
    get refs() {
        if (AssetManager.gameobject_refs[this.uuid] === undefined) {
            AssetManager.gameobject_refs[this.uuid] = {}
        }
        return AssetManager.gameobject_refs[this.uuid]
    }
    load_prefab(prefab) {
        if (isObject(prefab) && Schema.validate(prefab, ":PREFAB", "[GAMEOBJECT.LOADPREFAB]")) {
            if (prefab.components) {
                this.setup_components(prefab.components)
            }
            if (prefab.children) {
                if (Array.isArray(prefab.children)) {
                    prefab.children.forEach(child => {
                        let node = new GameObject(child)
                        this.add(node)
                    })
                } else if (typeof prefab.children === "object" && prefab.children !== null) {
                    for (let k in prefab.children) {
                        let child = prefab.children[k]
                        let node = new GameObject(child)
                        this.add(node)
                    }
                }

            }
            if (typeof prefab.on_tick === `function`) {
                this.on_tick = prefab.on_tick
            }
            if (typeof prefab.position === `object`) {
                if (Array.isArray(prefab.position)) {
                    this.position.set(prefab.position[0], prefab.position[1], prefab.position[2])
                } else {
                    this.position.set(prefab.position.x, prefab.position.y, prefab.position.z)
                }
            }
            if (typeof prefab.rotation === `object`) {
                if (Array.isArray(prefab.position)) {
                    this.rotation.set(prefab.rotation[0], prefab.rotation[1], prefab.rotation[2])
                } else {
                    this.rotation.set(prefab.rotation.x, prefab.rotation.y, prefab.rotation.z)
                }
            }
            if (typeof prefab.scale === `object`) {
                if (Array.isArray(prefab.position)) {
                    this.scale.set(prefab.scale[0], prefab.scale[1], prefab.scale[2])
                } else {
                    this.scale.set(prefab.scale.x, prefab.scale.y, prefab.scale.z)
                }
            }
            if (typeof prefab.visible !== `undefined`) {
                this.visible = prefab.visible;
            }
            if (typeof prefab.parent === `object` && prefab.parent !== null) {
                prefab.parent.add(this)
            }
            if (Array.isArray(prefab.topics)) {
                prefab.topics.forEach(event_name, this.listen(event_name))
            }
            if (prefab.extra_data) {
                this.extra_data = {
                    ...prefab.extra_data
                }
            }
        }

    }
    set_prefab(prefab) {
        console.log(set_prefab)
    }
    save_prefab(json = false) {
        let r = {
            components: [],
            children: []
        }

        this.components.forEach(component => {
            r.components.push(
                component.save_prefab()
            )
        })

        this.children.forEach(child => {
            r.children.push(child.save_prefab())
        })

        return json ? JSON.stringify(r, null, '\t') : r

    }
    get_render_order() {
        let ro = (this.render_layer.valueOf() || 0) * 1000000 + (this.render_index.valueOf() || 0) * 1
        return ro
    }
    /**patch state machine */
    enter_state(name, prev_state, data) { }
    leave_state(name, new_state) { }
    update_state(name) { }
    destroy(params) {
        delete AssetManager.gameobject_refs[this.uuid]
        if (this.geometry) {
            this.geometry.dispose()
        }
        if (this.material) {
            this.material.dispose()
        }
        if (this.children) {
            this.children.forEach((c => c.destroy(params)))
        }
        while (this.components.length > 0) {
            this.remove_component(this.components[0], params)
        }

        /**removing global variables registerd by this object */
        if (isObject(AssetManager.defined_globals[this.uuid])) {
            forEach(AssetManager.defined_globals[this.uuid], (v, key) => {
                this.undefine_global_var(key)
            })
        }

        delete AssetManager.defined_globals[this.uuid]

    }
    get_components(component_name) {
        let r = []
        this.components.forEach((component) => {
            if (component.name === component_name) {
                r.push(component)
            }
        })
        return r
    }
    traverse_components(cb) {
        for (let a = 0; a < this.components.length; a++) {
            let comp = this.components[a]
            if (cb(comp, this) === false) {
                break
            }
        }

        this.traverse_child_components(cb)
    }
    traverse_child_components(cb) {
        if (this.children) {
            this.children.forEach(child => {
                if (child instanceof GameObject) {
                    child.traverse_components(cb)
                } else {
                    console.error(`Non-GameObject child added to`, this)
                }
            })
        }
    }
    get_component(component_name, cb, on_not_found) {
        let r = undefined
        for (let a = 0; a < this.components.length; a++) {
            if (this.components[a].name === component_name) {
                r = this.components[a]
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
        let r = undefined
    }
    find_component_of_type(component_name, cb, on_not_found) {
        let r = undefined
        if (AssetManager.components_base[component_name]) {
            for (let k in AssetManager.components_base[component_name]) {
                r = AssetManager.components_base[component_name][k]
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
    find_components_of_type(component_name, count) {
        let c = 0
        let r = []
        if (AssetManager.components_base[component_name]) {
            for (let k in AssetManager.components_base[component_name]) {
                if (count === undefined || c < count) {
                    r.push(AssetManager.components_base[component_name][k])
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
        let r = AssetManager.components_tags[tag]

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
        GameObject.broadcasting[event_name] = GameObject.broadcasting[event_name] || {}
        GameObject.broadcasting[event_name][this.uuid] = this
    }
    setup_components(comp_data) {
        if (comp_data !== undefined) {
            if (Array.isArray(comp_data)) {
                comp_data.forEach((data) => {

                    this.add_component(data)
                })
            } else {
                for (let k in comp_data) {
                    let data = comp_data[k]
                    data.ref = data.ref || k
                    this.add_component(data)
                }

            }
        }
    }
    add_component(data) {
        let component_name = data.name;
        let params = data.params
        let enabled = typeof data.enabled === 'boolean' ? data.enabled : true
        let ref = typeof data.ref === 'string' ? data.ref : undefined
        let creator = undefined

        let suitable_creators = get_most_suitable_dict_keys(AssetManager.components_lib, component_name)
        if (suitable_creators.length > 1) {
            error('GameObject', `ambiguity when tried to created component with alias "${component_name}". got multiple candidates: ${suitable_creators.join(", ")}`)
        } else if (suitable_creators.length === 1) {
            creator = AssetManager.components_lib[suitable_creators[0]]
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
            component.name = component_name
            reactivate_component(component)
            component.object = this
            /**meta params */
            if (Schema.validate(data.meta, ":COMPONENT_PARAMS_META")) {
                let meta_params = component.meta = AssetManager.mixin_object(component.meta, [data.meta])

            }


            component.apply_params()
            component._enabled = enabled
            if (ref !== undefined) {
                component._ref = ref
                this.refs[ref] = component
            } else {
                ref = component_name
                component._ref = ref
                if (this.refs[ref] === undefined) {
                    this.refs[ref] = component
                }
            }
            this.components.push(component)
            component.on_create()
            if (component.enabled) component.on_enable()
            AssetManager.components_base[component_name] = AssetManager.components_base[component_name] || {}
            AssetManager.components_base[component_name][component.id] = component

            if (data.tag) {
                component.tag = data.tag
                AssetManager.components_tags[data.tag] = component
            }
            // console.log(`creating component ${component_name}`, params, creator)
        } else {
            error(`GameObject`, `failed to create component: ${component_name}`, creator)
        }
        return component
    }
    remove_component(data, params) {
        if (typeof data === "string") {
            let component = this.refs[data]
            if (component) {
                component.enabled = false
                component.on_destroy(params)
                delete this.refs[data]
                for (let a = 0; a < this.components.length; a++) {
                    let c = this.components[a]
                    if (c.id === component.id) {
                        this.components.splice(a, 1)
                        break
                    }
                }
                let component_name = component.name
                delete AssetManager.components_base[component_name][component.id]
                delete AssetManager.components_tags[this.tag]
            }
        } else if (typeof data === "object") {
            let component = data
            component.enabled = false
            component.on_destroy(params)
            let ref = component._ref
            delete this.refs[ref]
            for (let a = 0; a < this.components.length; a++) {
                let c = this.components[a]
                if (c.id === component.id) {
                    this.components.splice(a, 1)
                    break
                }
            }
            let component_name = component.name
            delete AssetManager.components_base[component_name][component.id]
        }
    }
    update(data) {
        for (let k in data) {
            this[k] = data[k]
        }
        this.on_update()
    }
    on_update() { }
    tick(time_data) {
        if (this.visible) {
            this.on_tick()
            this.components.forEach((component) => {
                if (component.enabled) {
                    component.tick(time_data)
                    if (component.need_reactive_update) {
                        let updated_props = [...component.updated_props]
                        component.need_reactive_update = false
                        component.updated_props.length = 0
                        component.on_update(updated_props)
                    }
                }
            })
            this.tasks.on_tick()
            this.children.forEach((child) => {
                child.tick(time_data)
            })
        }

        this.tick_id++
    }
    handle_game_start() {
        if (this.visible) {
            this.on_start()
            this.components.forEach((component) => {
                component.on_start()
            })
            this.children.forEach((child) => {
                child.handle_game_start()
            })
        }
    }
    on_start() { }
    on_tick() { }
    /**globals vars definition */
    define_global_var(name, getter, setter) {
        if (!isFunction(getter) || !isString(name)) {
            this.error("failed registering global variable: invalid params", name, getter)
        }

        AssetManager.defined_globals[this.uuid] = AssetManager.defined_globals[this.uuid] || {}
        AssetManager.defined_globals[this.uuid][name] = {
            getter,
            setter
        }

        Object.defineProperty(this.globals, name, {
            get: getter,
            set: isFunction(setter) ? setter : undefined,
            configurable: true
        })
    }
    undefine_global_var(name) {
        Object.defineProperty(this.globals, name, {
            get: undefined,
            set: undefined,
            configurable: true
        })
        delete this.globals[name]
    }
    /**logging */
    log() {
        log(this.constructor.name, ...arguments);
    }
    error() {
        error(this.constructor.name, ...arguments);
    }
}


function reactivate_component(object) {
    let reactive_values = {}
    object.updated_props = object.updated_props || []
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
                if (object.updated_props.indexOf(prop) < 0) {
                    object.updated_props.push(prop)
                }
                reactive_values[prop] = v
            }
        })
    })
}

GameObject.broadcasting = {}


window.F_GLOBAL_TICK_SKIP = 1

export default GameObject