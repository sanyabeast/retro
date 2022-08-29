
import Device from 'retro/utils/Device';
import { isNumber } from "lodash-es"
import { MeshPhysicalMaterial, MeshLambertMaterial, Color, MeshPhongMaterial, Vector2, MeshBasicMaterial } from "three"

const LQ_MAT = "MeshLambertMaterial"
const HQ_MAT = "MeshPhysicalMaterial"


function setup_pbr(params) {
    this.material_layers = this.material_layers || []
    let repeat = new Vector2(1, 1)
    if (typeof params.tiling === "number") {
        repeat.set(params.tiling, params.tiling)
    } else if (Array.isArray(params.tiling)) {
        repeat.set(params.tiling[0] || 0, params.tiling[1] || 0)
    } else if (typeof params.tiling === "object" && typeof params.tiling.y === "number") {
        repeat.set(params.tiling.x, repeat.tiling.y)
    }
    this.file_format = params.file_format || "jpg"
    this.color = new Color(params.color)
    this.pbr = params.pbr || ""
    this.map = `${this.pbr}_c.${this.file_format}?wrapS=1000&wrapT=1000&repeat.x=${repeat.x}&repeat.y=${repeat.y}`
    // this.alphaMap = `${this.pbr}_c.${this.file_format}?wrapS=1000&wrapT=1000&repeat.x=${repeat.x}&repeat.y=${repeat.y}`
    this.aoMap = `${this.pbr}_ao.${this.file_format}?wrapS=1000&wrapT=1000&repeat.x=${repeat.x}&repeat.y=${repeat.y}`
    this.normalMap = `${this.pbr}_n.${this.file_format}?wrapS=1000&wrapT=1000&repeat.x=${repeat.x}&repeat.y=${repeat.y}`
    this.roughnessMap = `${this.pbr}_r.${this.file_format}?wrapS=1000&wrapT=1000&repeat.x=${repeat.x}&repeat.y=${repeat.y}`
    this.metalnessMap = `${this.pbr}_m.${this.file_format}?wrapS=1000&wrapT=1000&repeat.x=${repeat.x}&repeat.y=${repeat.y}`
    this.reflectivityMap = `${this.pbr}_m.${this.file_format}?wrapS=1000&wrapT=1000&repeat.x=${repeat.x}&repeat.y=${repeat.y}`
    this.displacementMap = `${this.pbr}_h.${this.file_format}?wrapS=1000&wrapT=1000&repeat.x=${repeat.x}&repeat.y=${repeat.y}`
    this.bumpMap = `${this.pbr}_h.${this.file_format}?wrapS=1000&wrapT=1000&repeat.x=${repeat.x}&repeat.y=${repeat.y}`
    this.emissiveMap = `${this.pbr}_e.${this.file_format}?wrapS=1000&wrapT=1000&repeat.x=${repeat.x}&repeat.y=${repeat.y}`
    this.bumpScale = typeof params.bumpScale === "number" ? params.bumpScale : 1
    this.reflectivity = isNumber(params.reflectivity) ? params.reflectivity : 0.2
    this.displacementScale = -0.001
    this.metalness = isNumber(params.metalness) ? params.metalness : 0.5
    this.roughness = isNumber(params.roughness) ? params.roughness : 1
    this.specular = new Color(1, 1, 1)
    this.emissive = new Color(1, 1, 1)

    if (PRESET.PBR_LEVEL > 0) {
        this.material_layers.push(
            new MeshPhongMaterial({
                shininess: 1,
                color: new Color(0, 0, 0),
                map: this.map,
                metalness: this.metalness,
                roughness: this.roughness,
                specular: this.specular,
                emissive: this.emissive,
                normalMap: this.normalMap,
                roughnessMap: this.roughnessMap,
                metalnessMap: this.metalnessMap,
                reflectivityMap: this.metalnessMap,
                bumpMap: this.bumpMap,
                emissiveMap: this.emissiveMap,
                emissiveMap: this.emissiveMap,
                bumpScale: this.bumpScale,
                reflectivity: this.reflectivity,
                blending: 2,
                transparent: true,
                userData: {
                    layer_name: "phong"
                }
            })
        )
    }

    if (PRESET.PBR_LEVEL > 1) {
        this.material_layers.push(
            new MeshBasicMaterial({
                color: new Color(0, 0, 0),
                alphaMap: `${this.pbr}_ao.${this.file_format}?wrapS=1000&wrapT=1000&repeat.x=${repeat.x}&repeat.y=${repeat.y}&maxsize=1024&filter=[invert]`,
                opacity: 1,
                transparent: true,
                blending: 1,
                userData: {
                    layer_name: "ao"
                }
            }),
        )
    }
}

const PBRMaterial = class PBRMaterial extends MeshPhysicalMaterial {
    file_format = "png"
    pbr = ""
    constructor(params) {
        super(params)
        setup_pbr.call(this, params)
    }
}

export default PBRMaterial