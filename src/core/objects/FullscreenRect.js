
/* created by @sanyabeast 8/14/2021 1:31:45 AM
 *
 *
*/


import * as THREE from 'three';

class FullscreenRect extends THREE.Mesh {
    constructor(params) {
        params = {
            map: undefined,
            alphaMap: undefined,
            ...params
        }
        let geometry = new THREE.PlaneBufferGeometry(1, 1, 1)
        let material = new THREE.ShaderMaterial({
            vertexShader: `
                attribute vec3 postion;
                varying vec2 vUv;
                void main(){
                    vUv =  uv;
                    gl_Position = vec4(position * 2., 1.);
                }
            `,
            fragmentShader: `
                varying vec2 vUv;
                uniform sampler2D map;
                uniform sampler2D alphaMap;
                void main(){
                    vec4 color = texture2D(map, vUv);
                    vec4 a_color = texture2D(alphaMap, vUv);
                    gl_FragColor = vec4(color.xyz, a_color.r * a_color.w);
                }
            `,
            uniforms: {
                map: {
                    value: params.map,
                    type: "t"
                },
                alphaMap: {
                    value: params.alphaMap,
                    type: "t"
                }
            },
            transparent: params.alphaMap !== undefined
        })
        super(geometry, material)
        this.frustumCulled = false
    }
    on_tick(time_stats) {

    }
}

export default FullscreenRect