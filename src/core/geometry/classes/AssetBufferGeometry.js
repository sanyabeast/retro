import * as THREE from 'three';
import { forEach } from "lodash-es";
import OBJLoader from 'three/examples/js/loaders/OBJLoader.js';
import FBXLoader from "three/examples/js/loaders/FBXLoader.js"

let obj_loader = new OBJLoader()
let fbx_loader = new FBXLoader()

let obj_cache = {}

class AssetBufferGeometry extends THREE.BufferGeometry {
    constructor(src = "", scale = 1) {
        super(...arguments);
        let type = src.split(".")
        type = type[type.length - 1]
        switch (type) {
            case "obj": {
                if (obj_cache[src]) {
                    let g = obj_cache[src].clone()
                    for (let k in g) {
                        this[k] = g[k]
                    }

                }
                obj_loader.load(
                    src,
                    (object) => {

                        let g
                        if (object instanceof THREE.Group) {
                            if (object.children && object.children[0] && object.children[0] instanceof THREE.Mesh) {
                                g = obj_cache[src] = object.children[0].geometry.clone()

                            }
                        } else if (object instanceof THREE.Mesh) {
                            g = obj_cache[src] = object.geometry.clone()
                            for (let k in g) {
                                this[k] = g[k]
                            }
                        }

                        for (let k in g) {
                            this[k] = g[k]
                        }

                        console.log(src, object, g)

                        this.scale(scale, scale, scale)

                    }
                );
                break;
            }
            case "fbx": {
                fbx_loader.load(
                    src,
                    (object) => {
                        if (object instanceof THREE.Group) {
                            if (object.children && object.children[0] && object.children[0] instanceof THREE.Mesh) {
                                for (let k in object.children[0].geometry) {
                                    this[k] = object.children[0].geometry[k]
                                }
                            }
                        } else if (object instanceof THREE.Mesh) {
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
