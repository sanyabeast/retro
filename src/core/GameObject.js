
import * as THREE from 'three';
import { Group } from 'three/src/objects/Group';
import ResourceManager from 'core/ResourceManager';
import { Task, TaskScheduler } from "core/utils/TaskScheduler"
import StateMachine from "core/utils/StateMachine"
import { isBoolean, isArray, isObject, isString, isFunction, isUndefined, forEach, sortBy } from "lodash-es"
import { log, error, get_most_suitable_dict_keys } from "core/utils/Tools"
import Schema from "core/utils/Schema"
import Component from "core/Component"
import BasicObject from './BasicObject';
import Transform from "core/Transform"

const $v3 = new THREE.Vector3()


class GameObject extends BasicObject {
    is_game_object = true
    position = undefined
    rotation = undefined
    scale = undefined
    visible = -true
    render_order = 0
    frustum_culled = true
    /**private */
    enabled = true
    tick_id = 0
    NodeConstructor = undefined
    transform = undefined
    constructor(prefab) {
        super(...arguments)
        this.meta.ticking.non_stop = true
        this.position = [0, 0, 0]
        this.rotation = [0, 0, 0]
        this.scale = [1, 1, 1]
        this._game_object = this
        this.transform = new Transform()
        this.extra_data = {}
        this.components = []
        this.children = []
        this.states = new StateMachine(prefab && prefab.states ? prefab.states : {}, this)
        this.tasks = new TaskScheduler(prefab && prefab.tasks ? prefab.tasks : [])
        if (typeof window.F_THREE_PATCH_PROPS === "function") {
            window.F_THREE_PATCH_PROPS(this)
        }
        this.init()
        this.apply_params()
        this.load_prefab(prefab)

    }
    get refs() {
        if (ResourceManager.gameobject_refs[this.UUID] === undefined) {
            ResourceManager.gameobject_refs[this.UUID] = {}
        }
        return ResourceManager.gameobject_refs[this.UUID]
    }
    tick(time_data) {
        super.tick(time_data)
        if (this.enabled) {
            this.components.forEach((component) => {
                if (component.enabled) {
                    component.tick(time_data)
                }
            })
            this.tasks.on_tick()
            this.children.forEach((child) => {
                child.tick(time_data)
            })
        }

        this.tick_id++
    }
    get_reactive_props() {
        return [
            "position",
            "rotation",
            "scale",
            "visible",
            "render_order",
            "frustum_culled"
        ].concat(super.get_reactive_props())
    }
    on_update(props) {
        super.on_update(props)
        props.forEach(prop => {
            switch (prop) {
                case "position": {
                    this.transform.position.set(...this.position)
                    break
                }
                case "rotation": {
                    this.transform.rotation.set(...this.rotation)
                    break
                }
                case "scale": {
                    this.transform.scale.set(...this.scale)
                    break
                }
                case "visible": {
                    this.transform.visible = this.visible
                    break
                }
                case "frustum_culled": {
                    this.transform.frustumCulled = this.frustum_culled
                    break
                }
                case "render_order": {
                    this.transform.render_order = this.render_order
                    break
                }
            }
        })
    }
    update_transform() {
        this.transform.updateMatrixWorld()
    }
    add(child) {
        this.children.push(child)
        this.transform.add(child.transform)
    }
    remove(child) {
        let index = -1
        for (let a = 0; a < this.children.length; a++) {
            if (this.children[a].UUID === child.UUID) {
                index = a
            }
        }

        if (index >= 0) {
            this.children.splice(index, 1)
            this.transform.remove(child.transform)
        }
    }
    load_prefab(prefab) {
        if (isObject(prefab) && Schema.validate(prefab, ":PREFAB", "[GAMEOBJECT.LOADPREFAB]")) {
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
            if (prefab.components) {
                this.setup_components(prefab.components)
            }

            if (isArray(prefab.position)) {
                this.position = [
                    prefab.position[0] || 0,
                    prefab.position[1] || 0,
                    prefab.position[2] || 0,
                ]
            }

            if (isArray(prefab.scale)) {
                this.scale = [
                    typeof prefab.scale[0] === "number" ? prefab.scale[0] : 1,
                    typeof prefab.scale[1] === "number" ? prefab.scale[1] : 1,
                    typeof prefab.scale[2] === "number" ? prefab.scale[2] : 1,
                ]
            }

            if (isArray(prefab.rotation)) {
                this.rotation = [
                    prefab.rotation[0] || 0,
                    prefab.rotation[1] || 0,
                    prefab.rotation[2] || 0,
                ]
            }

            if (isBoolean(prefab.visible)) {
                this.visible = prefab.visible
            }

            if (isBoolean(prefab.enabled)) {
                this.enabled = prefab.enabled
            }

            if (isBoolean(prefab.frustum_culled)) {
                this.frustum_culled = prefab.frustum_culled
            }

            if (isBoolean(prefab.render_order)) {
                this.render_order = prefab.render_order
            }
        } else if (isString(prefab)) {
            return this.load_prefab(ResourceManager.load_prefab(prefab))
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
    destroy(params) {
        super.destroy(parent);
        delete ResourceManager.gameobject_refs[this.UUID]
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
            if (component.name === component_name) {
                r.push(component)
            }
        })
        return r
    }
    traverse_components(cb, skip_disabled = true, skip_root = false) {
        if (skip_root === false) {
            for (let a = 0; a < this.components.length; a++) {
                let comp = this.components[a]
                if (skip_disabled && !comp.enabled) continue
                if (cb(comp, this) === false) {
                    break
                }
            }
        }
        this.traverse_child_components(cb, skip_disabled)
    }
    traverse_child_components(cb, skip_disabled) {
        if (this.children) {
            this.children.forEach(child => {
                if (skip_disabled === true && !child.enabled) {
                    return
                }
                if (child instanceof GameObject) {
                    child.traverse_components(cb, skip_disabled)
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
        let r = undefined
        this.traverse_components((comp) => {
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
        let r = []
        this.traverse_components((comp) => {
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
    setup_components(comp_data) {
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
        sorted_comp_list.forEach(comp_data => this.add_component(comp_data))
    }
    create_child(prefab) {
        let c = new GameObject(prefab)
        this.add(c)
        return c
    }
    remove_child(child) {
        child.destroy();
        this.remove(child)
    }
    add_component(data) {
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
            component._game_object = this
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
        if (typeof data === "string") {
            let component = this.refs[data]
            if (component) {
                component.enabled = false
                component.on_destroy(params)
                delete this.refs[data]
                for (let a = 0; a < this.components.length; a++) {
                    let c = this.components[a]
                    if (c.UUID === component.UUID) {
                        this.components.splice(a, 1)
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
            delete this.refs[ref]
            for (let a = 0; a < this.components.length; a++) {
                let c = this.components[a]
                if (c.UUID === component.UUID) {
                    this.components.splice(a, 1)
                    break
                }
            }
            let component_name = component.name
            delete ResourceManager.components_instances[component_name][component.UUID]
            delete ResourceManager.components_tags[component.tag]
        }
    }
    start_game() {
        if (this.visible) {
            this.on_start()
            this.components.forEach((component) => {
                component.on_start()
            })
            this.children.forEach((child) => {
                child.start_game()
            })
        }
    }
    to_local_pos(pos) {
        let game_object = this.game_object
        $v3.set(...pos)
        let r = game_object.transform.worldToLocal($v3)
        return [r.x, r.y, r.z]
    }
    to_world_pos(pos) {
        let game_object = this.game_object
        $v3.set(...pos)
        let r = game_object.transform.localToWorld($v3)
        return [r.x, r.y, r.z]
    }

}




GameObject.broadcasting = {}

export default GameObject