import CoreApp from "core/App"
import AssetManager from "core/utils/AssetManager";

class App extends CoreApp {
    constructor(params) {
        super({
            ...params,
        });

        this.load_prefab(AssetManager.load_prefab("{app_name}.scenes.kit_main_scene"))
        this.refs.renderer.target_fps = 60

        let camera = this.find_component_of_type("CameraComponent")
        camera.fov = 60

        this.start()
    }
    on_tick() { }
}

export default App;
