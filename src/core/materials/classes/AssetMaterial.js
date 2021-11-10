import * as THREE from 'three';
import { request_text_sync, blend_colors } from 'core/utils/Tools';
import Device from 'core/utils/Device';
import { isNumber, isBoolean, map, keys, values, forEach, isString, isArray } from "lodash-es"
import ResourceManager from "core/ResourceManager"

const path = require("path")

const LQ_MAT = "MeshLambertMaterial"
const HQ_MAT = "MeshPhysicalMaterial"

function num(v) {
    return Number(v) || 0
}

function v3(arr) {
    return map(arr, v => num(v))
}

const mtl_props = {
    "newmtl": ["name"],
    "d": ["opacity"],
    "Kd": ["color"],
    "Ns": ["shininess"],
    "Ks": ["specular"],
    "Ka": ["reflectivity", "metalness"],
    "Ni": ["refractionRatio"],
    "map_d": ["alphaMap"],
    "map_Bump": ["normalMap", "bumpMap"],
    "map_Kd": ["map"],
    "map_Ks": ["specularMap"],
    "map_Ns": ["roughnessMap"],
    "map_Ke": ["emissiveMap"],
    "refl": ["metalnessMap"]
}

const mtl_map_props = [
    "map_d",
    "map_Bump",
    "map_Kd",
    "map_Ns",
    "map_Ke",
    "map_Ks",
    "refl"
]

class AssetMaterial extends THREE.Material {
    src = ""
    bump_scale = 0.001
    shininess = 10
    displacement_scale = 0.01
    doubleside = false
    constructor(params) {
        super(params)
        let src = this.src = params.src
        this.bump_scale = isNumber(params.bump_scale) ? params.bump_scale : 0.0001
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
        let ResourceManager = AssetMaterial.ResourceManager
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
            let parsed_props = keys(mtl_props)
            let parsed_data = {}
            parsed_props.forEach(p => {
                let parsed_line = parse_line(chunk_line(p, block_data))
                parsed_data[p] = parsed_line
            })
            let result = {}
            forEach(parsed_data, (data, key) => {
                let pbr_props = mtl_props[key]
                let v = data
                if (Array.isArray(v)) {
                    if (v.length === 1) {
                        if (!isNaN(parseFloat(v[0]))) {
                            v = num(v[0])
                        } else {
                            v = v[0]
                        }
                    } else if (v.length === 3) {
                        switch (key) {
                            case "Ka": {
                                v = num(v[0]) / 2
                                break
                            }
                            case "d": {
                                v = num(v[0])
                                break
                            }
                            default: {
                                v = new THREE.Color(...v3(v))
                            }
                        }

                    }
                }

                if (isString(v) && mtl_map_props.indexOf(key) > -1) {
                    v = path.basename(v.replace(/\\\\/gm, "/"))
                    v = `${asset_dir}/maps/${v}`
                    if (v.indexOf("?") > -1) {
                        v += "&wrapS=1000&wrapT=1000"
                    } else {
                        v += "?wrapS=1000&wrapT=1000"
                    }
                }


                forEach(pbr_props, (prop_name) => {
                    result[prop_name] = v
                })

                if (result.emissiveMap !== undefined) {
                    result.emissiveIntensity = 1
                    result.emissive = new THREE.Color(0xFFFFFF)
                }
            })
            forEach(result, (v, k) => {
                if (v === undefined) {
                    delete result[k]
                }
            })
            console.log(asset_dir, result)
            return result
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
            let r = block_data.match(new RegExp(`^${id}.*`, "gm"))
            if (Array.isArray(r)) {
                return r[0]
            } else {
                return undefined
            }
        }
        blocks.forEach(b => {
            let material_layers = []
            let material_type = Device.is_mobile ? LQ_MAT : HQ_MAT
            let block_data = parse_block(b)

            if (block_data.color) {
                block_data.color.set_any(blend_colors("multiply", block_data.color, this.color, "array"))
            }

            if (block_data.emissive && this.emissive_color) {
                block_data.emissive.set_any(blend_colors("multiply", block_data.emissive, this.emissive_color, "array"))
            }

            if (block_data.emissiveIntensity !== undefined) {
                block_data.emissiveIntensity *= this.emissive_intensity
            }

            if (this.use_map_as_alphamap) {
                block_data.alphaMap = block_data.map
            }

            if (block_data.opacity && block_data.opacity < 1 || block_data.alphaMap !== undefined) {
                block_data.transparent = true
            }

            block_data.bumpScale = 0.0005
            if (block_data.shininess !== undefined ||
                block_data.specular !== undefined ||
                block_data.specularMap !== undefined ||
                block_data.refractionRatio !== undefined ||
                block_data.reflectivity !== undefined) {
                let rmat = new THREE.MeshPhongMaterial({
                    ...block_data,
                    color: 0x000000,
                    userData: {
                        layer_name: "phong"
                    }
                })
                rmat.blending = 2;
                material_layers.push(rmat)
            }
            let mat = new THREE.materials[material_type](block_data)
            if (material_layers.length > 0) {
                mat.material_layers = material_layers
            }

            r.push(mat)

        })

        return r
    }

}

export default AssetMaterial