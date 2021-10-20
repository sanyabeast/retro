import * as THREE from 'three';

function setup_pbr(params) {
    let repeat = new THREE.Vector2(1, 1)
    if (typeof params.tiling === "number") {
        repeat.set(params.tiling, params.tiling)
    } else if (Array.isArray(params.tiling)) {
        repeat.set(params.tiling[0] || 0, params.tiling[1] || 0)
    } else if (typeof params.tiling === "object" && typeof params.tiling.y === "number") {
        repeat.set(params.tiling.x, repeat.tiling.y)
    }
    this.file_format = params.file_format || "png"
    this.color = new THREE.Color(params.color)
    this.pbr = params.pbr || ""
    this.map = `${this.pbr}_c.${this.file_format}?wrapS=1000&wrapT=1000&repeat.x=${repeat.x}&repeat.y=${repeat.y}`
    this.aoMap = `${this.pbr}_ao.${this.file_format}?wrapS=1000&wrapT=1000&repeat.x=${repeat.x}&repeat.y=${repeat.y}`
    this.normalMap = `${this.pbr}_n.${this.file_format}?wrapS=1000&wrapT=1000&repeat.x=${repeat.x}&repeat.y=${repeat.y}`
    this.roughtnessMap = `${this.pbr}_r.${this.file_format}?wrapS=1000&wrapT=1000&repeat.x=${repeat.x}&repeat.y=${repeat.y}`
    this.metallnessMap = `${this.pbr}_m.${this.file_format}?wrapS=1000&wrapT=1000&repeat.x=${repeat.x}&repeat.y=${repeat.y}`
    this.bumpMap = `${this.pbr}_h.${this.file_format}?wrapS=1000&wrapT=1000&repeat.x=${repeat.x}&repeat.y=${repeat.y}`
    this.emissiveMap = `${this.pbr}_e.${this.file_format}?wrapS=1000&wrapT=1000&repeat.x=${repeat.x}&repeat.y=${repeat.y}`
}

class PBRMaterial extends THREE.MeshPhongMaterial {
    file_format = "png"
    pbr = ""
    constructor(params) {
        super(params)
        setup_pbr.call(this, params)
        // this.map = `${this.pbr}_c.${this.file_format}?wrapS=1000&wrapT=1000&repeat.x=${repeat.x}&repeat.y=${repeat.y}`

    }
}

export default PBRMaterial