import * as THREE from 'three';
import { request_text_sync } from 'core/utils/Tools';
import Device from 'core/utils/Device';
const path = require("path")

const LQ_MAT = "MeshLambertMaterial"
const HQ_MAT = "MeshStandardMaterial"


class AssetMaterial extends THREE.Material {
    src = ""
    bump_scale = 0.001
    shininess = 10
    displacement_scale = 0.01
    doubleside = false
    constructor(params) {
        super(params)
        let src = this.src = params.src
        this.bump_scale = params.bump_scale || 0.001
        this.displacement_scale = params.displacement_scale || 0.01
        this.shininess = params.shininess || 16
        this.doubleside = params.doubleside || false
        this.color = params.color || "#ffffff"
        let r = []


        let type = src.split(".")
        type = type[type.length - 1]
        switch (type) {
            case "mtl": {
                // r.push(new THREE.MeshStandardMaterial({color: "#ff0000"}))
                let mtl_data = request_text_sync(params.src)
                let materials = this.parse_mtl(mtl_data, src)
                console.log(src, materials)
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
            let parsed_props = ['newmtl', "Ns", "Ka", "Kd", "Ks", "Ke", "Ni", "d", "illum", "map_Bump", "map_Kd", "map_d", "map_Ns", "refl"]
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
            let block_data = parse_block(b)
            // console.log(block_data)
            let material_params = {}
            if (block_data.newmtl) {
                material_params.name = block_data.newmtl[0]
            }

            console.log(b, block_data)
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
                material_params.specularMap = `${src}?wrapS=1000&wrapT=1000`
                material_params.roughnessMap = `${src}?wrapS=1000&wrapT=1000`
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
                material_params.transparent = true
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
                material_params.color = new THREE.Color(Number(block_data.Ka[0] || 0), Number(block_data.Ka[1] || 0), Number(block_data.Ka[2] || 0))
            }
            if (block_data.Kd) {
                material_params.color = new THREE.Color(Number(block_data.Kd[0] || 0), Number(block_data.Kd[1] || 0), Number(block_data.Kd[2] || 0))
            }
            if (block_data.Ke) {
                material_params.emissive = new THREE.Color(Number(block_data.Ke[0] || 0), Number(block_data.Ke[1] || 0), Number(block_data.Ke[2] || 0))
            }
            if (block_data.Ks) {
                material_params.specular = new THREE.Color(Number(block_data.Ks[0] || 0), Number(block_data.Ks[1] || 0), Number(block_data.Ks[2] || 0))
            }
            if (block_data.Ns) {
                material_params.shininess = Number(block_data.Ns[0]) * (this.shininess / 1000)
            }
            if (block_data.Ni) {
                material_params.refractionRatio = Number(block_data.Ni[0] || 0)
            }


            material_params.color = this.color
            material_params.reflectivity = 1
            // material_params.normalMapType = THREE.ObjectSpaceNormalMap
            let mat = new THREE.materials[Device.is_mobile ? LQ_MAT : HQ_MAT](material_params)
            r.push(mat)

        })




        return r
    }

}

export default AssetMaterial