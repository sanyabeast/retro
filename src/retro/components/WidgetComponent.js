
/* created by @sanyabeast 9/6/2021 
	*
	*
	*/

import Component from "retro/Component";
import ResourceManager from "retro/ResourceManager";
import Vue from "vue"
import Vuex from "vuex"
import { keys, set, unset, isFunction, isObject, isArray, isNumber, isNull, isString, throttle, forEach, isNil } from "lodash-es"
import { tools, log, error } from "retro/utils/Tools"
import { Vector3 } from "three"
import VuexPersistence from 'vuex-persist'

Vue.use(Vuex)
let RetroPlugin = {
	install(app, options) {
		let empty_arr = []
		let comp_id = 0
		let orientation_changed_fader_time = 0;
		let orientation_changed_fader_duration = 1;
		let platform_attrs = {
			is_landscape_orientation: false,
			is_mobile: false
		}
		let BasicComp = {
			name: "retro",
			data() {
				return {
					id: 0,
					UUID: 0,
					retro: {
						is_root: false,
						ready: false,
						is_mobile: false,
						is_landscape_orientation: undefined,
						tick_rate: PRESET.DEFAULT_WIDGET_TICK_RATE,
						prev_tick_time: +new Date()
					}
				}
			},
			props: {},
			watch: {},
			beforeMount() {
				// ids
				this.id = comp_id
				this.UUID = `${this.$options.name}_${this.id}`
				comp_id++

				if (isNil(this.$parent))
					this.retro.is_root = true

				set(ResourceManager.widget_component_instances, `${this.$options.name}.${this.UUID}`, this)

				// linking with retro comp
				if (this.gui_component === undefined) {
					this.tools = tools
					this.tools.extra.define_getters(this, {
						"gui_component": () => this.$root.gui_component,
						"game_object": () => this.$root.gui_component.game_object,
						"globals": () => this.$root.gui_component.globals,
						"app": () => this.$root.gui_component.globals.app,
						"launcher": () => this.$root.gui_component.globals.launcher,
						"camera": () => this.$root.gui_component.globals.camera,
						"tools": () => this.$root.gui_component.tools,
					})
				}
			},
			mounted() {
				this.update_platform_attributes()
				this.on_init();
				this.on_enable();
				this.on_create();

				this.retro.ready = true
			},
			update() {
				this.on_update(empty_arr)
			},
			destroyed() {
				unset(ResourceManager.widget_component_instances, `${this.$options.name}.${this.UUID}`)
				this.on_disable()
				this.on_destroy()
			},
			methods: {
				update_platform_attributes() {
					if (!tools.screen.is_onscreen_kb_active()) {
						platform_attrs.is_mobile = tools.device.is_mobile
						platform_attrs.is_landscape_orientation = /landscape/.test(tools.screen.get_orientation())

						if (this.$el && this.$el.classList) {
							if (platform_attrs.is_mobile) {
								this.$el.classList.add("--mobile")
								this.$el.classList.remove("--desktop")
							} else {
								this.$el.classList.remove("--mobile")
								this.$el.classList.add("--desktop")
							}

							if (platform_attrs.is_landscape_orientation) {
								this.$el.classList.add("--landscape")
								this.$el.classList.remove("--portrait")
							} else {
								this.$el.classList.remove("--landscape")
								this.$el.classList.add("--portrait")
							}
						}
					}


				},
				set_platform_attributes() {
					this.retro.is_mobile = platform_attrs.is_mobile
					this.retro.is_landscape_orientation = platform_attrs.is_landscape_orientation
				},
				tick(time_data) {
					if (this.retro.ready) {
						if (ResourceManager.globals.now - this.retro.prev_tick_time > 1000 / this.retro.tick_rate) {
							this.retro.prev_tick_time = ResourceManager.globals.now
							this.$children.forEach(c => c.tick(time_data))

							this.set_platform_attributes()
							this.on_tick(time_data)
						}
					}
				},
				/** RETRO LIFECYCLE EMULATION */
				on_init() { },
				on_enable() { },
				on_create() { },
				on_start() { },
				on_tick(time_data) { },
				on_update() { },
				on_disable() { },
				on_destroy() { },

				/**CORE COMP COMPAT */
				listen() { return this.game_object.listen(...arguments); },
				broadcast(event_name, payload) { return this.game_object.broadcast(...arguments); },
				get_component(component_name) { return this.game_object.get_component(...arguments); },
				find_component_of_type(component_name) { return this.game_object.find_component_of_type(...arguments); },
				find_components_of_type(component_name) { return this.game_object.find_components_of_type(...arguments); },
				setup_components(data) { return this.game_object.setup_components(...arguments); },
				add_component(data) { return this.game_object.add_component(data); },
				remove_component(data) { return this.game_object.remove_component(data); },
				get_components(component_name) { return this.game_object.get_components(component_name); },
				log() { log(`(Widget)"${this.$options.name || '?'}"`, ...arguments); },
				error() { error(`(Widget)"${this.$options.name || '?'}"`, ...arguments); },
				/**widget components */
				find_widget_component() { return ResourceManager.find_widget_component(...arguments); },
				find_widget_components() { return ResourceManager.find_widget_components(...arguments); }
			}
		}
		app.mixin(BasicComp)
	}
}

