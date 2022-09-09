
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import SceneComponent from "retro/SceneComponent";
import ResourceManager from "retro/ResourceManager";
import { AxesHelper, Mesh, SphereBufferGeometry, BoxBufferGeometry, MeshBasicMaterial, Object3D } from 'three';
import { flatten } from "lodash-es"

interface GizmosPool {
    [x: string]: Object3D[]
}

interface IRetroComponentGizmoRenderDataItem {
    object?: Object3D
}

enum GizmoTypes {
    sphere = "sphere",
    box = "box",
    plane = "plane"
}

interface GizmoProps {
    position?: number[]
    rotation?: number[]
    color?: any
    type?: GizmoTypes
    radius?: number
    opacity?: number
    width?: number
    height?: number
    depth?: number
    wireframe?: boolean
}

const gizmos_pool: GizmosPool = {
    [GizmoTypes.sphere]: [],
    [GizmoTypes.box]: [],
    [GizmoTypes.plane]: []
}

const default_gizmo_props: GizmoProps = {
    type: GizmoTypes.sphere,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    color: "#ff00ff",
    wireframe: false
}

class Gizmos extends SceneComponent {
    public static override DEFAULT: IGameObjectPrefab = {}
    zero_axes_helper_a?: AxesHelper
    zero_axes_helper_b?: AxesHelper
    /** private */
    gizmo_render_data?: IRetroComponentGizmoRenderDataItem[]
    gizmo_objects_list?: any[]
    override tick_rate: number = 30
    constructor(params) {
        super({ ...params })
        this.gizmo_objects_list = []
        this.gizmo_render_data = []
        this.meta.layers = {
            gizmo: true
        }
    }
    override on_create(): void {
        SceneComponent.add_traversal_method("component", "gizmo_draw", true)
        let zero_axes_helper_a: any = this.zero_axes_helper_a = new AxesHelper(99999)
        zero_axes_helper_a.material.depthWrite = false
        zero_axes_helper_a.material.depthTest = false
        zero_axes_helper_a.material.transparent = true
        zero_axes_helper_a.material.fog = false
        zero_axes_helper_a.renderOrder = 1
        let zero_axes_helper_b: any = this.zero_axes_helper_b = new AxesHelper(99999)
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
    override on_tick(time_data) {
        let renderer = this.find_component_of_type("Renderer")
        if (renderer && renderer.rendering_layers.gizmo === true) {
            this.gizmo_objects_list.forEach(object => {
                let gizmo_type = object.gizmo_type
                gizmos_pool[gizmo_type].push(object)
            })

            let new_gizmo_render_data = []
            let new_gizmo_objects_list = []

            let gizmo_collected_data = (this.globals.app as any).gizmo_draw()
            gizmo_collected_data = flatten(gizmo_collected_data)
            gizmo_collected_data.forEach((data, index) => {
                let object_render_data = this.get_gizmo_object_render_item(data, index)
                new_gizmo_objects_list.push(object_render_data)
                new_gizmo_render_data.push({
                    object: object_render_data
                })
            })
            this.gizmo_objects_list = new_gizmo_objects_list
            this.gizmo_render_data = new_gizmo_render_data
        }
    }
    get_gizmo_object_render_item(data: GizmoProps, index: number): Object3D {
        data = {
            ...default_gizmo_props,
            ...data
        }
        let type = data.type
        let item = gizmos_pool[type].pop() as any
        if (!item) {
            switch (type) {
                case GizmoTypes.sphere: item = new Mesh(new SphereBufferGeometry(1, 16, 8), new MeshBasicMaterial({ color: 0xFF0000, transparent: true })); item.gizmo_type = GizmoTypes.sphere; break;
                case GizmoTypes.box: item = new Mesh(new BoxBufferGeometry(1, 1, 1), new MeshBasicMaterial({ color: 0xFF0000, transparent: true })); item.gizmo_type = GizmoTypes.box; break;
                case GizmoTypes.plane: item = new Mesh(new SphereBufferGeometry(1, 1, 1), new MeshBasicMaterial({ color: 0xFF0000, transparent: true })); item.gizmo_type = GizmoTypes.plane; break;
            }
        }
        switch (type) {
            case GizmoTypes.sphere: {
                item.scale.setScalar(data.radius || 1)
                break
            }
            case GizmoTypes.box: {
                item.scale.set(data.width || 0, data.height || 0, data.depth || 0)
                break
            }
            case GizmoTypes.plane: {
                item.scale.set(data.width || 0, data.height || 0)
                break
            }
        }

        item.material.opacity = data.opacity
        item.material.wireframe = data.wireframe
        item.material.color.set_any(data.color)
        item.position.set(...data.position)
        item.rotation.set(...data.rotation)
        return item
    }
    override get_gizmo_render_data(): IRetroComponentGizmoRenderDataItem[] {
        return [{
            object: this.zero_axes_helper_a
        }, {
            object: this.zero_axes_helper_b
        }, ...this.gizmo_render_data]
    }
}

export default Gizmos;
