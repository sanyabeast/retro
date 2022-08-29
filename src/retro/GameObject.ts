
import { Vector3, BufferGeometry, Material, ShaderMaterial, RawShaderMaterial } from 'three';
import ResourceManager from 'retro/ResourceManager';
import { Task, TaskScheduler } from "retro/utils/TaskScheduler"
import StateMachine from "retro/utils/StateMachine"
import { isBoolean, isArray, isObject, isString, isFunction, isUndefined, forEach, sortBy, isNumber, get, set, unset } from "lodash-es"
import { log, error, get_most_suitable_dict_keys } from "retro/utils/Tools"
import Schema from "retro/utils/Schema"
import Component from "retro/Component"
import BasicObject from './BasicObject';
import Transform from "retro/Transform"

const $v3: Vector3 = new Vector3()


export default class GameObject extends BasicObject implements IGameObject {
    is_game_object: boolean = true
    position: number[]
    rotation: number[]
    scale: number[]
    visible: boolean = true
    render_order: number = 0
    frustum_culled: boolean = true
    /**private */
    tick_id: number = 0
    NodeConstructor: Function
    transform: Transform
    override _game_object: GameObject
    extra_data: object
    states: StateMachine
    tasks: TaskScheduler

    /** ?? */
    geometry: BufferGeometry | undefined
    material: Material | ShaderMaterial | RawShaderMaterial | undefined

    /**@TODO resolve Retro.GameObject */
    parent?: GameObject
    components: Array<Component>

