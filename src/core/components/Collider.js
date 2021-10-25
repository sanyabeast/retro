
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import SceneComponent from "core/SceneComponent";
import AssetManager from "core/utils/AssetManager";
import * as THREE from 'three';

const COLLIDER_WIREFRAME_COLOR = "#ff5722"

class Collider extends SceneComponent {
    collider_type = "sphere"
    sphere_radius = 1
    box_size = undefined

    mesh_component_tag = undefined
    use_mesh_position = true
    use_mesh_rotation = true
    use_mesh_scale = true
    offset = undefined
    /**private */
    sphere_mesh = undefined
    box_mesh = undefined
    mesh_component = undefined
    constructor() {
        super(...arguments)
        this.box_size = [1, 1, 1]
        this.offset = [0, 0, 0]
        this.meta.layers.gizmo = true
        this.meta.layers.raycast = true
        this.meta.layers.rendering = false
    }
    on_created() {
        let wireframe_mat = this.wireframe_mat = new THREE.MeshBasicMaterial({
            wireframe: true,
            color: COLLIDER_WIREFRAME_COLOR,
            opacity: 0.33,
            transparent: true
        })
        let sphere_mesh = this.sphere_mesh = new THREE.Mesh(
            new THREE.SphereBufferGeometry(1, 12, 6),
            wireframe_mat
        )
        let box_mesh = this.box_mesh = new THREE.Mesh(
            new THREE.BoxBufferGeometry(1, 1, 1, 1),
            wireframe_mat
        )

        this.update_collider()
        this.force_update()
    }
    get_reactive_props() {
        return [
            "collider_type",
            "sphere_radius",
            "box_size",
        ].concat(super.get_reactive_props())
    }
    get_render_data() {
        return []
    }
    get_gizmo_render_data() {
        return [{
            object: this.subject,
            parent: this.object
        }, ...super.get_gizmo_render_data()]
    }
    on_update(props) {
        super.on_update(props)
        props.forEach(prop => {
            switch (prop) {
                case "collder_type": {
                    this.update_collider()
                    break
                }
                case "sphere_radius": {
                    this.sphere_mesh.scale.set(this.sphere_radius, this.sphere_radius, this.sphere_radius)
                    break
                }
                case "box_size": {
                    this.box_mesh.scale.set(...this.box_size)
                    break
                }
            }
        })
    }
    on_tick(time_delta) {
        if (this.use_mesh_position) {
            let mesh_component = this.mesh_component
            if (mesh_component === undefined) {
                mesh_component = this.get_component("MeshComponent")
                if (mesh_component !== undefined) {
                    this.position = [
                        mesh_component.position[0] + this.offset[0],
                        mesh_component.position[1] + this.offset[1],
                        mesh_component.position[2] + this.offset[2]
                    ]
                }
            }
        }
        if (this.use_mesh_rotation) {
            let mesh_component = this.mesh_component
            if (mesh_component === undefined) {
                mesh_component = this.get_component("MeshComponent")
                if (mesh_component !== undefined) {
                    this.rotation = mesh_component.rotation
                }
            }
        }
        if (this.use_mesh_scale) {
            let mesh_component = this.mesh_component
            if (mesh_component === undefined) {
                mesh_component = this.get_component("MeshComponent")
                if (mesh_component !== undefined) {
                    this.scale = mesh_component.scale
                }
            }
        }
    }
    update_collider() {
        switch (this.collider_type) {
            case "sphere": {
                this.subject = this.sphere_mesh
                break
            }
            case "box": {
                this.subject = this.box_mesh
                break
            }
        }
    }
}

export default Collider