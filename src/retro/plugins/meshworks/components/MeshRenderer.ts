


import SceneComponent from "retro/SceneComponent";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoughnessMipmapper } from 'three/examples/jsm/utils/RoughnessMipmapper.js';
import path from "path"
import { Event, Group, Mesh, MeshStandardMaterial, Object3D, WebGLRenderer } from "three";
import { isArray, isNil, isString } from "lodash";

const gltf_loader = new GLTFLoader()
// const roughnessMipmapper = new RoughnessMipmapper( renderer );

export class MeshRenderer extends SceneComponent {

	public src: string = "";
	public recieve_shadow: boolean = true
	public cast_shadow: boolean = true
	public normal_scale: number = 1
	public bump_scale: number = 1
	public emission_scale: number = 1
	public hide_object?: string | string[];


	private base_path: string = "";
	private main_file_name: string = "";
	private object_format: string = '.gltf';
	private scene: Group

	override on_create(): void {
		console.log(this)
	}

	public override get_reactive_props(): string[] {
		return [
			'src',
			...super.get_reactive_props()
		]
	}

	override get_render_data(): IComponentRenderDataItem[] {
		return [{
			object: this.scene,
			parent: this.game_object
		}]
	}

	override on_update(props: string[], scene?: Object3D<Event>): void {
		super.on_update(props, this.scene)
	}

	public override on_change(prop_name: string, value: any): void {
		switch (prop_name){
			case 'src': {
				this.base_path = `${path.dirname(this.src)}/`
				this.main_file_name = path.basename(this.src);
				this.object_format =path.extname(this.src).replace(/\./, '');

				this.load_object();
			}
		}
	}

	private async load_object(): Promise<void> {
		switch (this.object_format){
			case 'gltf': {
				await this.load_object_gltf();
			}
		}

		this.force_update([
			'scale',
			'position',
			'rotation'
		])
	}

	private load_object_gltf(): Promise<void> {
		gltf_loader.setPath(this.base_path);
		let scene: Group = new Group();
			let renderer: WebGLRenderer = this.globals.renderer;
			let roughness_mipmapper: RoughnessMipmapper

			if (!isNil(renderer)){
				roughness_mipmapper = new RoughnessMipmapper( renderer );
			}

		return new Promise((resolve: Function, reject: Function)=>{
			gltf_loader.load( this.main_file_name, ( loaded_object )=>{
				loaded_object.scene.traverse( ( child: Object3D )=>{
					if (!isNil(roughness_mipmapper) && (child as Mesh).isMesh){
						roughness_mipmapper.generateMipmaps( (child as Mesh).material );
					}

					if ((child as Mesh).isMesh){
						let mesh: Mesh = child as Mesh
						mesh.receiveShadow = this.recieve_shadow;
						mesh.castShadow = this.cast_shadow;
						let mat = mesh.material as MeshStandardMaterial
						mat.normalScale.x *= this.normal_scale
						mat.normalScale.y *= this.normal_scale
						mat.bumpScale * this.bump_scale
						mat.emissiveIntensity *= this.emission_scale
					}

					if (isString(this.hide_object) && this.hide_object === child.name){
						child.visible = false
					}

					if (isArray(this.hide_object) && this.hide_object.indexOf(child.name) > -1){
						child.visible = false
					}
				});
				scene.add( loaded_object.scene );
				roughness_mipmapper.dispose();
				// render();

				this.scene = scene;

				resolve();
			}); 
		})
	}

}
