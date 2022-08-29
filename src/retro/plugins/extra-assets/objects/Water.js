import { Vector3, DoubleSide, CircleBufferGeometry, PlaneBufferGeometry } from 'three';
import { Water as TWater } from 'three/examples/jsm/objects/Water.js';
import { isNumber } from "lodash-es"

class Water extends TWater {
    constructor(options = {}) {
        options = {
            textureWidth: 256,
            textureHeight: 256,
            width: 100,
            height: 100,
            radius: 50,
            segments: 32,
            side: DoubleSide,
            geometry: "plane",
            waterNormals: "res/retro/waternormals.jpg?wrapT=1000&wrapS=1000",
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