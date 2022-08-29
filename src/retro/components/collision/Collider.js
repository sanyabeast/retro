
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import SceneComponent from "retro/SceneComponent";
import ResourceManager from "retro/ResourceManager";
import { Color, MeshBasicMaterial, SphereBufferGeometry, BoxBufferGeometry, Mesh } from 'three';

const COLLIDER_WIREFRAME_COLOR = "#8bc34a"

let collider_id = 0
function get_collider_color(collider_id) {
    let r = parseInt((parseFloat(((collider_id * 1.34151) % 1).toFixed(5)) * 255))
    let g = parseInt((parseFloat(((collider_id * 2.72245) % 1).toFixed(5)) * 255))
    let b = parseInt((parseFloat(((collider_id * 3.14587) % 1).toFixed(5)) * 255))
    let id = `${r}|${g}|${b}`
    return {
        id,
        color: new Color(r / 255, g / 255, b / 255)
    }
}
function get_colorid_material(collider_id) {
    let color_data = get_collider_color(collider_id)
    let mat = new MeshBasicMaterial({ color: color_data.color })
    return {
        id: color_data.id,
        material: mat
    }
}

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
    collider_id = undefined
    colorid_box_mesh = undefined
    colorid_sphere_mesh = undefined
    colorid_subject = undefined
    colorid_material = undefined
    colorid_id = undefined

    prev_pointerhover = false
    pointer_hovered = false


    constructor() {
        super(...arguments)
        this.box_size = [1, 1, 1]
        this.offset = [0, 0, 0]
        this.collider_id = collider_id
        collider_id++

        this.meta.layers.gizmo = true
        this.meta.layers.raycast = true
        this.meta.layers.normal = false
        this.meta.layers.rendering = false
    }
    on_create() {
        let wireframe_mat = this.wireframe_mat = new MeshBasicMaterial({
            wireframe: true,
            color: COLLIDER_WIREFRAME_COLOR,
            opacity: 0.1,
            transparent: true
        })

        /**raycast collider */
        let sphere_mesh = this.sphere_mesh = new Mesh(
            new SphereBufferGeometry(1, 12, 6),
            wireframe_mat
        )
        let box_mesh = this.box_mesh = new Mesh(
            new BoxBufferGeometry(1, 1, 1, 1),
            wireframe_mat
        )

        box_mesh.scale.set(...this.box_size)

        /**colorid */
        let colorid_material_data = this.colorid_material_data = get_colorid_material(this.collider_id)
        this.colorid_id = colorid_material_data.id
        Collider.colorid_list[this.colorid_id] = this

        let colorid_sphere_mesh = this.colorid_sphere_mesh = new Mesh(
            new SphereBufferGeometry(1, 12, 6),
            colorid_material_data.material
        )
        let colorid_box_mesh = this.colorid_box_mesh = new Mesh(
            new BoxBufferGeometry(1, 1, 1, 1),
            colorid_material_data.material
        )


        colorid_box_mesh.scale.set(...this.box_size)

        this.update_collider()
        this.force_update()
    }
    get_reactive_props() {
        return [
            "collider_type",
            "sphere_radius",
            "box_size",
            "pointer_hovered"
        ].concat(super.get_reactive_props())
    }
    get_render_data() {
        return []
    }
    get_gizmo_render_data() {
        return [{
            object: this.subject,
            parent: this.game_object
        }, {
            object: this.colorid_subject,
            parent: this.game_object,
            layers: { colorid: true }
        }, ...super.get_gizmo_render_data()]
    }
    on_destroy() {
        super.on_destroy(...arguments);
    }
    on_update(props) {
        super.on_update(props)
        props.forEach(prop => {
            switch (prop) {
                case "collder_type": {
                    this.update_collider()
                    break
                }

                case "position": {
                    if (this.colorid_subject) this.colorid_subject.position.copy(this.subject.position)
                }
                case "rotation": {
                    if (this.colorid_subject) this.colorid_subject.rotation.copy(this.subject.rotation)
                }
                case "scale": {
                    this.box_mesh.scale.set(
                        this.scale[0] * this.box_size[0],
                        this.scale[1] * this.box_size[1],
                        this.scale[2] * this.box_size[2],
                    )
                    this.sphere_mesh.scale.set(this.sphere_radius * this.scale[0], this.sphere_radius * this.scale[1], this.sphere_radius * this.scale[2])
                    if (this.colorid_subject) this.colorid_subject.scale.copy(this.subject.scale)
                }
                case "box_size": {
                    this.box_mesh.scale.set(
                        this.scale[0] * this.box_size[0],
                        this.scale[1] * this.box_size[1],
                        this.scale[2] * this.box_size[2],
                    )
                    break
                }
                case "sphere_radius": {
                    this.sphere_mesh.scale.set(this.sphere_radius, this.sphere_radius, this.sphere_radius)
                    break
                }
                case "pointer_hovered": {
                    let changed = this.prev_pointerhover === this.pointer_hovered
                    if (this.pointer_hovered === true && changed) {
                        this.call_inside("handle_pointerover", this)
                    }

                    else if (!this.pointer_hovered && changed) {
                        this.call_inside("handle_pointerout", this)
                    }

                    this.prev_pointerhover = this.pointer_hovered
                    break
                }
            }
        })
    }
    on_tick(time_data) {
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
                this.sphere_mesh.collider = this
                this.subject = this.sphere_mesh
                this.colorid_subject = this.colorid_sphere_mesh
                break
            }
            case "box": {
                this.box_mesh.collider = this
                this.subject = this.box_mesh
                this.colorid_subject = this.colorid_box_mesh
                break
            }
            default: {
                this.error(`unknown collider type: ${this.collider_type}`)
            }
        }
    }
}


Collider.color_id_get_with_rgb = (r, g, b) => {
    let id = `${r}|${g}|${b}`
    return Collider.colorid_list[id]
}
Collider.colorid_list = {}

export default Collider