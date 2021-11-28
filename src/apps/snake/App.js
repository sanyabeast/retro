import RetroApp from "retro/App"
import ResourceManager from "retro/ResourceManager";

class App extends RetroApp {
    constructor(params) {
        super({
            ...params,
        });

        let renderer = this.find_component_of_type("Renderer")
        renderer.target_fps = 60
        renderer.shadows_enabled = false
        let camera = this.find_component_of_type("CameraComponent")
        camera.position = [0, 2, 5]
        camera.fov = 45

        let stage = this.load_stage("{{APP_NAME}}.scenes.main")
        let controls = this.find_component_of_type("OrbitControlsComponent")
        controls.set_controls_state({ "target": [0, 0, 0], "position": [-0.0026379660244335835, 30.799284084135753, 0.4937334129267248], "zoom": 1 })
    }

    on_tick() {
        let input = this.find_component_of_type("InputComponent")
        if (input.is_keypress("1")) {
            console.log(11)
            this.reload_stage()
        }
    }
}

export default App;
