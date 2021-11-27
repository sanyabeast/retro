/* created by @sanyabeast 8/14/2021 1:31:45 AM
 *
 *
 */

import { Mesh, Material, Color } from 'three';
import ResourceManager from "retro/ResourceManager";
import SceneComponent from "retro/SceneComponent";
import { set, get, isString, isFunction, isArray, isNumber } from "lodash-es"
import { log, error, console } from "retro/utils/Tools"

class MeshComponent extends SceneComponent {
    mesh = null;
    cast_shadow = true
    recieve_shadow = true
    class = undefined
    tick_rate = 5
    on_create() {
        let mesh = undefined

        /**readymade objects stored in /objects/ directory of both app and core */
        if (isString(this.class)) {
            mesh = this.subject = ResourceManager.create_object(this.class, this.options)
            console.log(this, mesh)
        } else {
            mesh = this.subject = MeshComponent.create_mesh({
                geometry: this.geometry,
                material: this.material,
                geometry_translation: this.geometry_translation
            })
        }
        if (!mesh) {
            this.error(`Cannot create mesh with provided options`, this.meta.params)
        } else {

            mesh.castShadow = this.cast_shadow
            mesh.receiveShadow = this.recieve_shadow
        }

        this.check_materials_sorting()
    }
    static create_mesh(params) {
        let geometry = params.geometry
            ? MeshComponent.create_geometry(params.geometry)
            : undefined;
        let material = params.material
            ? MeshComponent.create_material(params.material)
            : undefined;

        let mesh = new Mesh(geometry, material);

        if (params) {
            if (params.geometry_translation) {
                mesh.geometry.translate(...params.geometry_translation)
            }
        }

        return mesh
    }
    on_tick() {
        this.check_materials_sorting()
    }
    check_materials_sorting() {
        if (isArray(this.subject.material) && !this.subject.material.sorted && isArray(this.subject.geometry.materials_order)) {
            let new_materials = []
            let materials_dict = {}
            this.subject.material.forEach(mat => materials_dict[mat.name] = mat)
            this.subject.geometry.materials_order.forEach(name => {
                new_materials.push(materials_dict[name])
            })

            this.subject.material = new_materials;
            this.subject.material.sorted = true
        }

    }
    get_render_data() {
        return [{
            object: this.subject,
            parent: this.game_object
        }]
    }
    get_reactive_props() {
        return [
            "cast_shadow",
            "recieve_shadow"
        ].concat(super.get_reactive_props())
    }
    on_update(props) {
        super.on_update(...arguments)
        props.forEach(prop => {
            switch (prop) {
                case "cast_shadow": {
                    this.subject.castShadow = this.cast_shadow
                    break
                }
                case "recieve_shadow": {
                    this.subject.receiveShadow = this.recieve_shadow
                }
            }
        })
    }
    on_enable() {
        this.globals.need_update_render_list = true
    }
    on_disable() {
        this.globals.need_update_render_list = true
    }
    on_destroy() {
        super.on_destroy(...arguments)
        // this.object.remove(this.subject);
        // this.globals.need_update_render_list = true
    }
    static create_geometry(params, id) {
        return ResourceManager.create_geometry(params[0], params[1], id);
    }
    static create_material(params, id) {
        return ResourceManager.create_material(params[0], params[1], id);
    }
    uniform(name) {
        return this.subject.material.uniforms[name]
    }
    get uniforms() {
        return this.subject.material.uniforms
    }
    _set_material_param(material, param_name, param_value) {
        let current_value = material[param_name]
        switch (true) {
            case isNumber(current_value): {
                material[param_name] = param_value
                break;
            }
            case (current_value instanceof Color): {
                material[param_name].set_any(param_value)
                break
            }
        }
    }
    set_material_param(name, value, params = { layer: undefined, first_only: false }) {
        if (this.subject) {
            if (isArray(this.subject.material)) {
                this.subject.material.forEach((material, index) => {
                    if (index > 0 && params.first_only) return
                    if (params.layer === undefined || params.all_layers === true) {
                        this._set_material_param(material, name, value)
                    }

                    if (isArray(material.material_layers)) {
                        material.material_layers.forEach(material => {
                            let layer_name = material.userData.layer_name
                            if (params.all_layers === true || params.layer === layer_name) {
                                this._set_material_param(material, name, value)
                            }
                        })
                    }
                })
            } else if (this.subject.material instanceof Material) {
                let material = this.subject.material_layers
                if (params.layer === undefined || params.all_layers === true) {
                    this._set_material_param(material, name, value)
                }

                if (isArray(material.material_layers)) {
                    material.material_layers.forEach(material => {
                        let layer_name = material.userData.layer_name
                        if (params.all_layers === true || params.layer === layer_name) {
                            this._set_material_param(material, name, value)
                        }
                    })
                }
            }
        }
    }
}

export default MeshComponent;
