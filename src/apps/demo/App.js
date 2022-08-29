import RetroApp from "retro/App"
import ResourceManager from "retro/ResourceManager";
import Device from "retro/utils/Device"
import { map } from "lodash-es"

class App extends RetroApp {
	constructor(params) {
		super({
			...params,
		});

		let stage = this.load_stage(ResourceManager.load_prefab("{{APP_NAME}}.scenes.main"))

		let renderer = this.find_component_of_type("Renderer")
		let camera = this.find_component_of_type("CameraComponent")
		let postfx = this.find_component_of_type("Postprocessing")

		renderer.target_fps = 60
		// postfx.enabled = Device.device_type === "desktop"
		camera.fov = 60

		let orbit = this.find_component_of_type('OrbitControlsComponent')
		orbit.set_controls_state({
			position: [0.34826515855801726, 1.6385337213944116, 0.33628339786123335],
			target: [0.1252859711719618, 0.7590916455158878, -0.22054224626392588],
			zoom: 1
	})

	this.start()
	}
	on_tick() {
		let point_light = this.find_component_with_tag("point_light")
		let camera = this.find_component_of_type("CameraComponent")
		let input = this.refs.input_component
		let postfx = this.find_component_of_type("Postprocessing")
		if (input && postfx) {
			if (input.intersected_renderables_changed) {
				postfx.outline_selection = map(input.intersected_colliders, collider => {
					return collider.get_component("MeshComponent").subject
				})
			}
		}
	}
}

export default App;
