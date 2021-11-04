
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import Component from "core/Component";
import ResourceManager from "core/ResourceManager";
import { render } from "less";
import * as THREE from 'three';
import Device from "core/utils/Device"
import { ShaderPass } from "core/lib/postprocessing/build/postprocessing.esm";

const BLOOM_TYPE = "default"
const postfx = require("core/lib/postprocessing").default

/* BLEND MODES
BlendFunction.SKIP
BlendFunction.ADD
BlendFunction.ALPHA
BlendFunction.AVERAGE
BlendFunction.COLOR_BURN
BlendFunction.COLOR_DODGE
BlendFunction.DARKEN
BlendFunction.DIFFERENCE
BlendFunction.EXCLUSION
BlendFunction.LIGHTEN
BlendFunction.MULTIPLY
BlendFunction.DIVIDE
BlendFunction.NEGATION
BlendFunction.NORMAL
BlendFunction.OVERLAY
BlendFunction.REFLECT
BlendFunction.SCREEN
BlendFunction.SOFT_LIGHT
BlendFunction.SUBTRACT
*/



class FFXEffect extends postfx.Effect {
    constructor({
        blendFunction = postfx.BlendFunction.NORMAL,
        hue = 0.0,
        saturation = 0.0
    } = {}) {
        let shader_code = ResourceManager.preprocess_shader_code(
            `
                
                #ifdef FRAMEBUFFER_PRECISION_HIGH
                    uniform highp sampler2D map;
                #else
                    uniform lowp sampler2D map;
                #endif
                uniform float sharpness_scale;
                uniform float contrast_kernel_radius;
                uniform float sharpness_kernel_radius;
                uniform float effect_power;
                uniform int contrast_kernel_azimuth_steps;
                uniform int contrast_kernel_polar_steps;
                

                #import core.blending

                vec4 get_texel(sampler2D map, vec2 uv, float step, float x, float y){
                    return texture2D(map, vec2(uv.x + step * x, uv.y + step * y));
                }
                vec4 get_sharpen_color2(vec2 uv, float scale){
                    int steps_i = contrast_kernel_azimuth_steps;
                    int steps_k = contrast_kernel_polar_steps;
                    float radius = 0.1 * sharpness_kernel_radius * scale;
                    vec4 sib_color = vec4(0., 0., 0., 0.);

                    for (int k = 0; k < steps_k; k++){
                        for (int i = 0; i < steps_i * (k + 1); i++){
                            float cp = float(i)/float(steps_i * (k + 1)) * 2. * 3.14;
                            float x = sin(cp) * (float(k)/float(steps_k)) * radius;
                            float y = cos(cp) * (float(k)/float(steps_k)) * radius;
                            vec4 col = get_texel(map, uv, 0.001, x, y);
                            float p = (col.x + col.y + col.z) / 3.;
                            sib_color += col * -2.;
                        }
                    }
                    float total_steps = float(steps_i * steps_k * steps_k);
                    vec4 albedo_color = get_texel(map, uv, 0.001, 0., 0.);
                    sib_color += albedo_color * total_steps * 1.27;

                    albedo_color.xyz = sib_color.xyz;
                    return albedo_color;
                }
                vec4 get_local_contrast2(vec2 uv){
                    int steps_i = contrast_kernel_azimuth_steps;
                    int steps_k = contrast_kernel_polar_steps;
                    float radius = 40. * contrast_kernel_radius;
                    float min_color = 1.;
                    float max_color = 0.;
                    float total_color = 0.;
                    for (int k = 0; k < steps_k; k++){
                        for (int i = 0; i < steps_i * (k + 1); i++){
                            float cp = float(i)/float(steps_i * (k + 1)) * 2. * 3.14;
                            float x = sin(cp) * (float(k)/float(steps_k)) * radius;
                            float y = cos(cp) * (float(k)/float(steps_k)) * radius;
                            vec4 col = get_texel(map, uv, 0.001, x, y);
                            float p = (col.x + col.y + col.z) / 3.;
                            min_color = min(min_color, p);
                            max_color = max(max_color, p);
                            total_color += p;
                        }
                    }
                    float average_color = total_color / float(steps_i * steps_k * steps_k);
                    float local_contrast = abs(min_color - average_color) +  abs(average_color - max_color);
                    local_contrast = clamp(local_contrast, 0., 1.);
                    return vec4(
                        min_color,
                        average_color,
                        max_color,
                        local_contrast
                    );
                }

                vec4 get_local_contrast(vec2 uv){
                    int steps_i = 2;
                    int steps_k = 2;
                    float radius = 40. * contrast_kernel_radius;
                    float total = 0.;
                    for (int k = 0; k < steps_k; k++){
                        for (int i = 0; i < steps_i * (k + 1); i++){
                            float cp = float(i)/float(steps_i * (k + 1)) * 2. * 3.14;
                            float x = sin(cp) * (float(k)/float(steps_k)) * radius;
                            float y = cos(cp) * (float(k)/float(steps_k)) * radius;
                            vec4 ctrst = get_local_contrast2(vec2(uv.x + 0.001 * x, uv.y + 0.001 * y));
                            total += ctrst.a;
                        }
                    }
                    float average_contrast = total / float(steps_i * steps_k * steps_k);
                    return vec4(
                        pow(clamp(average_contrast * 2., 0., 1.), 0.5),
                        pow(clamp(average_contrast * 2., 0., 1.), 0.5),
                        pow(clamp(average_contrast * 2., 0., 1.), 0.5),
                        pow(clamp(average_contrast * 2., 0., 1.), 0.5)
                    );
                }

                void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
                    float power = 1. * effect_power;
                    vec4 local_contrast = get_local_contrast(uv);
                    vec4 albedo_color = texture2D(map, uv);
                    vec4 sharpen_color = get_sharpen_color2(uv, 1.);
                    float alpha = (1. - local_contrast.a) * power;
                    outputColor = albedo_color;
                    outputColor.xyz = mix(outputColor.xyz, BlendLuminosity(outputColor.xyz, sharpen_color.xyz), clamp(alpha * 1., 0., 1.));

                    // if (uv.x > 0.5){
                    //     outputColor = albedo_color;
                    // }
                }
            `
            , {})
        super("HueSaturationEffect", shader_code, {
            blendFunction,
            uniforms: new Map([
                ["sharpness_scale", new THREE.Uniform(1)],
                ["contrast_kernel_polar_steps", new THREE.Uniform(4)],
                ["contrast_kernel_azimuth_steps", new THREE.Uniform(3)],
                ["contrast_kernel_radius", new THREE.Uniform(1)],
                ["sharpness_kernel_radius", new THREE.Uniform(1)],
                ["effect_power", new THREE.Uniform(1)]
            ])
        });
    }
}