Vue.use(RetroPlugin)
class WidgetComponent extends Component {
	zoom = 1
	tick_rate = 5
	root_component = undefined
	module_name = "widget"
	/**[screen, world, screen2] */
	space = "screen"
	size = [1550, 850]
	size_mobile = [840, 480]
	fit = [0, 1]
	/**private */
	store = undefined
	props = {}
	world_space_position_vector = undefined
	renderer_comp = undefined
	camera_comp = undefined
	computed_aspect_ratio = 1
	computed_landscape_mode = true
	computed_boundind_rect = { width: 1, height: 1, x: 0, y: 0, left: 0, top: 0 }
	computed_zoom = 1
	constructor() {
		super(...arguments)
		this.world_space_position_vector = new Vector3()
	}
	get el() { return this.ui.$el; }
	get ui() { return this.vue_app.$children[0]; }
	get state() { return this.store.state; }
	get getters() { return this.store.state; }
	on_create() {
		this.log("creating...", this.store, this.root_component.name)
		this.dom = this.tools.html.create_dom(`div`)

		this.renderer_comp = this.find_component_of_type("Renderer")
		let { vue_app, store } = WidgetComponent.create_widget_application(this.root_component, {
			props: this.props,
			id: this.UUID
		})

		this.vue_app = vue_app
		this.store = store
		vue_app.gui_component = this

		this.update_zoom = throttle(this.update_zoom, 100)
		this.update_computed_private_props = throttle(this.update_computed_private_props, 1000)
	}
	on_destroy() {
		super.on_destroy(...arguments)
		this.vue_app.$destroy();
		this.el.remove()
		delete ResourceManager.widget_stores[this.UUID]
	}
	on_enable() {
		this.globals.dom.appendChild(this.dom)
		this.vue_app.$mount(this.dom)
		this.el.style.transform = "translate(0, 0)"
	}
	on_tick(time_data) {
		this.vue_app.update_platform_attributes();
		this.vue_app.tick(time_data)
		this.update_world_space_state()
		this.update_computed_private_props()
		this.update_zoom()
	}
	update_world_space_state() {
		if (this.space == "world" && this.el) {
			let pos = this.get_screen_position();
			this.el.style.transform = `translate(${this.tools.math.round(pos[0], 0.025)}px, ${this.tools.math.round(pos[1], 0.025)}px)`
		}
	}
	update_computed_private_props() {
		if (this.el && this.el.parentElement) {
			this.computed_boundind_rect = this.el.parentElement.getBoundingClientRect()
			this.computed_aspect_ratio = this.computed_boundind_rect.width / this.computed_boundind_rect.height
			this.computed_landscape_mode = this.computed_aspect_ratio > 1
		}
	}
	update_zoom() {
		switch (this.space) {
			case "screen": {
				if (!tools.screen.is_onscreen_kb_active()) {
					let size = this.size
					let fit = this.fit

					if (this.tools.device.is_mobile) {
						if (this.computed_landscape_mode) {
							size = this.size_mobile
							fit = this.fit_mobile || fit
						} else {
							size = [this.size_mobile[1], this.size_mobile[0]]
							fit = [this.fit[1], this.fit[0]]
							fit = this.fit_mobile_landscape || fit
						}
					}

					let h = this.computed_boundind_rect.height
					let w = this.computed_boundind_rect.width

					let h_zoom = h / size[1]
					let w_zoom = w / size[0]
					let final_zoom = this.tools.math.lerp(1, h_zoom, fit[1])
					this.computed_zoom = final_zoom = this.tools.math.lerp(final_zoom, w_zoom, fit[0])
					this.el.style.zoom = final_zoom
				}
				break
			}
			default: {
				this.el.style.zoom = '1'
				break
			}
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
	call_inside_widget_application(method_name, ...payload) {
		let root_comp = this.ui
		if (!root_comp) {
			this.error(`cannot run nested methods: no root`)
			return
		}
		this._call_inside_widget_application_on_comp(root_comp, method_name, ...payload)
	}
	_call_inside_widget_application_on_comp(comp, method_name, ...payload) {
		comp = comp || this.ui
		if (!comp) {
			this.error(`cannot run nested methods: no comp`)
			return
		}
		if (isFunction(comp[method_name])) {
			comp[method_name](...payload)
		}
		if (isArray(comp.$children)) {
			comp.$children.forEach(child => this._call_inside_widget_application_on_comp(child, method_name, ...payload))
		}
	}
}
WidgetComponent.widget_store_persistence_save_keys = {}
WidgetComponent.get_next_widget_store_persistence_id = function (alias = "anonym") {
	let keys = WidgetComponent.widget_store_persistence_save_keys

	let c = keys[alias]
	if (c === undefined) {
		c = keys[alias] = 0
	} else {
		c = keys[alias] = c + 1
	}
	return `widget-state-${alias}-${c}`
}
WidgetComponent.create_widget_application = function (root_component, options = {}) {
	if (isString(root_component)) {
		root_component = ResourceManager.widget_component_templates[root_component]
	}
	if (!isObject(root_component)) {
		throw new Error(`bad component template ${root_component}`)
	}
	let store_template = root_component.store_template
	if (isFunction(store_template)) {
		store_template = store_template(options)
	}
	let vuex_persistence_agent = new VuexPersistence({
		key: WidgetComponent.get_next_widget_store_persistence_id(isString(root_component) ? root_component : undefined),
		storage: window.localStorage,
		reducer: isObject(store_template) && isFunction(store_template.reducer) ? store_template.reducer : state => { }
	})
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

	if (false && vuex_persistence_agent !== undefined) {
		store_template.plugins = [
			vuex_persistence_agent.plugin
		]
	}
	let store = new Vuex.Store(store_template)
	ResourceManager.widget_stores[options.id || tools.random.string(16)] = store
	let vue_app = new Vue({
		template: `<${root_component.name}/>`,
		components: {
			[`${root_component.name}`]: root_component
		},
		props: options.props || {},
		store: store
	})
	let widget_app_data = {
		store,
		vue_app
	}
	return widget_app_data
}

export default WidgetComponent;
