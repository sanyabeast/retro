
import RetroApp from "retro/App"
import ResourceManager from "retro/ResourceManager";
import Device from "retro/utils/Device"
import { map } from "lodash-es"
import Component from "../../retro/Component";
import { PerspectiveCamera } from "three";

class App extends RetroApp {
	constructor(params) {
		super({
			...params,
		});

		this.load_stage(ResourceManager.load_prefab("{{APP_NAME}}.scenes.main"));

		(this.globals.camera as PerspectiveCamera).fov = 45

		let orbit = this.find_component_of_type('OrbitControlsComponent') as any
		orbit.set_controls_state({
			position: [-0.3132004573655145, 1.8203491947945074, 1.7356504582355965],
			target: [0.028820815056146264, 1.0686526553382625, -0.1849195430597795]
		})
		this.start()
	}
	override on_tick(td: IRetroObjectTimeData): void {
		super.on_tick(td)
	}
}

export default App;
