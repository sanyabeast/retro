import CoreApp from "core/App"
import AssetManager from "core/utils/AssetManager";
import Device from "core/utils/Device"

class App extends CoreApp {
    constructor(params) {
        super({
            ...params,
        });

        this.load_prefab(AssetManager.load_prefab("{app_name}.scenes.kit_main_scene"))
        this.refs.renderer.target_fps = 60

        let camera = this.find_component_of_type("CameraComponent")
        let postfx = this.find_component_of_type("Postprocessing")

        // postfx.enabled = Device.device_type === "desktop"
        camera.fov = 60
    }
    on_tick() {
        let point_light = this.find_component_with_tag("point_light")
        let camera = this.find_component_of_type("CameraComponent")
        // point_light.position = [...camera.position]
    }
}

export default App;
