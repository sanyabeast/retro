import * as THREE from 'three';
import { forEach } from "lodash-es";

class HexCellBorderBufferGeometry extends THREE.RingBufferGeometry {
    indexes = [
        [0,  2,  14, 16],
        [3,  5,  17, 19],
        [4,  6,  18, 20],
        [7,  9,  21, 23],
        [8,  10, 22, 24],
        [11, 13, 25, 27]
    ];
    borders = null;
    constructor() {
        super(...arguments);
        this.add_attribute("border_state", 14, 1);
    }
    set_borders(borders) {
        if (true || this.borders !== borders.join("/")) {
            this.borders = borders.join("/");
            for (let b = 0; b < 28; b++) {
                this.set_attrs(b, {
                    border_state: [0],
                });
            }
            for (let a = 0; a < 6; a++) {
                if (borders.indexOf(a) > -1) {
                    this.indexes[a].forEach((i) => {
                        this.set_attrs(i, {
                            border_state: [1],
                        });
                    });
                }
            }

            this.set_attributes_needs_update(true)
        }
    }
}

export default HexCellBorderBufferGeometry;
