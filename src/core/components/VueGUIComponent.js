
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

            }
        },
        props: {},
        computed: {
            ...mapState([
                "globals",
                "app",
                "object"
            ]),
            /**CORE COMP COMPAT */
            camera() {
                return this.globals.camera;
            },
            scene() {
                return this.globals.scene;
            },
            tasks() {
                return this.object.tasks;
            }
        },
        watch: {},
        mounted() { },
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
    props = {}
    constructor() {
        super(...arguments)


    }
    on_created() {
        this.dom = document.createElement("div")
        this.dom.style.width = "100%";
        this.dom.style.height = "100%";
        this.dom.style.overflow = "hidden";
        this.dom.style.position = "relative";
        this.dom.style.userSelect = "none";
        this.dom.classList.add('gui-dom')
        this.globals.dom.appendChild(this.dom)

        let store_config = this.store
        if (store_config === undefined) {
            store_config = this.root_component.store
        }
        if (store_config === undefined) {
            store_config = {
                state: {},
                actions: {},
                mutations: {},
                getters: {}
            }
        }
        store_config.state.globals = this.globals
        store_config.state.app = this.globals.app
        store_config.state.launcher = this.globals.launcher
        store_config.state.gui_component = this
        store_config.state.object = this.object

        this.vuex_store = new Vuex.Store(store_config)
        let ui = this.ui = new Vue({
            template: `<${this.root_component.name}/>`,
            components: {
                [`${this.root_component.name}`]: this.root_component
            },
            props: this.props,
            store: this.vuex_store
        })

    }
    on_enabled() {
        this.ui.$mount(this.dom)
    }
    on_tick(time_delta) {
        this.ui.tick(time_delta)
    }
}

export default VueGUIComponent;
