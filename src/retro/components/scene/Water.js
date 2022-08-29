
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import SceneComponent from "retro/SceneComponent";
import ResourceManager from "retro/ResourceManager";
import { hex_to_hsl, hsl_to_rgb, hex_to_rgb, console } from "retro/utils/Tools";



class Water extends SceneComponent {
    /**automatically finds "Sun" component and uses its sun`s position */
    find_sun = true
    sun = undefined
    width = 1000
    height = 1000
    water_type = 1

    on_create() {
        this.meta.layers.normal = false
        let water = undefined
        switch (this.water_type) {
            case 1:
                water = this.subject = ResourceManager.create_object("Water", {
                    width: this.width,
                    height: this.height,
                    fog: false
                })
                break;
            case 2:
                water = this.subject = ResourceManager.create_object("Water2", {
                    width: this.width,
                    height: this.height,
                    fog: false
                })
                break;
            default:
                break;
        }

    }
    get_render_data() {
        return [{
            object: this.subject,
            parent: this.game_object
        }]
    }
    get_reactive_props() {
        return [
            "find_sun"
        ].concat(super.get_reactive_props())
    }
    on_update(props) {
        super.on_update(...arguments)
    }
    on_tick(time_data) {
        switch (this.water_type) {
            case 1:
                if (this.find_sun) {
                    this.sun = this.find_component_of_type("Sun")
                }

                if (this.sun !== undefined) {
                    this.subject.material.uniforms['sunDirection'].value.copy(this.sun.subject.position).normalize();
                    let sun_color = this.sun.get_light_color()
                    this.subject.material.uniforms['sunDirection'].value.copy(sun_color)
                }

                this.subject.material.uniforms["eye"].value.copy(this.globals.camera)


                this.subject.material.uniforms['time'].value += 1.0 / 60.0;
                break;

            default:
                break;
        }
    }
}

export default Water;
