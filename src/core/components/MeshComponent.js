/* created by @sanyabeast 8/14/2021 1:31:45 AM
 *
 *
 */

import * as THREE from 'three';
import AssetManager from "core/utils/AssetManager";
import TransformComponent from "core/TransformComponent";
import { set, get } from "lodash-es"

class MeshComponent extends TransformComponent {
    mesh = null;
    tick_skip = 1
    drop_shadow = true
    recieve_shadow = false
    on_created() {
        let mesh = this.subject = MeshComponent.create_mesh({
            geometry: this.geometry,
            material: this.material,
            geometry_translation: this.geometry_translation
        })

        mesh.castShadow = this.drop_shadow
        mesh.receiveShadow = this.recieve_shadow

    }

    static create_mesh(params) {
        let geometry = params.geometry
            ? MeshComponent.create_geometry(params.geometry)
            : undefined;
        let material = params.material
            ? MeshComponent.create_material(params.material)
            : undefined;


        let mesh = new THREE.Mesh(geometry, material);

        if (params) {
            if (params.geometry_translation) {
                mesh.geometry.translate(...params.geometry_translation)
            }
        }


        return mesh
    }

    get_render_data() {
        if (this.enabled) {
            return {
                object: this.subject,
                parent: this.object
            }
        }
    }

    get_reactive_props() {
        return [
            "drop_shadow",
            "recieve_shadow"
        ].concat(super.get_reactive_props())
    }

    on_update(props) {
        super.on_update(...arguments)
        props.forEach(prop => {
            switch (prop) {
                case "drop_shadow": {

                    this.subject.castShadow = this.drop_shadow
                    break
                }
                case "recieve_shadow": {
                    this.subject.receiveShadow = this.recieve_shadow
                }
            }
        })
    }

    on_enabled() {
        this.globals.need_update_render_list = true
    }

    on_disabled() {
        this.globals.need_update_render_list = true
    }

    on_destroy() {
        super.on_destroy()
        // this.object.remove(this.subject);
        // this.globals.need_update_render_list = true
    }

    static create_geometry(params, id) {
        return AssetManager.create_geometry(params[0], params[1], id);
    }

    static create_material(params, id) {
        return AssetManager.create_material(params[0], params[1], id);
    }


    uniform(name) {
        return this.subject.material.uniforms[name]
    }
    get uniforms() {
        return this.subject.material.uniforms
    }
}

export default MeshComponent;
