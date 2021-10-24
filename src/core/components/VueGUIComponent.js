
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import Component from "core/Component";
import AssetManager from "core/utils/AssetManager";
import * as THREE from 'three';
import Vue from "vue"
import Vuex from "vuex"
import { mapState, mapGetters } from "vuex"
import { keys, set } from "lodash-es"
Vue.use(Vuex)

let MyPlugin = {}

MyPlugin.install = function (Vue, options) {
    let BasicComp = {
        name: "BasicComponent",
        data() {
            return {
                object: undefined,
                global: undefined,
                app: undefined,
                launcher: undefined,
                gui_component: undefined,
                camera: undefined,
                tasks: undefined
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
            this.object = gui_component.object
            this.globals = gui_component.globals
            this.app = gui_component.globals.app
            this.launcher = gui_component.globals.launcher
            this.camera = gui_component.globals.camera
        },
        mounted() {
            this.$el.style.zIndex = "1"
        },
        methods: {
            format_money(v) {
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
    get el(){
        return this.ui.$el
    }
    on_created() {
        console.log(this.store)
        
       

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
        let ui = this.ui = new Vue({
            template: `<${this.root_component.name}/>`,
            components: {
                [`${this.root_component.name}`]: this.root_component
            },
            props: this.props,
            store: this.vuex_store
        })

        ui.gui_component = this


    }
    on_enabled() {
        
        this.dom = document.createElement("div")
        this.dom.style.width = "100%";
        this.dom.style.height = "100%";
        this.dom.style.overflow = "hidden";
        this.dom.style.position = "relative";
        this.dom.style.userSelect = "none";
        this.dom.classList.add('gui-dom')
        this.globals.dom.appendChild(this.dom)
        this.ui.$mount(this.dom)
    }
    on_tick(time_delta) {
        this.ui.tick(time_delta)
    }
}

export default VueGUIComponent;
