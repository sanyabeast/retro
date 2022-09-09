


import SceneComponent from "retro/SceneComponent";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoughnessMipmapper } from 'three/examples/jsm/utils/RoughnessMipmapper.js';
import path from "path"
import { AnimationAction, AnimationClip, AnimationMixer, DoubleSide, Event, Group, Mesh, MeshStandardMaterial, Object3D, Texture, WebGLRenderer } from "three";
import { forEach, isArray, isNil, isNumber, isString } from "lodash";
import { do_once } from "retro/utils/Tools"
import ResourceManager from "retro/ResourceManager"
import { NearestFilter, LinearFilter, LinearMipMapLinearFilter, LinearMipMapNearestFilter, NearestMipMapLinearFilter, NearestMipmapNearestFilter } from "three"

const gltf_loader = new GLTFLoader()
// const roughnessMipmapper = new RoughnessMipmapper( renderer );

function get_texture_filter_with_name(name: string): number {
	switch (name) {
		case "NearestFilter": return NearestFilter;
		case "LinearFilter": return LinearFilter;
		case "LinearMipMapLinearFilter": return LinearMipMapLinearFilter;
		case "NearestMipmapNearestFilter": return NearestMipmapNearestFilter;
		case "LinearMipMapNearestFilter": return LinearMipMapNearestFilter;
		case "NearestMipMapLinearFilter": return NearestMipMapLinearFilter;
		default: return LinearFilter;
	}
}

enum ModelFormats {
	gltf = "gltf",
	glb = "glb"
}

interface SkAction {
	action?: AnimationAction
	weight: number
}

export class MeshRenderer extends SceneComponent {
	public src: string = "";
	public recieve_shadow: boolean = true
	public cast_shadow: boolean = true
	public normal_scale: number = 1
	public bump_scale: number = 1
	public emission_scale: number = 1
	public hide_object?: string | string[];
	public override_texture_filter?: string

	private actions: {
		[x: string]: SkAction
	} = {};
	private base_path: string = "";
	private main_file_name: string = "";
	private object_format: string = ModelFormats.gltf;
	private scene: Group
	private texturePropNames: string[] = [
		"map"
	];
	private mixer: AnimationMixer;

	constructor(params: any) {
		super(params);
		do_once(this.init_rm_things, this)
	}

	private init_rm_things(): void {
		ResourceManager.add_dict('meshworks_cache')
	}

	override on_create(): void {

	}

	override async on_destroy() {
		await super.on_destroy()
		delete this.scene
	}

	public override get_reactive_props(): string[] {
		return [
			'src',
			...super.get_reactive_props()
		]
	}

	override get_render_data(): IRetroComponentRenderDataItem[] {
		return [{
			object: this.scene,
			parent: this.game_object
		}]
	}

	override on_update(props: string[], scene?: Object3D<Event>): void {
		super.on_update(props, this.scene)
	}

	public override on_change(prop_name: string, value: any): void {
		switch (prop_name) {
			case 'src': {
				this.base_path = `${path.dirname(this.src)}/`
				this.main_file_name = path.basename(this.src);
				this.object_format = path.extname(this.src).replace(/\./, '');

				this.load_object();
			}
		}
	}

	private async load_object(): Promise<void> {
		switch (this.object_format) {
			case ModelFormats.gltf: {
				// if (!this.check_and_set_cached_scene()) 
				await this.load_object_gltf();
				break;
			}
			case ModelFormats.glb: {
				// if (!this.check_and_set_cached_scene()) 
				await this.load_object_gltf();
				break;
			}
		}

		this.force_update([
			'scale',
			'position',
			'rotation'
		])
	}

	private check_and_set_cached_scene(): boolean {
		let cached_scene = ResourceManager.meshworks_cache[this.src];
		if (!isNil(cached_scene)) {
			this.scene = cached_scene;
			this.log(`using cached scene for "${this.src}"`)
			return true;
		} else {
			return false
		}
	}

	private load_object_gltf(): Promise<void> {
		gltf_loader.setPath(this.base_path);
		let scene: Group = new Group();
		let renderer: WebGLRenderer = this.globals.renderer;
		let roughness_mipmapper: RoughnessMipmapper

		if (!isNil(renderer)) {
			roughness_mipmapper = new RoughnessMipmapper(renderer);
		}

		return new Promise((resolve: Function, reject: Function) => {
			setTimeout(() => {
				gltf_loader.load(this.main_file_name, (gltf) => {
					gltf.scene.traverse((child: Object3D) => {
						if (!isNil(roughness_mipmapper) && (child as Mesh).isMesh) {
							roughness_mipmapper.generateMipmaps((child as Mesh).material);
						}

						if ((child as Mesh).isMesh) {
							let mesh: Mesh = child as Mesh
							mesh.receiveShadow = this.recieve_shadow;
							mesh.castShadow = this.cast_shadow;
							let mat = mesh.material as MeshStandardMaterial

							if (!isNil(mat.normalScale)) {
								mat.normalScale.x *= this.normal_scale
								mat.normalScale.y *= this.normal_scale
							}

							if (isNumber(mat.bumpScale)) {
								mat.bumpScale * this.bump_scale
							}

							if (isNumber(mat.emissiveIntensity)) {
								mat.emissiveIntensity *= this.emission_scale
							}

							if (isString(this.override_texture_filter)) {
								this.texturePropNames.forEach((name: string) => {
									let t: Texture = mat[name] as Texture
									if (!isNil(t)) {
										t.magFilter = get_texture_filter_with_name(this.override_texture_filter);
										t.minFilter = t.magFilter;
									}
								})
							}

							mat.envMapIntensity = 0.75
						}

						if (isString(this.hide_object) && this.hide_object === child.name) {
							child.visible = false
						}

						if (isArray(this.hide_object) && this.hide_object.indexOf(child.name) > -1) {
							child.visible = false
						}
					});

					/**animations */
					let animations: AnimationClip[] = gltf.animations;
					let mixer: AnimationMixer = this.mixer = new AnimationMixer(gltf.scene)
					let found_actions_count: number = animations.length;
					let first_animation_name: string

					for (let i = 0; i !== found_actions_count; ++i) {
						let clip = animations[i];
						const name = clip.name;
						if (isNil(first_animation_name)){
							first_animation_name = name;
						}
						
						this.actions[name] = {
							weight: 1,
							action: mixer.clipAction(clip)
						}
					}

					/**general */
					scene.add(gltf.scene);
					roughness_mipmapper.dispose();
					// render();

					if (!isNil(first_animation_name)){
						this.start_action(first_animation_name)
					}

					this.scene = scene;
					resolve();
				});
			}, 0)
		})
	}

	private start_action(action_name: string): void {
		let action_data: SkAction = this.actions[action_name]
		let action: AnimationAction = action_data.action;
		let weight: number = action_data.weight;
		let clip: AnimationClip = action.getClip();
		this.set_action_weight(action, weight);
		action.play();
	}

	private set_action_weight(action: AnimationAction, weight: number): void {
		action.enabled = true;
		action.setEffectiveTimeScale(1);
		action.setEffectiveWeight(weight);
	}

	override on_tick(td: IRetroObjectTimeData): void {
		if (!isNil(this.mixer)) {
			this.mixer.update(td.delta);
		}
	}
}