class Postprocessing extends Component {
    outline_selection = []
    /**private */
    composer = undefined
    outline_effect = undefined
    use_ffx = true
    use_ssao = true
    use_bloom = true
    use_outline = true
    use_godrays = true
    use_tonemapping = true
    use_chromatic_abberation = true
    use_hs = true
    use_bc = true
    use_grain = true
    use_vignette = true
    use_gc = true
    chromatic_abberation_offset_x = 0.4
    chromatic_abberation_offset_y = 0.4
    godrays_autodetect_sun = true
    grain_power = 0.015
    vignette_power = 0.1
    vignette_offset = 0.5
    bloom_smoothing = 0.4
    bloom_threshold = 0.7
    gc_gamma = 1
    hue = 0
    saturation = 0
    brightness = 0
    contrast = 0
    /**private */
    ffx_effect = undefined
    ffx_pass = undefined
    ssao_effect = undefined
    ssao_pass = undefined
    local_sun = undefined
    outline_selection = []
    constructor() {
        super(...arguments)
        let sun = this.local_sun = new THREE.Mesh(new THREE.BufferGeometry(0.1, 32, 32), new THREE.MeshBasicMaterial())
        sun.frustumCulled = false;
        sun.matrixAutoUpdate = false;

    }
    get_reactive_props() {
        return [
            "use_ffx",
            "use_ssao",
            "use_bloom",
            "use_outline",
            "use_godrays",
            "use_tonemapping",
            "use_chromatic_abberation",
            "use_hs",
            "use_bc",
            "use_grain",
            "use_vignette",
            "use_gc",
            "outline_selection",
            "grain_power",
            "bloom_smoothing",
            "bloom_threshold",
            "saturation",
            "brightness",
            "contrast",
            "hue"
        ].concat(super.get_reactive_props())
    }
    on_create() {
        this.postfx_render_function = this.postfx_render_function.bind(this)
        this.setup_postfx()
    }
    on_tick(time_delta) {
        let renderer = this.find_component_of_type("Renderer")

        if (this.use_godrays && this.godrays_autodetect_sun) {
            let sun = this.find_component_of_type("Sun")
            if (sun) {
                this.godrays_effect.lightSource = sun.sphere
            }
        }
        if (this.normal_pass_scene) {
            let normal_rendering_list = renderer.get_object_layer_list({ normal: true })
            this.normal_pass_scene.children = normal_rendering_list
        }

        if (this.render_pass) {
            let postfx_rendering_list = renderer.get_rendering_list()
            this.render_pass.scene.children = postfx_rendering_list
        }

    }

