import * as THREE from 'three';
import { request_text_sync, blend_colors } from 'core/utils/Tools';
import Device from 'core/utils/Device';
import { isNumber, isBoolean, map } from "lodash-es"
const path = require("path")

const LQ_MAT = "MeshLambertMaterial"
const HQ_MAT = "MeshStandardMaterial"

function num(v) {
    return Number(v) || 0
}

function v3(arr) {
    return map(arr, v => num(v))
}

class AssetMaterial extends THREE.Material {
    src = ""
    bump_scale = 0.001
    shininess = 10
    displacement_scale = 0.01
    doubleside = false
    constructor(params) {
        super(params)
        let src = this.src = params.src
        this.bump_scale = isNumber(params.bump_scale) ? params.bump_scale : 0.001
        this.displacement_scale = isNumber(params.displacement_scale) ? params.displacement_scale : 0.01
        this.shininess = isNumber(params.shininess) ? params.shininess : 16
        this.doubleside = params.doubleside || false
        this.color = params.color || "#ffffff"
        this.allow_transparency = isBoolean(params.allow_transparency) ? params.allow_transparency : true
        this.emissive_color = params.emissive_color || undefined

        this.emissive_intensity = isNumber(params.emissive_intensity) ? params.emissive_intensity : 1
        let r = []


        let type = src.split(".")
        type = type[type.length - 1]
        switch (type) {
            case "mtl": {
                let mtl_data = request_text_sync(params.src)
                let materials = this.parse_mtl(mtl_data, src)
                materials.forEach(m => r.push(m))
                materials.sorted = false
                break;
            }
        }

        if (r.length === 1) {
            return r[0]
        } else {
            return r
        }
    }
    parse_mtl(data, asset_src) {
        let r = []
        let asset_dir = path.dirname(asset_src)
        let blocks = []
        var regex = /newmtl.*/gmi, result, indices = [];
        while ((result = regex.exec(data))) {
            indices.push(result.index);
        }

        indices.forEach((i, index) => {
            let next_i = indices[index + 1] === undefined ? data.length : indices[index + 1]
            let b = data.substring(i, next_i)
            blocks.push(b)
        })

        function parse_block(block_data) {
            let parsed_props = ['newmtl', "Ns", "Ka", "Kd", "Ks", "Ke", "Ni", "d", "illum", "map_Bump", "map_Kd", "map_d", "map_Ns", "map_Ke", "refl"]
            let parsed_data = {}
            parsed_props.forEach(p => {
                let parsed_line = parse_line(chunk_line(p, block_data))
                parsed_data[p] = parsed_line
            })
            return parsed_data
        }


        function parse_line(line_data) {
            if (typeof line_data === "string") {
                let r = line_data.split(" ")
                r = r.slice(1, r.length)
                return r
            } else {
                return undefined
            }
        }
        function chunk_line(id, block_data) {
            let r = block_data.match(new RegExp(`${id}.*`))
            if (Array.isArray(r)) {
                return r[0]
            } else {
                return undefined
            }
        }
        blocks.forEach(b => {
            let material_type = Device.is_mobile ? LQ_MAT : HQ_MAT
            let block_data = parse_block(b)
            // console.log(block_data)
            let material_params = {}
            if (block_data.newmtl) {
                material_params.name = block_data.newmtl[0]
            }

            material_params.color = new THREE.Color()


            if (block_data.map_Ka) {
                let map_Ka = block_data.map_Ka[block_data.map_Ka.length - 1]
                let src = path.basename(map_Ka.replace(/\\\\/gm, "/"))
                src = `${asset_dir}/maps/${src}`
                material_params.map = `${src}?wrapS=1000&wrapT=1000`
            }
            if (block_data.map_Kd) {
                let map_Kd = block_data.map_Kd[block_data.map_Kd.length - 1]
                let src = path.basename(map_Kd.replace(/\\\\/gm, "/"))
                src = `${asset_dir}/maps/${src}`
                material_params.map = `${src}?wrapS=1000&wrapT=1000`
            }
            if (this.doubleside) {
                material_params.side = THREE.DoubleSide
            }
            if (block_data.map_Ns) {
                let map_Ns = block_data.map_Ns[block_data.map_Ns.length - 1]
                let src = path.basename(map_Ns.replace(/\\\\/gm, "/"))
                src = `${asset_dir}/maps/${src}`
                // material_params.specularMap = `${src}?wrapS=1000&wrapT=1000`
                material_params.roughnessMap = `${src}?wrapS=1000&wrapT=1000`
                material_params.roughness = 1
            }
            if (block_data.refl) {
                let refl = block_data.refl[block_data.refl.length - 1]
                let src = path.basename(refl.replace(/\\\\/gm, "/"))
                src = `${asset_dir}/maps/${src}`
                material_params.metalnessMap = `${src}?wrapS=1000&wrapT=1000`
                material_params.metalness = 1
            }
            if (block_data.map_Ke) {
                let map_Ke = block_data.map_Ke[block_data.map_Ke.length - 1]
                let src = path.basename(map_Ke.replace(/\\\\/gm, "/"))
                src = `${asset_dir}/maps/${src}`
                material_params.emissiveMap = `${src}?wrapS=1000&wrapT=1000`
            }
            if (block_data.map_d) {
                let map_d = block_data.map_d[block_data.map_d.length - 1]
                let src = path.basename(map_d.replace(/\\\\/gm, "/"))
                src = `${asset_dir}/maps/${src}`
                material_params.alphaMap = `${src}?wrapS=1000&wrapT=1000`
                material_params.transparent = this.allow_transparency === false ? false : true
                material_params.side = THREE.DoubleSide
            }
            if (block_data.map_Bump) {
                let map_Bump = block_data.map_Bump[block_data.map_Bump.length - 1]
                let src = path.basename(map_Bump.replace(/\\\\/gm, "/"))
                src = `${asset_dir}/maps/${src}`
                material_params.normalMap = `${src}?wrapS=1000&wrapT=1000`
                material_params.bumpMap = `${src}?wrapS=1000&wrapT=1000`
                material_params.bumpScale = this.bump_scale
            }
            if (block_data.map_Kd) {
                let map_Kd = block_data.map_Kd[block_data.map_Kd.length - 1]
                let src = path.basename(map_Kd.replace(/\\\\/gm, "/"))
                src = `${asset_dir}/maps/${src}`
                material_params.map = `${src}?wrapS=1000&wrapT=1000`
            }
            if (block_data.Ka) {
                material_params.color = new THREE.Color(...v3(block_data.Ka))
            }
            if (block_data.Kd) {
                if (block_data.Ka) {

                    material_params.color.set_any(
                        blend_colors(
                            "softLight",
                            v3(block_data.Kd),
                            v3(block_data.Ka),
                            "array"
                        )
                    )
                } else {
                    material_params.color = new THREE.Color(...v3(block_data.Kd))
                }

            }
            if (block_data.Ke && this.emissive_color === undefined) {
                let ke_color = v3(block_data.Ke)
                // console.log(ke_color, Math.max.apply(Math, ke_color))
                if (block_data.map_Ke) {
                    if (Math.max.apply(Math, ke_color) === 0) {
                        //@TODO: fix black emission color issue
                        material_params.emissive = new THREE.Color(1, 1, 1)
                    } else {
                        material_params.emissive = new THREE.Color(...ke_color)
                    }

                } else {
                    material_params.emissive = new THREE.Color(...ke_color)
                }
            }

            if (this.emissive_color !== undefined) {
                material_params.emissive = new THREE.Color()
                material_params.emissive.set_any(this.emissive_color)
            }

            if (block_data.Ks) {
                material_params.specular = new THREE.Color(...v3(block_data.Ks))
            }
            if (block_data.Ns) {
                material_params.shininess = num(block_data.Ns[0]) * (this.shininess / 1000)
            }
            if (block_data.Ni) {
                material_params.refractionRatio = 1
            }

            material_params.refractionRatio = 0.5
            material_params.reflectivity = 1
            material_params.ior = 0.5

            material_params.emissiveIntensity = this.emissive_intensity
            material_params.color.set_any(blend_colors("multiply", material_params.color, this.color, "array"))
            let mat = new THREE.materials[material_type](material_params)
            // mat.material_layers = [
            //     new THREE.MeshPhongMaterial({transparent: true, reflectivity: 0.4, refractionRatio: 0.8, ior: 0.5, blending: 2, opacity: 0.5, metalness: 0.5, roughness: 0, r})
            // ]
            r.push(mat)

        })

        return r
    }

}

export default AssetMaterial