    constructor(params?: IGameObjectPrefab) {
        super(params)
        let prefab: IGameObjectPrefab = params as IGameObjectPrefab;

        this.meta.ticking.non_stop = true
        this.meta.ticking.enabled = true
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
    override create_game_object(prefab: IGameObjectPrefab): GameObject {
        return new GameObject(prefab)
    }
    override tick(force: boolean = false): void {
        super.tick()
        if (this.enabled || force) {
            this.tasks.on_tick()
            this.children.forEach((child: GameObject) => {
                child.tick()
            })
            this.components.forEach((component: Component) => {
                if (component.enabled) {
                    component.tick()
                }
            })
        }

        this.tick_id++
    }

    override get_reactive_props(): string[] {
        return [
            "position",
            "rotation",
            "scale",
            "visible",
            "render_order",
            "frustum_culled"
        ].concat(super.get_reactive_props())
    }
    override on_update(props: string[]): void {
        super.on_update(props)
        props.forEach(prop => {
            switch (prop) {
                case "position": {
                    this.position[0] = this.position[0] || 0
                    this.position[1] = this.position[1] || 0
                    this.position[2] = this.position[2] || 0
                    this.transform.position.set(this.position[0], this.position[1], this.position[2])
                    break
                }
                case "rotation": {
                    this.rotation[0] = this.rotation[0] || 0
                    this.rotation[1] = this.rotation[1] || 0
                    this.rotation[2] = this.rotation[2] || 0
                    this.transform.rotation.set(this.rotation[0], this.rotation[1], this.rotation[2])
                    break
                }
                case "scale": {
                    this.scale[0] = isNumber(this.scale[0]) ? this.scale[0] : 1
                    this.scale[1] = isNumber(this.scale[1]) ? this.scale[1] : 1
                    this.scale[2] = isNumber(this.scale[2]) ? this.scale[2] : 1
                    this.transform.scale.set(this.scale[0], this.scale[1], this.scale[2])
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
                    this.transform.renderOrder = this.render_order
                    break
                }
            }
        })
    }
    update_transform(): void {
        this.transform.updateMatrixWorld()
    }
    add(child: GameObject): void {
        child.parent = this
        this.children.push(child)
        this.transform.add(child.transform)
    }
    remove(child: GameObject): void {
        let index: number = -1
        for (let a = 0; a < this.children.length; a++) {
            if (this.children[a].UUID === child.UUID) {
                index = a
            }
        }

        if (index >= 0) {
            child.parent = undefined
            this.children.splice(index, 1)
            this.transform.remove(child.transform)
        }
    }
    load_prefab(prefab: IGameObjectPrefab): void {
        if (isObject(prefab) && Schema.validate(prefab, ":PREFAB", "[GAMEOBJECT.LOADPREFAB]")) {
            if (prefab.children) {
                if (Array.isArray(prefab.children)) {
                    prefab.children.forEach((child: any) => {
                        let node: GameObject = new GameObject(child)
                        this.add(node)
                    })
                } else if (isObject(prefab.children)) {
                    forEach(prefab.children, (data: any, key: string) => {
                        let child: any = prefab.children[key]
                        let node: GameObject = new GameObject(child)
                        this.add(node)
                    })
                }
            }
            if (prefab.components) {
                this.setup_components(prefab.components)
            }

            if (isArray(prefab.position)) {
                this.position = [
                    prefab.position[0] ?? 0,
                    prefab.position[1] ?? 0,
                    prefab.position[2] ?? 0,
                ]
            }

            if (isArray(prefab.scale)) {
                this.scale = [
                    prefab.scale[0] ?? 1,
                    prefab.scale[1] ?? 1,
                    prefab.scale[2] ?? 1,
                ]
            }

            if (isArray(prefab.rotation)) {
                this.rotation = [
                    prefab.rotation[0] ?? 0,
                    prefab.rotation[1] ?? 0,
                    prefab.rotation[2] ?? 0,
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
    set_prefab(prefab: IGameObjectPrefab): void {
        console.log(prefab)
    }
    save_prefab(json: boolean = false): string | IGameObjectPrefab {
        let r: IGameObjectPrefab = {
            components: {},
            children: []
        }
        this.components.forEach(component => {
            r.components[component.UUID] = component.save_prefab()
        })
        this.children.forEach((child: GameObject) => {
            r.children.push(child.save_prefab() as IGameObjectPrefab)
        })
        return json ? JSON.stringify(r, null, '\t') : r
    }
    override async destroy(): Promise<void> {
        delete ResourceManager.gameobject_refs[this.UUID]
        if (this.geometry) {
            this.geometry.dispose()
        }
        if (this.material) {
            this.material.dispose()
        }
        if (this.children) {
            await this.children.forEach(async (c: GameObject) => await c.destroy())
        }
        while (this.components.length > 0) {
            this.remove_component(this.components[0])
        }

        await super.destroy();
    }
    get_components(component_name: string): Component[] {
        let r: Component[] = []
        this.components.forEach((component: Component) => {
            if (component.name === component_name) {
                r.push(component)
            }
        })
        return r
    }
    traverse_components(cb: (comp?: Component, go?: GameObject) => boolean, skip_disabled: boolean = true, skip_root: boolean = false): void {
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
    traverse_child_components(cb: (comp?: Component, go?: GameObject) => boolean, skip_disabled: boolean = false): void {
        if (this.children) {
            this.children.forEach((child: GameObject) => {
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
    get_component(component_name: string, cb: (c?: Component) => void, on_not_found?: () => void): Component | boolean {
        let r: Component
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
    get_component_with_tag(tag: string, cb?: (c?: Component) => void, on_not_found?: () => void): Component | boolean {
        let r: Component
        for (let a = 0; a < this.components.length; a++) {
            if (this.components[a].tag === tag) {
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
    find_component_of_type(component_name: string, cb?: (comp: Component) => void, on_not_found?: (comp: Component) => void): Component | boolean {
        let r: Component
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
    find_child_component_of_type(component_name: string, cb?: (c?: Component) => void, on_not_found?: () => void): Component | boolean {
        let r: Component
        this.traverse_components((comp: Component) => {
            if (comp.name === component_name) {
                r = comp
                return false
            } else {
                return true
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
    find_child_components_of_type(component_name: string, cb?: (c: Component) => void, on_not_found?: () => void): Component[] | boolean {
        let r: Component[] = []
        this.traverse_components((comp: Component) => {
            if (comp.name === component_name) {
                r.push(comp)
            }
            return true
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
    find_components_of_type(component_name: string, count: number = Infinity): Component[] {
        let c: number = 0
        let r: Component[] = []
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
    find_component_with_tag(tag: string, cb?: (c?: Component) => void, on_not_found?: () => void): Component | boolean {
        let r: Component = ResourceManager.components_tags[tag]
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
    setup_components(comp_data: IGameObjectPrefabComponentDeclaration[] | { [x: string]: IGameObjectPrefabComponentDeclaration }): void {
        let sorted_comp_list = []
        if (!isUndefined(comp_data)) {
            if (isArray(comp_data)) {
                sorted_comp_list = comp_data
                sorted_comp_list.forEach((data) => { })
            } else {
                comp_data = comp_data as { [x: string]: IGameObjectPrefabComponentDeclaration }
                for (let k in comp_data) {
                    let data: IGameObjectPrefabComponentDeclaration = comp_data[k]
                    data.ref = data.ref || k
                    sorted_comp_list.push(data)
                }
            }
        }

        sorted_comp_list = sortBy(sorted_comp_list, item => item.order || 0)
        sorted_comp_list.forEach(comp_data => this.add_component(comp_data))
    }
    create_child(prefab: any): GameObject {
        let c: GameObject = new GameObject(prefab)
        this.add(c)
        return c
    }
    remove_child(child: GameObject): void {
        child.destroy();
        this.remove(child)
    }
    add_component(data: IGameObjectPrefabComponentDeclaration) {
        let component_name: string = data.name;
        let params: IGameObjectPrefabComponentDeclarationParams = data.params
        let enabled = typeof data.enabled === 'boolean' ? data.enabled : true
        let ref = typeof data.ref === 'string' ? data.ref : undefined
        let creator: { new(params: IGameObjectPrefabComponentDeclarationParams): void }
        creator = ResourceManager.classes_of_components[component_name]
        let component
        if (isFunction(creator)) {
            component = new creator(params)
            component.recreate_reference_properties()
        } else if (isObject(creator)) {
            component = Object.assign({}, creator)
        } else if (isUndefined(creator)) {
            if (isObject(data.inline)) {
                if (Schema.validate(data.inline, ":INLINE_COMPONENT")) {
                    creator = Component.create(data.inline, component_name)
                    component = new creator(params)
                    component.recreate_reference_properties()
                }
            }
        }
        if (component !== undefined) {
            component.context = ResourceManager.load_context(data.context)
            component._game_object = this
            component.init()
            component.name = component_name
            /**meta params */
            if (Schema.validate(data.meta, ":COMPONENT_PARAMS_META")) {
                let meta_params = component.meta = ResourceManager.mixin_object(component.meta, [data.meta])
            }

            component.apply_params()

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
            component.on_ready()
            component.enabled = enabled
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
    remove_component(data: string | Component): void {
        if (isString(data)) {
            let component: Component = this.refs[data]
            if (isObject(component)) {
                component.enabled = false
                component.on_destroy()
                delete this.refs[data]
                for (let a = 0; a < this.components.length; a++) {
                    let c = this.components[a]
                    if (c.UUID === component.UUID) {
                        this.components.splice(a, 1)
                        break
                    }
                }
                let component_name: string = component.name
                delete ResourceManager.components_instances[component_name][component.UUID]
                delete ResourceManager.components_tags[component.tag]
            }
        } else if (isObject(data)) {
            let component: Component = data
            component.enabled = false
            component.on_destroy()
            let ref: string = component._ref
            delete this.refs[ref]
            for (let a = 0; a < this.components.length; a++) {
                let c: Component = this.components[a]
                if (c.UUID === component.UUID) {
                    this.components.splice(a, 1)
                    break
                }
            }
            let component_name: string = component.name
            delete ResourceManager.components_instances[component_name][component.UUID]
            delete ResourceManager.components_tags[component.tag]
        }
    }
    start_game(): void {
        if (this.visible) {
            this.on_start()
            this.components.forEach((component: Component) => {
                component.on_start()
            })
            this.children.forEach((child: GameObject) => {
                child.start_game()
            })
        }
    }
    to_local_pos(pos: number[]): number[] {
        let game_object: GameObject = this.game_object
        $v3.set(pos[0], pos[1], pos[2])
        let r: Vector3 = game_object.transform.worldToLocal($v3)
        return [r.x, r.y, r.z]
    }
    to_world_pos(pos: number[]): number[] {
        let game_object: GameObject = this.game_object
        $v3.set(pos[0], pos[1], pos[2])
        let r: Vector3 = game_object.transform.localToWorld($v3)
        return [r.x, r.y, r.z]
    }
}
