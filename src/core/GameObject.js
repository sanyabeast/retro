
import { update } from 'lodash';
import * as THREE from 'three';
import { Group } from 'three/src/objects/Group';
import AssetManager from 'core/utils/AssetManager';


class GameObject extends Group {
    tick_id = 0
    NodeConstructor = undefined
    constructor(params) {
        super(...arguments)
        this.extra_data = {}
        if (typeof window.F_THREE_PATCH_PROPS === "function") {
            window.F_THREE_PATCH_PROPS(this)
        }
        /**patch */
        if (params !== undefined) {
            if (typeof params.render_layer !== "undefined") {
                this.render_layer = params.render_layer;
            }
            if (typeof params.render_index !== "undefined") {
                this.render_index = params.render_index;
            }
            if (typeof params.components === `object`) {
                this.setup_components(params.components)
            }
            if (typeof params.on_tick === `function`) {
                this.on_tick = params.on_tick
            }
            if (typeof params.position === `object`) {
                if (Array.isArray(params.position)) {
                    this.position.set(params.position[0], params.position[1], params.position[2])
                } else {
                    this.position.set(params.position.x, params.position.y, params.position.z)
                }
            }
            if (typeof params.rotation === `object`) {
                if (Array.isArray(params.position)) {
                    this.rotation.set(params.rotation[0], params.rotation[1], params.rotation[2])
                } else {
                    this.rotation.set(params.rotation.x, params.rotation.y, params.rotation.z)
                }
            }
            if (typeof params.scale === `object`) {
                if (Array.isArray(params.position)) {
                    this.scale.set(params.scale[0], params.scale[1], params.scale[2])
                } else {
                    this.scale.set(params.scale.x, params.scale.y, params.scale.z)
                }
            }
            if (typeof params.visible !== `undefined`) {
                this.visible = params.visible;
            }
            if (typeof params.parent === `object` && params.parent !== null) {
                params.parent.add(this)
            }
            if (Array.isArray(params.topics)) {
                params.topics.forEach(event_name, this.listen(event_name))
            }
            if (params.extra_data) {
                this.extra_data = {
                    ...params.extra_data
                }
            }
        }
    }
    load_prefab(prefab) {
        if (prefab.components) {
            this.setup_components(prefab.components)
        }

        if (prefab.children) {
            if (Array.isArray(prefab.children)) {
                prefab.children.forEach(child => {
                    let node = new GameObject()
                    node.isGroup = true
                    node.load_prefab(child)
                    this.add(node)
                })
            } else if (typeof prefab.children === "object" && prefab.children !== null) {
                for (let k in prefab.children) {
                    let child = prefab.children[k]
                    let node = new GameObject()
                    node.isGroup = true
                    node.load_prefab(child)
                    this.add(node)
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

    }
    get_components(component_name) {
        let r = []
        this.components.forEach((component) => {
            if (component.component_name === component_name) {
                r.push(component)
            }
        })
        return r
    }
    traverse_components(cb) {
        this.components.forEach(comp => cb(comp, this))
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
    get_component(component_name) {
        return this.get_components(component_name)[0]
    }
    find_component_of_type(component_name) {
        let r = null
        if (GameObject.components_base[component_name]) {
            for (let k in GameObject.components_base[component_name]) {
                r = GameObject.components_base[component_name][k]
                break
            }
        }
        return r
    }
    find_component_with_tag(tag) {
        return GameObject.components_tags[tag]
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

    find_components_of_type(component_name, count) {
        let c = 0
        let r = []
        if (GameObject.components_base[component_name]) {
            for (let k in GameObject.components_base[component_name]) {
                if (count === undefined || c < count) {
                    r.push(GameObject.components_base[component_name][k])
                    c++
                    if (c >= count) {
                        break
                    }
                }
            }
        }
        return r
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
        let creator = GameObject.components_lib[component_name]
        let component
        if (typeof creator == "function") {
            component = new creator(params)
        } else if (creator === 'object') {
            component = Object.assign({}, creator)
        }

        if (component !== undefined) {
            component.name = component_name
            reactivate_component(component)
            component.object = this
            component.apply_params()
            component._enabled = enabled
            if (typeof data.tick_skip === 'number') component.tick_skip = data.tick_skip
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
            component.on_created()
            if (component.enabled) component.on_enabled()
            GameObject.components_base[component_name] = GameObject.components_base[component_name] || {}
            GameObject.components_base[component_name][component.id] = component

            if (data.tag) {
                component.tag = data.tag
                GameObject.components_tags[data.tag] = component
            }
            // console.log(`creating component ${component_name}`, params, creator)
        } else {
            console.log(`failed to create component: ${component_name}`, creator)
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
                delete GameObject.components_base[component_name][component.id]
                delete GameObject.components_tags[this.tag]
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
            delete GameObject.components_base[component_name][component.id]
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
                    if (component.tick % (component.tick_skip * window.F_GLOBAL_TICK_SKIP) === 0) {
                        if (component.need_reactive_update) {
                            let updated_props = [...component.updated_props]
                            component.need_reactive_update = false
                            component.updated_props.length = 0
                            component.on_update(updated_props)
                        }
                        component.on_tick(time_data)
                    }
                    component.tick++
                }
            })
            this.tasks.on_tick()
            this.children.forEach((child) => {
                child.tick(time_data)
            })
        }

        this.tick_id++
    }
    on_tick() { }
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
GameObject.components_base = {}
GameObject.components_lib = {}
GameObject.components_tags = {}
GameObject.register_component = function (creator, name) {
    GameObject.components_lib[name] = creator
}
window.F_GLOBAL_TICK_SKIP = 1

export default GameObject