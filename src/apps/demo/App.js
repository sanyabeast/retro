import CoreApp from "core/App"
import * as THREE from 'three';
import AssetManager from "core/utils/AssetManager";

class App extends CoreApp {
    constructor(params) {
        super({
            ...params,
        });

        this.load_prefab(AssetManager.load_prefab("demo.kit_main_scene"))
        this.refs.renderer.target_fps = 60
        this.find_component_of_type("CameraComponent").position = [
            3,
            -4,
            3
        ]

        let postfx = this.find_component_of_type("Postprocessing")

        console.log(postfx)

        postfx.outline_selection = [
            this.children[6].children[0].refs.mesh.get_render_data().object,
            this.find_component_with_tag("cube2").get_render_data().object
        ]

    }
    on_tick() {
        let time = this.globals.uniforms.time.value
        let camera = this.find_component_of_type("CameraComponent")
        if (camera) {
            camera.fov = 80 + (Math.sin(time) * 25)
            let radius = 2 + Math.abs(Math.sin(time / 10)) * 5
            camera.position = [
                Math.sin(time / 5) * radius,
                Math.sin(time / 7) * 5,
                Math.cos(time / 11) * radius
            ]

            this.find_component_of_type("CameraComponent").look_at(0, 0, 0)
        }

    }
}

export default App;
