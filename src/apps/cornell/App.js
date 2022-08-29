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
		postfx.use_ssgi = true
		
		//postfx.use_ssao = false
		//postfx.use_bloom = false
		//postfx.use_grain = false
		//postfx.use_vignette = false
		//postfx.use_godrays = false

		renderer.target_fps = 60
		// postfx.enabled = Device.device_type === "desktop"
		camera.fov = 30

		let orbit = this.find_component_of_type('OrbitControlsComponent')
		orbit.set_controls_state({
			position: [-0.008721618887842814, 1.4745788967107356, -5.433461645531523],
			target: [-0.14968219888401893, 0.9545481561763598, 0.3259858410615277],
			zoom: 1
		})

		this.start()
	}
	on_tick() {
		
	}
}

export default App;