    on_update(props) {
        super.on_update(props)
        props.forEach(prop => {
            switch (prop) {
                case "outline_selection": {
                    if (this.outline_effect !== undefined) this.outline_effect.selection.set(this.outline_selection)
                    break
                }
                case "grain_power": {
                    if (this.grain_effect) this.grain_effect.blendMode.opacity.value = this.grain_power;
                    break
                }
                case "bloom_smoothing": {
                    if (this.bloom_effect) this.bloom_effect.luminanceMaterial.uniforms.smoothing.value = this.bloom_smoothing
                    break
                }
                case "bloom_threshold": {
                    if (this.bloom_effect) this.bloom_effect.luminanceMaterial.uniforms.threshold.value = this.bloom_threshold
                    break
                }
                case "chromatic_abberation_offset_x": {
                    console.log(this.chromatic_abberation_effect)
                    break
                }
                case "chromatic_abberation_offset_y": {
                    console.log(this.chromatic_abberation_effect)
                    break
                }
                case "use_ssao": this.ssao_pass.enabled = this.use_ssao; break;
                case "use_ffx": this.ffx_pass.enabled = this.use_ffx; break;
                default: {
                    if (this.hs_effect) {
                        this.hs_effect.uniforms.get("saturation").value = this.saturation
                        // this.hs_effect.uniforms.get("hue").value.x = this.hue
                    }

                    if (this.bc_effect) {
                        this.bc_effect.uniforms.get("brightness").value = this.brightness
                    }
                }
            }
        })
    }
    setup_postfx() {
        let renderer = this.find_component_of_type("Renderer")
        if (renderer) {
            let composer = this.composer = new postfx.EffectComposer(renderer.renderer)
            let camera = this.find_component_of_type("CameraComponent").subject
            let scene = renderer.render_scene
            let render_pass = this.render_pass = new postfx.RenderPass(scene, camera)

            composer.addPass(render_pass);

            let enabled = !Device.is_mobile



            if (this.use_ssao) this.setup_ssao(renderer, scene, camera, composer)

            if (this.use_hs) this.setup_hs(renderer, scene, camera, composer)
            if (this.use_bc) this.setup_bc(renderer, scene, camera, composer)
            if (this.use_tonemapping) this.setup_tonemapping(renderer, scene, camera, composer)
            if (this.use_chromatic_abberation) this.setup_chromatic_abberation(renderer, scene, camera, composer)
            if (this.use_godrays) this.setup_godrays(renderer, scene, camera, composer)
            if (this.use_bloom) this.setup_bloom(renderer, scene, camera, composer)
            if (this.use_ffx) this.setup_ffx(renderer, scene, camera, composer)

            if (this.use_outline) this.setup_outline(renderer, scene, camera, composer)
            if (this.use_grain) this.setup_grain(renderer, scene, camera, composer)
            if (this.use_vignette) this.setup_vignette(renderer, scene, camera, composer)
            if (this.use_gc) this.setup_gc(renderer, scene, camera, composer)

            // this.use_godrays = enabled
            // this.use_tonemapping = enabled
            // this.use_hs = enabled
            // this.use_bc = enabled
            // this.use_chromatic_abberation = enabled
            // this.use_grain = enabled
            // this.use_vignette = enabled
            // this.use_gc = enabled
        } else {
            this.log("Renderer not found")
        }

    }
    setup_ffx(renderer, scene, camera, composer) {
        let ffx_effect = this.ffx_effect = new FFXEffect();
        let ffx_pass = this.ffx_pass = new postfx.EffectPass(camera, this.ffx_effect);
        composer.addPass(ffx_pass)
    }
    setup_gc(renderer, scene, camera, composer) {
        const gc_effect = new postfx.GammaCorrectionEffect({
            blendFunction: postfx.BlendFunction.NORMAL,
            gamma: this.gc_gamma
        });

        composer.addPass(new postfx.EffectPass(camera, gc_effect));
    }
    setup_vignette(renderer, scene, camera, composer) {
        const vignette_effect = new postfx.VignetteEffect({
            eskil: false,
            offset: this.vignette_offset,
            darkness: this.vignette_power
        });

        composer.addPass(new postfx.EffectPass(camera, vignette_effect));
    }
    setup_grain(renderer, scene, camera, composer) {
        const grain_effect = this.grain_effect = new postfx.NoiseEffect({
            blendFunction: postfx.BlendFunction.DIVIDE
        });
        grain_effect.blendMode.opacity.value = this.grain_power;

        composer.addPass(new postfx.EffectPass(camera, grain_effect));
    }
    setup_bc(renderer, scene, camera, composer) {
        const bc_effect = this.bc_effect = new postfx.BrightnessContrastEffect({
            // blendFunction: postfx.BlendFunction.COLOR,
            brightness: this.brightness,
            contrast: this.contrast
        });

        this.bc_pass = new postfx.EffectPass(camera, bc_effect)

        composer.addPass(this.bc_pass);
    }
    setup_hs(renderer, scene, camera, composer) {
        const hs_effect = this.hs_effect = new postfx.HueSaturationEffect({
            // blendFunction: postfx.BlendFunction.COLOR,
            saturation: this.saturation,
            hue: this.hue
        });

        this.hs_pass = new postfx.EffectPass(camera, hs_effect)

        composer.addPass(this.hs_pass);
    }
    setup_chromatic_abberation(renderer, scene, camera, composer) {
        let chromatic_abberation_effect = this.chromatic_abberation_effect = new postfx.ChromaticAberrationEffect({
            blendFunction: postfx.BlendFunction.ADD,
            offset: new THREE.Vector2(
                this.chromatic_abberation_offset_x / 1000,
                this.chromatic_abberation_offset_y / 1000
            )
        });
        this.chromatic_abberation_pass = new postfx.EffectPass(camera, chromatic_abberation_effect)
        composer.addPass(this.chromatic_abberation_pass)
    }
    setup_tonemapping(renderer, scene, camera, composer) {
        const tonemapping_effect = this.tonemapping_effect = new postfx.ToneMappingEffect({
            mode: postfx.ToneMappingMode.REINHARD2,
            resolution: 256,
            whitePoint: 128.0,
            middleGrey: 0.003,
            minLuminance: 0.003,
            averageLuminance: 0.01,
            adaptationRate: 1.0,
            adaptive: false
        });

        composer.addPass(new postfx.EffectPass(camera, tonemapping_effect));
    }
    setup_godrays(renderer, scene, camera, composer) {
        let godrays_effect = this.godrays_effect = new postfx.GodRaysEffect(camera, this.local_sun, {
            height: 480,
            kernelSize: postfx.KernelSize.MEDIUM,
            density: 0.985,
            decay: 0.985,
            weight: 0.3,
            exposure: 0.9,
            samples: 30,
            clampMax: 1.0
        });

        const pass = new postfx.EffectPass(camera, godrays_effect);
        composer.addPass(pass);
    }
    setup_bloom(renderer, scene, camera, composer) {
        switch (BLOOM_TYPE) {
            case "default": {
                let effect = this.bloom_effect = new postfx.BloomEffect({
                    blendFunction: postfx.BlendFunction.ADD,
                    kernelSize: postfx.KernelSize.MEDIUM,
                    luminanceThreshold: 0.7,
                    luminanceSmoothing: 0.5,
                    height: 480
                })

                composer.addPass(new postfx.EffectPass(camera, effect))
                break;
            }

            case "selective": {

                let effect = this.bloom_effect = new postfx.SelectiveBloomEffect(scene, camera, {
                    blendFunction: postfx.BlendFunction.ADD,
                    kernelSize: postfx.KernelSize.MEDIUM,
                    luminanceThreshold: 0.4,
                    luminanceSmoothing: 0.1,
                    height: 480
                })
                // effect.inverted = true

                composer.addPass(new postfx.EffectPass(camera, effect))
                break;
            }

        }

    }
    setup_outline(renderer, scene, camera, composer) {
        const outline_effect = this.outline_effect = new postfx.OutlineEffect(scene, camera, {
            blendFunction: postfx.BlendFunction.SCREEN,
            edgeStrength: 5.5,
            pulseSpeed: 0.0,
            visibleEdgeColor: 0xffffff,
            hiddenEdgeColor: 0x22090a,
            height: 1280,
            blur: false,
            xRay: true
        });

        composer.addPass(new postfx.EffectPass(camera,
            outline_effect
        ));
    }
    setup_ssao(renderer, scene, camera, composer) {
        let normal_pass_scene = this.normal_pass_scene = new THREE.Scene()
        const normal_pass = this.normal_pass = new postfx.NormalPass(normal_pass_scene, camera);
        const depth_downsampling_pass = this.depth_downsampling_pass = new postfx.DepthDownsamplingPass({
            normalBuffer: normal_pass.texture,
            resolutionScale: 1
        });
        const normal_depth_buffer = this.normal_depth_buffer = renderer.capabilities.isWebGL2 ? depth_downsampling_pass.texture : null;
        const ssao_effect = this.ssao_effect = new postfx.SSAOEffect(camera, normal_pass.texture, {
            blendFunction: postfx.BlendFunction.MULTIPLY,
            distanceScaling: true,
            depthAwareUpsampling: true,
            // normal_depth_buffer,
            samples: 16,
            rings: 7,
            distanceThreshold: 0.1,	// Render up to a distance of ~20 world units
            distanceFalloff: 0.01,	// with an additional ~2.5 units of falloff.
            rangeThreshold: 0.0003,		// Occlusion proximity of ~0.3 world units
            rangeFalloff: 0.0001,			// with ~0.1 units of falloff.
            luminanceInfluence: 1,
            minRadiusScale: 32,
            radius: 0.1,
            intensity: 32,
            bias: 0.25,
            fade: 0.25,
            color: 0x101010,
            resolutionScale: 1
        });
        const texture_effect = this.ssao_texture_effect = new postfx.TextureEffect({
            blendFunction: postfx.BlendFunction.SKIP,
            texture: depth_downsampling_pass.texture
        });
        composer.addPass(normal_pass)
        this.ssao_pass = new postfx.EffectPass(camera,
            texture_effect,
            ssao_effect,
        )
        composer.addPass(this.ssao_pass);
    }
    on_enable() {
        let renderer = this.find_component_of_type("Renderer")
        if (renderer) {
            renderer.custom_render_function = this.postfx_render_function
            renderer.clear_depth = false
            renderer.clear_stencil = false
        }
    }
    on_disable() {
        let renderer = this.find_component_of_type("Renderer")
        if (renderer) {
            renderer.custom_render_function = undefined
            renderer.clear_depth = true
            renderer.clear_stencil = true
        }
    }
    postfx_render_function(scene, camera) {
        let renderer = this.find_component_of_type("Renderer")
        this.composer.setSize(renderer.resolution.x, renderer.resolution.y)
        this.composer.render()
    }
}

Postprocessing.DEFAULT = {

}

export default Postprocessing;
