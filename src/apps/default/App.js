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
        controls.target = [
            -0.4937,
            1.1269,
            0.0785
        ]

        controls.position = [
            4.3608,
            2.7077,
            -3.2424
        ]
        controls.zoom = 1
       
       
        
        this.start()
    }
    on_tick() { }
}

export default App;
