
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import Component from "core/Component";
import ResourceManager from "core/ResourceManager";
import * as THREE from 'three';
import Vue from "vue"
import Vuex from "vuex"
import { mapState, mapGetters } from "vuex"
import { keys, set, isFunction, isObject, isArray, isNumber, isNull, isString } from "lodash-es"
import { log, error } from "core/utils/Tools"
Vue.use(Vuex)

let MyPlugin = {}

MyPlugin.install = function (Vue, options) {
    let BasicComp = {
        name: "BasicComponent",
        data() {
            return {
            }
        },
        props: {},
        watch: {},
        beforeMount() {
            let p = this
            while (p.$parent !== undefined) {
                p = p.$parent
            }
            let gui_component = p.gui_component

            Object.defineProperty(this, "gui_component", {
                get: () => gui_component
            })
            Object.defineProperty(this, "object", {
                get: () => gui_component.object
            })
            Object.defineProperty(this, "globals", {
                get: () => gui_component.globals
            })
            Object.defineProperty(this, "app", {
                get: () => gui_component.globals.app
            })
            Object.defineProperty(this, "launcher", {
                get: () => gui_component.globals.launcher
            })
            Object.defineProperty(this, "camera", {
                get: () => gui_component.globals.camera
            })
        },
        mounted() {
            if (this.$el && this.$el.style) {
                this.$el.style.zIndex = "2"
            }
        },
        methods: {
            format_money(v) {
                if (!isNumber(v)) {
                    return '$ 0'
                }
                return `$ ${v.toFixed(2)}`
            },
            format_round_value(v) {
                return `x${v.toFixed(2)}`
            },
            format_ms_to_s(v) {
                return `${(v / 1000).toFixed(2)}s`
            },
            clamp(a, min, max) {
                return Math.min(Math.max(a, min), max)
            },
            lerp(value1, value2, amount) {
                amount = amount < 0 ? 0 : amount;
                amount = amount > 1 ? 1 : amount;
                return value1 + (value2 - value1) * amount;
            },
            tick(d) {
                this.$children.forEach(c => c.tick(d))
                this.on_tick(d)
            },
            on_tick(d) {
            },
            /**CORE COMP COMPAT */
            listen(event_name) {
                return this.object.listen(event_name);
            },
            broadcast(event_name, payload) {
                return this.object.broadcast(event_name, payload);
            },
            get_component(component_name) {
                return this.object.get_component(component_name);
            },
            find_component_of_type(component_name) {
                return this.object.find_component_of_type(component_name);
            },
            find_components_of_type(component_name) {
                return this.object.find_components_of_type(component_name);
            },
            setup_components(data) {
                if (Array.isArray(data)) {
                    return this.object.setup_components(data)

                }
            },
            add_component(data) {
                if (typeof data === 'object') {
                    return this.object.add_component(data)

                }
            },
            remove_component(data) {
                return this.object.remove_component(data)
            },
            get_components(component_name) {
                return this.object.get_components(component_name);
            }

        }
    }

    Vue.mixin(BasicComp)
}
Vue.use(MyPlugin)

class VueGUIComponent extends Component {
    root_component = undefined
    store = undefined
    module_name = "gui"
    vuex_store = undefined
    tick_rate = 5
    props = undefined
    constructor() {
        super(...arguments)
        this.props = {}
    }
    get el() {
        return this.ui.$el
    }
    get ui() {
        return this.ui_wrapper.$children[0]

    }
    get state(){
        return this.vuex_store.state
    }
    get getters(){
        return this.vuex_store.state
    }
    on_create() {
        this.log("creating...", this.store, this.root_component.name)
        this.dom = document.createElement("div")
        this.dom.style.width = "100%";
        this.dom.style.height = "100%";
        this.dom.style.overflow = "hidden";
        this.dom.style.position = "relative";
        this.dom.style.userSelect = "none";
        this.dom.classList.add('gui-dom')

        let store_config = this.store

        if (typeof store_config !== "object" || store_config === null) {
            store_config = {
                state: {},
                actions: {},
                mutations: {},
                getters: {}
            }
        }

        store_config.getters = store_config.getters || {}
        store_config.state = store_config.state || {}
        store_config.actions = store_config.actions || {}
        store_config.mutations = store_config.mutations || {}


        this.vuex_store = new Vuex.Store(store_config)
        ResourceManager.vuex_stores[this.UUID] = this.vuex_store

        let ui_wrapper = this.ui_wrapper = new Vue({
            template: `<${this.root_component.name}/>`,
            components: {
                [`${this.root_component.name}`]: this.root_component
            },
            props: this.props,
            store: this.vuex_store
        })

        ui_wrapper.gui_component = this
    }
    on_destroy() {
        super.on_destroy(...arguments)
        this.ui_wrapper.$destroy();
        this.el.remove()
        delete ResourceManager.vuex_stores[this.UUID]
    }
    on_enable() {
        this.globals.dom.appendChild(this.dom)
        this.ui_wrapper.$mount(this.dom)
    }
    on_tick(time_delta) {
        this.ui_wrapper.tick(time_delta)
    }
    store_set(key, value) {
        return this.vuex_store.state[key] = value
    }
    store_commit(mutation_name, payload) {
        return this.vuex_store.commit(mutation_name, payload)
    }
    store_dispatch(action_name, payload) {
        return this.vuex_store.dispatch(action_name, payload)
    }
    run_method(method_name, ...payload) {
        let root_comp = this.ui
        if (!root_comp) {
            this.error(`cannot run nested methods: no root`)
            return
        }

        this._run_method_on(root_comp, method_name, ...payload)
    }
    _run_method_on(object, method_name, ...payload) {
        if (isObject(object) && isFunction(object[method_name])) {
            object[method](...payload)
        }
    }
    run_nested_methods(method_name, ...payload) {
        let root_comp = this.ui
        if (!root_comp) {
            this.error(`cannot run nested methods: no root`)
            return
        }
        this._run_nested_methods_on_comp(root_comp, method_name, ...payload)
    }
    _run_nested_methods_on_comp(comp, method_name, ...payload) {
        comp = comp || this.ui
        if (!comp) {
            this.error(`cannot run nested methods: no comp`)
            return
        }
        if (isFunction(comp[method_name])) {
            comp[method_name](...payload)
        }
        if (isArray(comp.$children)) {
            comp.$children.forEach(child => this._run_nested_methods_on_comp(child, method_name, ...payload))
        }
    }
}

export default VueGUIComponent;
