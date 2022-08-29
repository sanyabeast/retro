import RetroApp from "retro/App"
import ResourceManager from "retro/ResourceManager";
import Device from "retro/utils/Device"
import { map } from "lodash-es"
import Component from "../../retro/Component";

class App extends RetroApp {
	constructor(params) {
		super({
			...params,
		});

		this.load_stage(ResourceManager.load_prefab("{{APP_NAME}}.scenes.main"))
		this.find_component_of_type("Renderer")
		
		let postfx = this.find_component_of_type("Postprocessing")
		// postfx.use_ssgi = true

		let camera = this.find_component_of_type("CameraComponent") as any
		camera.fov = 45

		let orbit = this.find_component_of_type('OrbitControlsComponent') as any
		orbit.set_controls_state({
			position: [0.06709046098670876, 1.4560641215969266, 2.762232087737593],
			target: [0.07783611134107367, 0.9827307616883895, -0.01875572798565418],
			zoom: 1
		})

		this.start()
	}
	override on_tick(td: IRetroObjectTimeData): void {
		super.on_tick(td)
	}
}

export default App;
