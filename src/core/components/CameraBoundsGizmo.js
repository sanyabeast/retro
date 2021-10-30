/* created by @sanyabeast 8/14/2021 1:31:45 AM
 *
 *
 */

import * as THREE from 'three';
import Component from "core/Component";
class CameraBoundsGizmo extends Component {
    constructor(params) {
        super(params);
    }

    on_enable() {
        let top_left_gizmo = (this.top_left_gizmo = new THREE.Mesh({
            geometry: new THREE.CircleBufferGeometry(0.25, 32),
            material: new THREE.MeshBasicMaterial({
                color: 0xff0000,
            }),
            onTick: () => {
                // console.log(`tick`)
            },
            position: new THREE.Vector3(0, 0, 0.05),
            parent: this.globals.scene,
        }));

        let top_right_gizmo = (this.top_right_gizmo = new THREE.Mesh({
            geometry: new THREE.CircleBufferGeometry(0.25, 32),
            material: new THREE.MeshBasicMaterial({
                color: 0x00ff00,
            }),
            onTick: () => {
                // console.log(`tick`)
            },
            position: new THREE.Vector3(0, 0, 0.05),
            parent: this.globals.scene,
        }));

        let bottom_left_gizmo = (this.bottom_left_gizmo = new THREE.Mesh({
            geometry: new THREE.CircleBufferGeometry(0.25, 32),
            material: new THREE.MeshBasicMaterial({
                color: 0x0000ff,
            }),
            onTick: () => {
                // console.log(`tick`)
            },
            position: new THREE.Vector3(0, 0, 0.05),
            parent: this.globals.scene,
        }));

        let bottom_right_gizmo = (this.bottom_right_gizmo = new THREE.Mesh({
            geometry: new THREE.CircleBufferGeometry(0.25, 32),
            material: new THREE.MeshBasicMaterial({
                color: 0xff00ff,
            }),
            onTick: () => {
                // console.log(`tick`)
            },
            position: new THREE.Vector3(0, 0, 0.05),
            parent: this.globals.scene,
        }));
    }

    on_tick() {
        let viewport_size = this.globals.camera.get_viewport_size();
        this.top_left_gizmo.position.x =
            this.globals.camera.position.x - viewport_size[0] / 2;
        this.top_left_gizmo.position.y =
            this.globals.camera.position.y - viewport_size[1] / 2;
        this.top_right_gizmo.position.x =
            this.globals.camera.position.x + viewport_size[0] / 2;
        this.top_right_gizmo.position.y =
            this.globals.camera.position.y - viewport_size[1] / 2;
        this.bottom_left_gizmo.position.x =
            this.globals.camera.position.x - viewport_size[0] / 2;
        this.bottom_left_gizmo.position.y =
            this.globals.camera.position.y + viewport_size[1] / 2;
        this.bottom_right_gizmo.position.x =
            this.globals.camera.position.x + viewport_size[0] / 2;
        this.bottom_right_gizmo.position.y =
            this.globals.camera.position.y + viewport_size[1] / 2;
    }
}

export default CameraBoundsGizmo;
