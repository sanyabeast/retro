import * as THREE from 'three';
import { forEach } from "lodash-es";

class ArrowABufferGeometry extends THREE.BufferGeometry {
    constructor(segments = 32) {
        super(...arguments);
        let vertices = [];
        let normals = [];
        let uvs = [];
        let indices = []
        let arcs = []
        let segment_indexes = []
        let edge_types = []
        let vertex = new THREE.Vector3();
        let uv = new THREE.Vector2();
        
        let size = 0.25

        for (let p = 0; p < segments; p++){
            let progress = (p/(segments - 1))
            let progress_b = (p/(segments))
            let arc_value = p < (segments/2) ? (p/(segments/2))/2 : 1-((p/(segments/2))/2)
            /*triangle a*/
            vertices.push(0, 0, 0)
            vertices.push(0, 0, 0)

            edge_types.push(0,  1)
            arcs.push(arc_value, arc_value)
            
            uvs.push(progress_b, 0)
            uvs.push(progress_b, 1)

            segment_indexes.push(progress, progress)
        }

        vertices.push(0, 0, 0)
        vertices.push(0, 0, 0)
        vertices.push(0, 0, 0)

        edge_types.push(4, 2, 3)
        arcs.push(0, 0, 0)
        uvs.push(1, 0.5)
        segment_indexes.push(1, 1, 1)
        uvs.push((segments-1)/segments, 1)
        uvs.push((segments-1)/segments, -1)

        let last_index = 0
        for (let p = 0; p < segments - 1; p++){
            let a = p * 2
            let b = p * 2 + 1
            let c = (p + 1) * 2
            let d = (p + 1) * 2 + 1
            last_index = Math.max(last_index, a, b, c, d)
            indices.push(b, a, c)
            indices.push(b, c, d)
        }


        indices.push(last_index + 3, last_index + 2, last_index + 1)


        this.setIndex(indices)
        this.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        this.setAttribute('edge_type', new THREE.Float32BufferAttribute(edge_types, 1));
        this.setAttribute('arc', new THREE.Float32BufferAttribute(arcs, 1));
        this.setAttribute('segment_index', new THREE.Float32BufferAttribute(segment_indexes, 1));
        // this.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        this.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

        this.set_attributes_needs_update(true)
    }
    
}

export default ArrowABufferGeometry;
