
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import SceneComponent from "core/SceneComponent";
import AssetManager from "core/utils/AssetManager";
import * as THREE from 'three';

class Gizmos extends SceneComponent {
    zero_axes_helper_a = undefined
    zero_axes_helper_b = undefined
    /** */
    
    constructor() {
        super(...arguments)
        this.meta.layers = {
            gizmo: true
        }
    }
    on_created() {
        let zero_axes_helper_a = this.zero_axes_helper_a = new THREE.AxesHelper(99999)

        zero_axes_helper_a.material.depthWrite = false
        zero_axes_helper_a.material.depthTest = false
        zero_axes_helper_a.material.transparent = true
        zero_axes_helper_a.material.fog = false
        zero_axes_helper_a.renderOrder = 1

        let zero_axes_helper_b = this.zero_axes_helper_b = new THREE.AxesHelper(99999)

        zero_axes_helper_b.rotation.y = Math.PI
        zero_axes_helper_b.scale.y = -1
        // zero_axes_helper_b.rotation.z = Math.PI
        zero_axes_helper_b.material.depthWrite = false
        zero_axes_helper_b.material.depthTest = false
        zero_axes_helper_b.material.transparent = true
        zero_axes_helper_b.material.fog = false
        zero_axes_helper_b.renderOrder = 1


        zero_axes_helper_a.setColors(
            "#f44336",
            "#8bc34a",
            "#00bcd4"
        )

        zero_axes_helper_b.setColors(
            "#f43659",
            "#4caf61",
            "#2196f3"
        )

    }
    on_tick(time_delta) {

    }
    get_gizmo_render_data() {
        return [{
            object: this.zero_axes_helper_a
        }, {
            object: this.zero_axes_helper_b
        }]
    }
}

Gizmos.DEFAULT = {

}

export default Gizmos;
