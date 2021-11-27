
/* created by @sanyabeast 8/14/2021 1:31:45 AM
 *
 *
*/


import { isNumber } from 'lodash-es';
import { PlaneBufferGeometry, ShaderMaterial, Mesh } from 'three';

class FullscreenRect extends Mesh {
    constructor(params) {
        params = {
            map: undefined,
            alphaMap: undefined,
            ...params
        }
        let geometry = new PlaneBufferGeometry(1, 1, 1)
        let material = new ShaderMaterial({
            vertexShader: `
                attribute vec3 postion;
                varying vec2 vUv;
                uniform float scale;
                void main(){
                    vUv =  uv;
                    gl_Position = vec4(position * 2. * scale, 1.);
                }
            `,
            fragmentShader: `
                varying vec2 vUv;
                uniform sampler2D map;
                uniform sampler2D alphaMap;
                uniform float opacity;
                void main(){
                    vec4 color = texture2D(map, vUv);
                    vec4 a_color = texture2D(alphaMap, vUv);
                    gl_FragColor = vec4(color.xyz, color.a * opacity);
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
                },
                scale: {
                    value: isNumber(params.scale) ? params.scale : 1,
                    type: "f"
                },
                opacity: {
                    value: isNumber(params.opacity) ? params.opacity : 1,
                    type: "f"
                }
            },
            transparent: params.alphaMap !== undefined || params.opacity < 1
        })
        super(geometry, material)
        this.frustumCulled = false
    }
    on_tick(time_stats) {

    }
}

export default FullscreenRect