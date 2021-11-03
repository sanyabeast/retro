import CoreApp from "core/App"
import ResourceManager from "core/ResourceManager";
import Device from "core/utils/Device"
import { map } from "lodash-es"

class App extends CoreApp {
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
