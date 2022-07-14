
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import Component from "retro/Component";
import ResourceManager from "retro/ResourceManager";
import Vue from "vue"
import Vuex from "vuex"
import { mapState, mapGetters } from "vuex"
import { keys, set, isFunction, isObject, isArray, isNumber, isNull, isString } from "lodash-es"
import { tools, log, error } from "retro/utils/Tools"
import { Object3D, Vector3 } from "three"
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
            this.tools = tools

            while (p.$parent !== undefined) {
                p = p.$parent
            }
            let gui_component = p.gui_component

            Object.defineProperty(this, "gui_component", {
                get: () => gui_component
            })
            Object.defineProperty(this, "game_object", {
                get: () => gui_component.game_object
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
            Object.defineProperty(this, "tools", {
                get: () => gui_component.tools
            })
        },
        mounted() {
            if (this.$el && this.$el.style) {
                if (tools.device.is_mobile) {
                    this.$el.classList.add("mobile")
                }

                if (window.innerWidth > window.innerHeight){
                    this.$el.classList.add("landscape-orientation")
                } else {
                    this.$el.classList.remove("landscape-orientation")
                }
                // this.$el.style.zIndex = "2"
            }
        },
        methods: {
            format_money(v) {
                if (!isNumber(v) || isNaN(v)) {
                    return `${this.globals.money_format_currency || "?"} 0`
                }
                return `${this.globals.money_format_currency || "?"} ${this.round_to(v, 2)}`
            },
            round_to(v, d){
                return Math.round(v * Math.pow(10, d)) / Math.pow(10, d)
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
                return this.game_object.listen(event_name);
            },
            broadcast(event_name, payload) {
                return this.game_object.broadcast(event_name, payload);
            },
            get_component(component_name) {
                return this.game_object.get_component(component_name);
            },
            find_component_of_type(component_name) {
                return this.game_object.find_component_of_type(component_name);
            },
            find_components_of_type(component_name) {
                return this.game_object.find_components_of_type(component_name);
            },
            setup_components(data) {
                if (Array.isArray(data)) {
                    return this.game_object.setup_components(data)

                }
            },
            add_component(data) {
                if (typeof data === 'object') {
                    return this.game_object.add_component(data)

                }
            },
            remove_component(data) {
                return this.game_object.remove_component(data)
            },
            get_components(component_name) {
                return this.game_object.get_components(component_name);
            },
            log() {
                log(`VUE Component "${this.$options.name || '?'}"`, ...arguments)
            },
            error() {
                error(`VUE Component "${this.$options.name || '?'}"`, ...arguments)
            }

        }
    }

    Vue.mixin(BasicComp)
}
Vue.use(MyPlugin)

