/* created by @sanyabeast 8/14/2021 1:31:45 AM
	*
	*
	*/

import { log, console } from "retro/utils/Tools";
import Component from "retro/Component";
import { SphereBufferGeometry, MeshNormalMaterial, Mesh, AxesHelper, Object3D } from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { get, isObject, isArray, isFunction, isNil, isNumber } from "lodash-es"
import { Vector3 } from "three"

let id = 0
const exclude_props: Array<string> = [
	"components"
]

const ANCHOR_GIZMO_GEOMETRY: SphereBufferGeometry = new SphereBufferGeometry(0.0125, 8, 8)
const ANCHOR_GIZMO_MATERIAL: MeshNormalMaterial = new MeshNormalMaterial({
	opacity: 0.5,
	transparent: true,
	depthWrite: false,
	depthTest: false
})

class SceneComponent extends Component {
	override subject: Object3D = null;
	position: number[] | IVector3LikeObject = [0, 0, 0]
	scale: number[] | IVector3LikeObject | number = [1, 1, 1]
	rotation: number[] | IVector3LikeObject = [0, 0, 0]
	visible: boolean = true
	frustum_culled: boolean = false
	render_order: number = 0
	is_scene_component: boolean = true
	/**private */
	transform_gizmo: Object3D | undefined
	anchor_gizmo: Object3D | undefined
	render_layer: any
	render_index: number
	visibility_rule: Function
	frusum_culled: boolean

	constructor(params: object) {
		super(params);

		if (isArray(this.position)) this.position = [...this.position]
		if (isArray(this.scale)) this.scale = [...this.scale]
		if (isArray(this.rotation)) this.rotation = [...this.rotation]

		/**gizmos */
		let anchor_gizmo: Mesh = this.anchor_gizmo = new Mesh(
			ANCHOR_GIZMO_GEOMETRY,
			ANCHOR_GIZMO_MATERIAL
		)
		anchor_gizmo.renderOrder = 1
	}
	override save_prefab(): IGeneratedScenePrefab {
		let r: IGeneratedScenePrefab = {
			...super.save_prefab(),
			position: this.position,
			scale: this.scale,
			rotation: this.rotation,
			visible: this.visible,
			render_layer: this.render_layer,
			render_index: this.render_index,
			render_order: this.render_order,
			frustum_culled: this.frustum_culled,
		}
		return r
	}
	override get_reactive_props(): Array<string> {
		return [
			"position",
			"scale",
			"rotation",
			"visible",
			"frustum_culled",
			"render_order"
		].concat(super.get_reactive_props())
	}

	override get_gizmo_render_data(): Array<IRetroComponentGizmoRenderDataItem> {
		if (this.subject) {
			return [{
				object: this.anchor_gizmo,
				parent: this.subject,
				layers: { gizmo: true }
			}/*, {
				object: this.axes_gizmo,
				parent: this.subject,
				layers: { gizmo: true }
			}*/]
		} else {
			return []
		}
	}
	init_visibility_rule(): void {
		if (isFunction(this.visibility_rule)) {
			Object.defineProperty(this.subject, "visible", {
				get: () => {
					return this.visibility_rule()
				}
			})
		}
	}
	override on_update(props: string[], scene: Object3D = this.subject): void {
		if (isObject(scene)) {
			props.forEach((prop: string) => {
				switch (prop) {
					case "position": {
						if (isArray(this.position)) {
							scene.position.set(
								this.position[0],
								this.position[1],
								this.position[2]
							);
						} else if (isObject(this.position)) {
							scene.position.set(
								(this.position as IVector3LikeObject).x,
								(this.position as IVector3LikeObject).y,
								(this.position as IVector3LikeObject).z
							)
						}

						break;
					}
					case "scale": {
						if (isArray(this.scale)) {
							scene.scale.set(
								this.scale[0],
								this.scale[1],
								this.scale[2]
							);
						} else if (isObject(this.scale)) {
							scene.scale.set(
								(this.scale as IVector3LikeObject).x,
								(this.scale as IVector3LikeObject).y,
								(this.scale as IVector3LikeObject).z
							)
						} else if (isNumber(this.scale)){
							scene.scale.setScalar(this.scale)
						}

						break;
					}
					case "rotation": {
						if (isArray(this.rotation)) {
							scene.rotation.set(
								this.rotation[0],
								this.rotation[1],
								this.rotation[2]
							);
						} else if (isObject(this.rotation)) {
							scene.rotation.set(
								(this.rotation as IVector3LikeObject).x,
								(this.rotation as IVector3LikeObject).y,
								(this.rotation as IVector3LikeObject).z
							)
						}

						break;
					}
					case "visible": {
						scene.visible = this.visible;
						break
					}
					case "frusum_culled": {
						scene.frustumCulled = this.frusum_culled;
						break
					}
					case "render_order": {
						//scene.renderOrder = this.render_order;
						break
					}
				}
			})
		}
		super.on_update(props);
	}

	override on_tick(td: IRetroObjectTimeData): void { }

	get_render_data(): Array<IRetroComponentRenderDataItem> {
		if (this.subject && this.game_object) {
			return [{
				object: this.subject,
				parent: this.game_object
			}]
		} else {
			return []
		}
	}
	set_position(x?: number, y?: number, z?: number) {
		this.position = [
			x ?? this.position[0],
			y ?? this.position[1],
			z ?? this.position[2]
		]
	}

	set_scale(x?: number, y?: number, z?: number) {
		this.scale = [
			x ?? this.scale[0],
			y ?? this.scale[1],
			z ?? this.scale[2]
		]
	}

	set_rotation(x?: number, y?: number, z?: number) {
		this.rotation = [
			x ?? this.rotation[0],
			y ?? this.rotation[1],
			z ?? this.rotation[2]
		]
	}

	static DEFAULT = {
		position: [0, 0, 0],
		scale: [1, 1, 1],
		rotation: [0, 0, 0]
	}

	static override component_name: string = "SceneComponent"
}

export default SceneComponent;
