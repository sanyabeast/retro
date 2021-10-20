import * as THREE from 'three';
import { forEach } from "lodash-es";
import OBJLoader from 'three/examples/js/loaders/OBJLoader.js';
import FBXLoader from "three/examples/js/loaders/FBXLoader.js"

let obj_loader = new OBJLoader()
let fbx_loader = new FBXLoader()

class AssetBufferGeometry extends THREE.BufferGeometry {
    constructor(src = "", scale = 1) {
        super(...arguments);
        let type = src.split(".")
        type = type[type.length - 1]
        switch (type) {
            case "obj": {
                obj_loader.load(
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
