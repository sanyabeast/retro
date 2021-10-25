import CoreApp from "core/App"
import AssetManager from "core/utils/AssetManager";
import Device from "core/utils/Device"

class App extends CoreApp {
    constructor(params) {
        super({
            ...params,
        });

        let stage = this.load_stage(AssetManager.load_prefab("{app_name}.scenes.main"))

        let renderer = this.find_component_of_type("Renderer")
        let camera = this.find_component_of_type("CameraComponent")
        let postfx = this.find_component_of_type("Postprocessing")

        renderer.target_fps = 60
        // postfx.enabled = Device.device_type === "desktop"
        camera.fov = 60

        this.start()
    }
    on_tick() {
        let point_light = this.find_component_with_tag("point_light")
        let camera = this.find_component_of_type("CameraComponent")
        let input = this.refs.input_component
        let postfx = this.find_component_of_type("Postprocessing")


        if (input && postfx) {
            if (input.intersected_objects_changed && input.intersected_objects.length > 0) {
                postfx.outline_selection = input.intersected_objects
            }

        }
    }
}

export default App;
