
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import SceneComponent from "core/SceneComponent";
import AssetManager from "core/utils/AssetManager";
import { union } from "lodash";
import { Vector2 } from "spine-ts-threejs";
import * as THREE from 'three';
import { hex_to_hsl, hsl_to_rgb, hex_to_rgb , console } from "core/utils/Tools";



class Water extends SceneComponent {
    /**automatically finds "Sun" component and uses its sun`s position */
    find_sun = true
    sun = undefined
    width = 10000
    height = 10000

    on_created() {
        this.meta.layers.normal = false
        let water = this.subject = new THREE.objects.Water({
            width: this.width,
            height: this.height,
            fog: false
        });

    }
    get_render_data() {
        return [{
            object: this.subject,
            parent: this.object
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
    on_tick(time_delta) {
        if (this.find_sun) {
            this.sun = this.find_component_of_type("Sun")
        }

        if (this.sun !== undefined) {
            this.subject.material.uniforms['sunDirection'].value.copy(this.sun.subject.position).normalize();
            console.log(1)
        }

        this.subject.material.uniforms['time'].value += 1.0 / 60.0;
    }
}

export default Water;
