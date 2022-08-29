/* created by @sanyabeast 8/20/2021 08:11:31 AM
 *
 *
 */


/* created by @sanyabeast 9/4/2021 
 *
 *
 */

import SceneComponent from "retro/SceneComponent";
import { PerspectiveCamera, Matrix4, OrthographicCamera, Vector3 } from 'three';

class CameraComponent extends SceneComponent {
    offset = [0, 0, 0];
    camera_type = 1
    fov = 80
    aspect = 1
    near = 0.01
    far = 100000
    left = -1
    right = 1
    top = -1
    bottom = 1
    moved = false
    /**privte */
    prev_camera_matrix = undefined
    constructor() {
        super(...arguments)
        this.prev_camera_matrix = new Matrix4()
    }
    on_create() {
        let o_camera = this.o_camera = new OrthographicCamera({
            fov: this.fov,
            aspect: this.aspect,
            near: this.near,
            far: this.far,
            position: new Vector3(0, 0, 20),
        });

        let p_camera = this.subject = this.p_camera = new PerspectiveCamera(this.fov, this.aspect, this.near, this.far);

        this.define_global_var("camera", a => this.subject)
        this.log(`created`, this.meta.params)

    }

    on_tick() {
        let current_camera_matrix = this.subject.matrixWorld
        let camera_matrix_changed = !this.prev_camera_matrix.equals(current_camera_matrix)
        this.prev_camera_matrix.copy(current_camera_matrix)
        this.moved = camera_matrix_changed
    }

    save_prefab() {
        return {
            ...super.save_prefab(),
            camera_type: this.camera_type,
            fov: this.fov,
            aspect: this.aspect,
            near: this.near,
            far: this.far,
            left: this.left,
            right: this.right,
            top: this.top,
            bottom: this.bottom,
        }
    }

    get_reactive_props() {
        return [
            "fov",
            "aspect",
            "near",
            "far",
            "left",
            "right",
            "top",
            "bottom",
            "camera_type"
        ].concat(super.get_reactive_props())
    }

    look_at(x, y, z) {
        this.subject.lookAt(new Vector3(x, y, z))
    }

    on_update(props) {
        super.on_update(...arguments)
        props.forEach(prop => {
            switch (prop) {
                case "fov": {
                    this.subject.fov = this.fov
                    this.subject.updateProjectionMatrix();
                    break;
                }
                case "aspect": {
                    this.subject.aspect = this.aspect
                    this.subject.updateProjectionMatrix();
                    break;
                }
                case "near": {
                    this.subject.near = this.near
                    this.subject.updateProjectionMatrix();
                    break;
                }
                case "far": {
                    this.subject.far = this.far
                    this.subject.updateProjectionMatrix();
                    break;
                }
                case "left": {
                    this.subject.left = this.left
                    this.subject.updateProjectionMatrix();
                    break;
                }
                case "right": {
                    this.subject.right = this.right
                    this.subject.updateProjectionMatrix();
                    break;
                }
                case "top": {
                    this.subject.top = this.top
                    this.subject.updateProjectionMatrix();
                    break;
                }
                case "bottom": {
                    this.subject.bottom = this.bottom
                    this.subject.updateProjectionMatrix();
                    break;
                }
                case "camera_type": {

                    break
                }
            }
        })
    }
}

CameraComponent.DEFAULT = {
    ...SceneComponent.DEFAULT
}

export default CameraComponent;
