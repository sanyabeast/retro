import CoreApp from "core/App"
import ResourceManager from "core/ResourceManager";

class App extends CoreApp {
    constructor(params) {
        super({
            ...params,
        });
        let stage = this.load_stage(ResourceManager.load_prefab("{{APP_NAME}}.scenes.main"))
        let renderer = this.find_component_of_type("Renderer")
        renderer.target_fps = 60
        let camera = this.find_component_of_type("CameraComponent")
        camera.position = [
            0,
            2,
            5
        ]
        camera.fov = 45
        let controls = this.find_component_of_type("OrbitControlsComponent")
        controls.set_controls_state({ "target": [0, 0, 0], "position": [3.756349266102919e-15, -0.026115050734834725, 4.6170318205801735], "zoom": 1 })

        this.start()
    }
    on_tick() { }
}

export default App;
