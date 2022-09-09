


import SceneComponent from "retro/SceneComponent";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoughnessMipmapper } from 'three/examples/jsm/utils/RoughnessMipmapper.js';
import path from "path"
import { DoubleSide, Event, Group, Mesh, MeshStandardMaterial, Object3D, Texture, WebGLRenderer } from "three";
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

export class MeshRenderer extends SceneComponent {
	public src: string = "";
	public recieve_shadow: boolean = true
	public cast_shadow: boolean = true
	public normal_scale: number = 1
	public bump_scale: number = 1
	public emission_scale: number = 1
	public hide_object?: string | string[];
	public override_texture_filter?: string

	private base_path: string = "";
	private main_file_name: string = "";
	private object_format: string = '.gltf';
	private scene: Group
	private texturePropNames: string[] = [
		"map"
	];

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
			case 'gltf': {
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

	private cache_scene(): void {
		ResourceManager.meshworks_cache[this.src] = this.scene;
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
				gltf_loader.load(this.main_file_name, (loaded_object) => {
					loaded_object.scene.traverse((child: Object3D) => {
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
					scene.add(loaded_object.scene);
					roughness_mipmapper.dispose();
					// render();

					this.scene = scene;
					// this.cache_scene();

					resolve();
				});
			}, 0)
		})
	}

}
