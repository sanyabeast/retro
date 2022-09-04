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
		this.start()
	}
	override on_tick(td: IRetroObjectTimeData): void {
		super.on_tick(td)
	}
}

export default App;
