import { WebGLBackground } from "retro/lib/three/src/renderers/webgl/WebGLBackground"
import { ShaderLib } from "retro/lib/three/src/renderers/shaders/ShaderLib"
import { Color } from "../lib/three/src/math/Color";

export default function(rm){
    console.log(ShaderLib)

    ShaderLib.cube.fragmentShader = `
        #include <envmap_common_pars_fragment>
        uniform float opacity;
        uniform float brightness;
        uniform vec3 tint;
        
        varying vec3 vWorldDirection;
        
        #include <cube_uv_reflection_fragment>
        
        void main() {
        
            vec3 vReflect = vWorldDirection;
            #include <envmap_fragment>
        
            gl_FragColor = envColor;
            gl_FragColor.xyz *= tint * brightness;
            gl_FragColor.a *= opacity;
        
            #include <tonemapping_fragment>
            #include <encodings_fragment>
        
        }
    `;

    ShaderLib.cube.uniforms.tint = {
        value: new Color(1, 1, 1)
    }

    ShaderLib.cube.uniforms.brightness = {
        value: 1
    }
}