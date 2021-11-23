import * as THREE from 'three';
import { forEach } from "lodash-es";

class HexCellBodyBufferGeometry extends THREE.CircleBufferGeometry {
    constructor() {
        super(...arguments);
    }
}

export default HexCellBodyBufferGeometry;
