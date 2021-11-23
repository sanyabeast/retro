import RetroApp from "retro/App"
import ResourceManager from "retro/ResourceManager";

class App extends RetroApp {
    constructor(params) {
        super({
            ...params,
        });
        let stage = this.load_stage(ResourceManager.load_prefab("{{APP_NAME}}.scenes.main"))
        let camera = this.find_component_of_type("CameraComponent")
        let orbit_controls = this.find_component_of_type("OrbitControlsComponent")
        let postfx = this.find_component_of_type("Postprocessing")

        let renderer = this.find_component_of_type("Renderer")

        renderer.target_fps = 60

        orbit_controls.max_polar_angle = Math.PI / 3 + Math.PI / 8
        orbit_controls.min_polar_angle = Math.PI / 3
        orbit_controls.min_azimuth_angle = -Math.PI / 32
        orbit_controls.max_azimuth_angle = Math.PI / 2.75
        orbit_controls.min_distance = 1
        orbit_controls.max_distance = 5

        postfx.bloom_threshold = 0.3
        postfx.bloom_smoothing = 0.8
        postfx.grain_power = 0.05

        camera.position = [
            0,
            2,
            5
        ]
        camera.fov = 60
        this.start()
    }
    on_tick() { }
}

export default App;