class VueGUIComponent extends Component {
    zoom = 1
    tick_rate = 5
    root_component = undefined
    module_name = "gui"
    space = "screen"
    /**private */
    store = undefined
    props = {}
    world_space_position_vector = undefined
    renderer_comp = undefined
    camera_comp = undefined
    fit_zoom = false
    min_width = -1
    max_width = -1
    min_height = -1
    min_max_height = -1
    constructor() {
        super(...arguments)
        this.world_space_position_vector = new Vector3()
    }
    get el() {
        return this.ui.$el
    }
    get ui() {
        return this.vue_app.$children[0]
    }
    get state() {
        return this.store.state
    }
    get getters() {
        return this.store.state
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

        let renderer_comp = this.renderer_comp = this.find_component_of_type("Renderer")

        let { vue_app, store } = VueGUIComponent.create_vue_app(this.root_component, {
            props: this.props,
            id: this.UUID
        })


        this.vue_app = vue_app
        this.store = store
        vue_app.gui_component = this
    }
    on_destroy() {
        super.on_destroy(...arguments)
        this.vue_app.$destroy();
        this.el.remove()
        delete ResourceManager.vuex_stores[this.UUID]
    }
    on_enable() {
        this.globals.dom.appendChild(this.dom)
        this.vue_app.$mount(this.dom)
        this.el.style.transform = "translate(0, 0)"
    }
    on_tick(time_data) {
        this.vue_app.tick(time_data)
        if (this.el && this.space == "world") {
            let pos = this.get_screen_position();
            this.el.style.transform = `translate(${this.tools.math.round(pos[0], 0.025)}px, ${this.tools.math.round(pos[1], 0.025)}px)`
        }

        if (this.fit_zoom) {
            let new_zoom = 1
            if (this.min_width > -1 && this.globals.dom_rect.width / this.min_width < 1) {
                new_zoom = Math.min(this.globals.dom_rect.width / this.min_width, new_zoom)
            } else {
                new_zoom = Math.min(1, new_zoom)
            }

            if (this.min_height > -1 && this.globals.dom_rect.height / this.min_height < 1) {
                new_zoom = Math.min(1, this.globals.dom_rect.height / this.min_height)
            } else {
                new_zoom = Math.min(1, new_zoom)
            }

            this.el.style.zoom = new_zoom * this.zoom
        } else {
            this.el.style.zoom = "auto"
        }
    }
    get_screen_position() {
        var vector = this.world_space_position_vector

        var widthHalf = 0.5 * this.renderer_comp.resolution.x;
        var heightHalf = 0.5 * this.renderer_comp.resolution.y;

        // this.subject.updateMatrixWorld();
        vector.setFromMatrixPosition(this.game_object.transform.matrixWorld);
        vector.project(this.globals.camera);

        vector.x = (vector.x * widthHalf) + widthHalf;
        vector.y = - (vector.y * heightHalf) + heightHalf;

        return [vector.x, vector.y]

    };
    store_set(key, value) {
        this.store.state[key] = value
    }
    store_commit(mutation_name, payload) {
        this.store.commit(mutation_name, payload)
    }
    store_dispatch(action_name, payload) {
        this.store.dispatch(action_name, payload)
    }
    call_method(method_name, ...payload) {
        let root_comp = this.ui
        if (!root_comp) {
            this.error(`cannot run nested methods: no root`)
            return
        }

        this._call_method_on(root_comp, method_name, ...payload)
    }
    _call_method_on(object, method_name, ...payload) {
        if (isObject(object) && isFunction(object[method_name])) {
            object[method](...payload)
        }
    }
    call_down_vue(method_name, ...payload) {
        let root_comp = this.ui
        if (!root_comp) {
            this.error(`cannot run nested methods: no root`)
            return
        }
        this._call_down_vue_on_comp(root_comp, method_name, ...payload)
    }
    _call_down_vue_on_comp(comp, method_name, ...payload) {
        comp = comp || this.ui
        if (!comp) {
            this.error(`cannot run nested methods: no comp`)
            return
        }
        if (isFunction(comp[method_name])) {
            comp[method_name](...payload)
        }
        if (isArray(comp.$children)) {
            comp.$children.forEach(child => this._call_down_vue_on_comp(child, method_name, ...payload))
        }
    }
}

VueGUIComponent.create_vue_app = function (root_component, options = {}) {
    if (isString(root_component)) {
        root_component = ResourceManager.vue_components_templates[root_component]
    }

    if (!isObject(root_component)) {
        throw new Error(`bad component template ${root_component}` )
    }

    let store_template = root_component.store_template

    if (isFunction(store_template)) {
        store_template = store_template(options)
    }

    if (!isObject(store_template)) {
        store_template = {
            state: {},
            actions: {},
            mutations: {},
            getters: {}
        }
    }

    store_template.getters = store_template.getters || {}
    store_template.state = store_template.state || {}
    store_template.actions = store_template.actions || {}
    store_template.mutations = store_template.mutations || {}

    let store = new Vuex.Store(store_template)
    ResourceManager.vuex_stores[options.id || tools.random.string(16)] = store

    let vue_app = new Vue({
        template: `<${root_component.name}/>`,
        components: {
            [`${root_component.name}`]: root_component
        },
        props: options.props || {},
        store: store
    })

    let vue_app_data = {
        store,
        vue_app
    }

    return vue_app_data
}

export default VueGUIComponent;
