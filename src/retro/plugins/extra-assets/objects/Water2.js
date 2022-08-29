import { Vector3, CircleBufferGeometry, PlaneBufferGeometry } from 'three';
import { Water as TWater } from 'three/examples/jsm/objects/Water2.js';
import ResourceManager from "retro/ResourceManager"
import { isNumber } from "lodash-es"

class Water extends TWater {
    constructor(options = {}) {
        options = {
            textureWidth: 1024,
            textureHeight: 1024,
            scale: 1000,
            width: 100,
            height: 100,
            radius: 50,
            segments: 32,
            geometry: "plane",
            reflectivity: 0.1,
            normalMap0: ResourceManager.load_texture("res/retro/Water_1_M_Normal.jpg"),
            normalMap1: ResourceManager.load_texture("res/retro/Water_1_M_Normal.jpg"),
            sunDirection: new Vector3(),
            sunColor: 0xffffff,
            waterColor: 0x001e0f,
            distortionScale: 1.7,
            fog: true,
            ...options
        }

        let geometry = undefined

        switch (options.geometry) {
            case "cicle":
                geometry = new CircleBufferGeometry(options.radius, options.segments).rotateX(-Math.PI / 2)
                break;
            case "plane":
                geometry = new PlaneBufferGeometry(options.width, options.height).rotateX(-Math.PI / 2)
                break
            default:
                break;
        }



        super(geometry, options)
    }
}

export default Water