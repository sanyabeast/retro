import CoreApp from "core/App"
import AssetManager from "core/utils/AssetManager";

class App extends CoreApp {
    constructor(params) {
        super({
            ...params,
        });

        let stage = this.load_stage(AssetManager.load_prefab("{app_name}.scenes.main"))

        let camera = this.find_component_of_type("CameraComponent")
        camera.fov = 60

        this.start()
    }
    on_tick() { }
}

export default App;
