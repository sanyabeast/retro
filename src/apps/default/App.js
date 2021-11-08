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
        camera.fov = 60
        let controls = this.find_component_of_type("OrbitControlsComponent")

        // controls.target = [-0.31197005211327, 0.974915058541094, 0.2336922765009091]
        // controls.position = [1.1388548774665392, 1.3167798096294043, 2.5525204666527]
        // controls.zoom = 1



        this.start()
    }
    on_tick() { }
}

export default App;
