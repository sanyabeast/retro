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

		(this.globals.camera as PerspectiveCamera).fov = 60

		let orbit = this.find_component_of_type('OrbitControlsComponent') as any
		this.start()
	}
	override on_tick(td: IRetroObjectTimeData): void {
		super.on_tick(td)
	}
}

export default App;
