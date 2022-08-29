import { BufferGeometry, BoxBufferGeometry, Group, BufferAttribute, Mesh } from 'three';
import { forEach, map, isArray } from "lodash-es";
import OBJLoader from 'three/examples/js/loaders/OBJLoader.js';
import FBXLoader from "three/examples/js/loaders/FBXLoader.js"
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

let obj_loader = new OBJLoader()
let fbx_loader = new FBXLoader()

let obj_cache = {}

class AssetBufferGeometry extends BufferGeometry {
    constructor(src = "", scale = 1) {
        super(...arguments);
        let type = src.split(".")
        type = type[type.length - 1]
        switch (type) {
            case "obj": {
                let g = new BoxBufferGeometry()
                if (obj_cache[src]) {
                    g = obj_cache[src].clone()
                } else {
                    setTimeout(() => {
                        obj_loader.load(
                            src,
                            (object) => {
                                console.log(`LOADED ASSET-GEOMETRY ${src}`, object)
                                let g = new BufferGeometry()
                                if (object instanceof Group) {
                                    if (object.children.length > 1) {
                                        let geometries = []
                                        object.children.forEach(child => {
                                            if (child instanceof Mesh) {
                                                let position_attr = child.geometry.getAttribute("position")
                                                let count = position_attr.count
                                                if (child.geometry.attributes["uv"] === undefined) {
                                                    child.geometry.setAttribute("uv", new BufferAttribute(new Float32Array(count * 2), 2))
                                                }
                                                if (child.geometry.attributes["normal"] === undefined) {
                                                    child.geometry.setAttribute("normal", new BufferAttribute(new Float32Array(count * 3), 3))
                                                }
                                                geometries.push(child.geometry)
                                            }
                                        })
                                        let merged_geometry = BufferGeometryUtils.mergeBufferGeometries(geometries, true)
                                        for (let k in merged_geometry) {
                                            g[k] = merged_geometry[k]
                                        }
                                    } else {
                                        g = object.children[0].geometry
                                        let materials_order = undefined
                                        if (isArray(object.children[0].material)) {
                                            materials_order = map(object.children[0].material, (mat) => {
                                                return mat.name
                                            })
                                        }
                                        g.materials_order = materials_order
                                    }
                                } else if (object instanceof Mesh) {
                                    g = object.geometry.clone()
                                }

                                obj_cache[src] = g

                                for (let k in g) {
                                    this[k] = g[k]
                                }

                                setTimeout(() => {
                                    this.scale(scale, scale, scale)
                                })

                            }
                        );
                    })
                }

                for (let k in g) {
                    this[k] = g[k]
                }

                break;
            }
            case "fbx": {
                fbx_loader.load(
                    src,
                    (object) => {
                        if (object instanceof Group) {
                            if (object.children && object.children[0] && object.children[0] instanceof Mesh) {
                                for (let k in object.children[0].geometry) {
                                    this[k] = object.children[0].geometry[k]
                                }
                            }
                        } else if (object instanceof Mesh) {
                            for (let k in object.geometry) {
                                this[k] = object.geometry[k]
                            }
                        }

                        this.scale(scale, scale, scale)
                    }
                );
                break;
            }
        }

    }

}

export default AssetBufferGeometry;
