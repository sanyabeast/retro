import CoreApp from "core/App"
import ResourceManager from "core/ResourceManager";

class App extends CoreApp {
    constructor(params) {
        super({
            ...params,
        });
        let stage = this.load_stage(ResourceManager.load_prefab("{{APP_NAME}}.scenes.main"))
        let camera = this.find_component_of_type("CameraComponent")
        camera.position = [
            0,
            2,
            5
        ]
        camera.fov = 60


        let controls = this.find_component_of_type("OrbitControlsComponent")

        controls.target = [-0.3274459053651773, 0.5307513889037137, 0.18259720921051698]
        controls.position = [1.9621248184333282, 0.9075206629556949, 1.2771517050514491]
        controls.zoom = 1



        this.start()
    }
    on_tick() { }
}

export default App;
