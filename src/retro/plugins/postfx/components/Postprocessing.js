
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import Component from "retro/Component";
import ResourceManager from "retro/ResourceManager";

import {
    Uniform,
    WebGLRenderTarget,
    LinearFilter,
    UnsignedByteType, RGBAFormat,
    RGBFormat,
    Mesh,
    BufferGeometry,
    MeshBasicMaterial,
    Vector2,
    Scene,
    RepeatWrapping
} from 'three';
import Device from "retro/utils/Device"

const BLOOM_TYPE = "default"
const postfx = require("../lib/postprocessing/build/postprocessing.esm")
const ShaderPass = postfx.ShaderPass;
const Resizer = postfx.Resizer;

// import { ShaderPass } from "../lib/postprocessing/build/postprocessing.esm";
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { TAARenderPass } from 'three/examples/jsm/postprocessing/TAARenderPass.js';
import { map } from "lodash-es"
// import { Resizer } from "postprocessing/src/core/Resizer";

if (IS_DEV) {
    window.postfxlib = postfx;
}

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

class FXAAEffect extends postfx.Effect {
    constructor({
        blendFunction = postfx.BlendFunction.NORMAL
    } = {}) {
        let material_template = ResourceManager.get_material_template("retro/plugins/postfx.fxaa")
        super("fxaa", material_template.params.fragmentShader, {
            blendFunction,
            uniforms: new Map(map(material_template.params.uniforms, (uniform, name) => [name, new Uniform(uniform.value)])),
            vertexShader: material_template.vertexShader
        });
    }
}


class FFXEffect extends postfx.Effect {
    constructor({
        blendFunction = postfx.BlendFunction.NORMAL
    } = {}) {
        let material_template = ResourceManager.get_material_template("retro/plugins/postfx.fidelityfx")
        super("FidelityFX", material_template.params.fragmentShader, {
            blendFunction,
            uniforms: new Map(map(material_template.params.uniforms, (uniform, name) => [name, new Uniform(uniform.value)]))
        });
    }
}

class SSGIEffect extends postfx.Effect {
    constructor(scene, camera, {
        blendFunction = postfx.BlendFunction.NORMAL,
        normal_buffer = null,
        width = Resizer.AUTO_SIZE,
        height = Resizer.AUTO_SIZE,
        resolution_scale = 1
    } = {}) {
        let material_template = ResourceManager.get_material_template("retro/plugins/postfx.ssgi")
        super("ssgi", material_template.params.fragmentShader, {
            blendFunction,
            width,
            height,
            uniforms: new Map(map(material_template.params.uniforms, (uniform, name) => [name, new Uniform(uniform.value)]))
        });
        this.resolution_scale = resolution_scale
        this.renderTarget = new WebGLRenderTarget(1024, 1024, {
            minFilter: LinearFilter,
            magFilter: LinearFilter,
            stencilBuffer: false,
            depthBuffer: false
        });

        this.noise_texture = new postfx.NoiseTexture(100, 100)
        this.noise_texture.wrapS = this.noise_texture.wrapT = RepeatWrapping;
        this.renderTarget.texture.name = "ssgi.blur";
        this.renderTarget.texture.generateMipmaps = false;
        
        this.depthPass = new postfx.DepthPass(scene, camera);
        this.blurPass = new postfx.BlurPass({
            resolutionScale: 1,
            width,
            height,
            kernelSize: postfx.KernelSize.VERY_LARGE
        });

        this.render_pass_scene = new Scene();
        this.blurPass.convolutionMaterial.uniforms.scale.value = 6
        this.blurPass.resolution.resizable = this;
        this.uniforms.get("normal_buffer").value = normal_buffer
        this.uniforms.get("depth_buffer").value = this.depthPass.texture
        this.uniforms.get("noise_texture").value = this.noise_texture
    }
    update(renderer, inputBuffer, deltaTime) {
        let renderTarget = this.renderTarget
        //this.depthPass.render(renderer)
        // this.blurPass.scene = this.render_pass_scene
        this.blurPass.scene.children = this.render_pass_list ?? []
        this.blurPass.render(renderer, inputBuffer, renderTarget);
    }
    get resolution() {
        return this.blurPass.resolution;
    }
    setSize(width, height) {
        const w = width * this.resolution_scale;
        const h = height * this.resolution_scale;
        this.renderTarget.setSize(w, h);
        this.blurPass.setSize(w, h);
        this.depthPass.setSize(w, h);
        this.uniforms.get("aspect").value = w / h
        
    }
    initialize(renderer, alpha, frameBufferType) {
        this.blurPass.initialize(renderer, alpha, frameBufferType);
        this.depthPass.initialize(renderer, alpha, frameBufferType);
        if (!alpha && frameBufferType === UnsignedByteType) {
            this.renderTarget.texture.format = RGBFormat;
        }
        if (frameBufferType !== undefined) {
            this.renderTarget.texture.type = frameBufferType;
        }
    }
}

class Postprocessing extends Component {
    outline_selection = []
    /**private */
    composer = undefined
    outline_effect = undefined
    use_ffx = true
    use_ssgi = true
    use_fxaa = true
    use_smaa = false
    use_taa = false
    use_ssao = true
    use_bloom = true
    use_outline = true
    use_godrays = true
    use_tonemapping = true
    use_chromatic_abberation = true
    use_hs = true
    use_bc = true
    use_grain = false
    use_vignette = false
    use_gc = false
    chromatic_abberation_offset_x = 0
    chromatic_abberation_offset_y = 1
    godrays_autodetect_sun = true
    grain_power = 0.015
    vignette_power = 0.05
    vignette_offset = 0.5
    bloom_smoothing = 1
    bloom_threshold = 0.2
    gc_gamma = 1
    hue = 0
    saturation = 0.4
    brightness = 0.033
    contrast = -0.033
    /**private */
    ffx_effect = undefined
    ffx_pass = undefined
    ssao_effect = undefined
    ssao_pass = undefined
    local_sun = undefined
    outline_selection = []
    constructor() {
        super(...arguments)
        let sun = this.local_sun = new Mesh(new BufferGeometry(0.1, 32, 32), new MeshBasicMaterial())
        sun.frustumCulled = false;
        sun.matrixAutoUpdate = false;

    }
    get_reactive_props() {
        return [
            "use_ssgi",
            "use_ffx",
            "use_fxaa",
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
    on_tick(time_data) {
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

        if (this.ssgi_effect) {
            let rendering_list = renderer.get_object_layer_list({ rendering: true, gizmo: false })
            this.ssgi_effect.render_pass_list = rendering_list
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
                    break
                }
                case "chromatic_abberation_offset_y": {
                    break
                }
                case "use_ssao": this.ssao_pass.enabled = this.use_ssao; break;
                case "use_bloom": this.bloom_pass.enabled = this.use_bloom; break;
                case "use_ffx": this.ffx_pass.enabled = this.use_ffx; break;
                case "use_ssgi": this.ssgi_pass.enabled = this.use_ssgi; break;
                default: {
                    if (this.hs_effect) {
                        this.hs_effect.uniforms.get("saturation").value = this.saturation
                        // this.hs_effect.uniforms.get("hue").value.x = this.hue
                    }

                    if (this.bc_effect) {
                        this.bc_effect.uniforms.get("brightness").value = this.brightness
                        this.bc_effect.uniforms.get("contrast").value = this.contrast
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
            if (this.use_ssgi) this.setup_ssgi(renderer, scene, camera, composer)

            
            if (this.use_ffx) this.setup_ffx(renderer, scene, camera, composer)
            if (this.use_fxaa) this.setup_fxaa(renderer, scene, camera, composer)
            
            if (this.use_tonemapping) this.setup_tonemapping(renderer, scene, camera, composer)
            if (this.use_chromatic_abberation) this.setup_chromatic_abberation(renderer, scene, camera, composer)
            if (this.use_godrays) this.setup_godrays(renderer, scene, camera, composer)
            if (this.use_bloom) this.setup_bloom(renderer, scene, camera, composer)
           
            if (this.use_outline) this.setup_outline(renderer, scene, camera, composer)
            if (this.use_grain) this.setup_grain(renderer, scene, camera, composer)
            if (this.use_vignette) this.setup_vignette(renderer, scene, camera, composer)

            if (this.use_hs) this.setup_hs(renderer, scene, camera, composer)
            if (this.use_bc) this.setup_bc(renderer, scene, camera, composer)
            if (this.use_gc) this.setup_gc(renderer, scene, camera, composer)

            if (this.use_smaa) this.setup_smaa(renderer, scene, camera, composer)
            if (this.use_taa) this.setup_taa(renderer, scene, camera, composer)

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
    setup_taa(renderer, scene, camera, composer) {
        let taa_effect = this.taa_effect = new postfx.EffectPass(camera, new TAARenderPass(scene, camera));
        let taa_pass = this.taa_pass = new postfx.EffectPass(camera, this.taa_effect);
        composer.addPass(taa_pass)
    }
    setup_smaa(renderer, scene, camera, composer) {
        let smaa_effect = this.smaa_effect = new FXAAEffect();
        let smaa_pass = this.smaa_pass = new postfx.EffectPass(camera, this.smaa_effect);
        composer.addPass(smaa_pass)
    }
    setup_fxaa(renderer, scene, camera, composer) {
        let fxaa_effect = this.fxaa_effect = new FXAAEffect();
        let fxaa_pass = this.fxaa_pass = new postfx.EffectPass(camera, this.fxaa_effect);
        // console.log(fxaa_effect.uniforms.get("resolution2"   ).value)
        fxaa_effect.uniforms.get("resolution2").value = this.globals.uniforms.resolution2.value
        composer.addPass(fxaa_pass)
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
            offset: new Vector2(
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
            height: 240,
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
                    blendFunction: postfx.BlendFunction.SOFTLIGHT,
                    kernelSize: postfx.KernelSize.MEDIUM,
                    luminanceThreshold: 0.7,
                    luminanceSmoothing: 0.5,
                    height: 240
                })

                this.bloom_pass = new postfx.EffectPass(camera, effect)
                composer.addPass(this.bloom_pass)
                break;
            }

            case "selective": {

                let effect = this.bloom_effect = new postfx.SelectiveBloomEffect(scene, camera, {
                    blendFunction: postfx.BlendFunction.ADD,
                    kernelSize: postfx.KernelSize.MEDIUM,
                    luminanceThreshold: 0.4,
                    luminanceSmoothing: 0.1,
                    height: 240
                })
                // effect.inverted = true

                this.bloom_pass = new postfx.EffectPass(camera, effect)
                composer.addPass(this.bloom_pass)
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
        if (PRESET.RENDERER_LOGARITHMIC_DEPTH_BUFFER !== true) {
            let normal_pass_scene = this.normal_pass_scene = new Scene()
            const normal_pass = this.normal_pass || new postfx.NormalPass(normal_pass_scene, camera);
            this.normal_pass = normal_pass
            const depth_downsampling_pass = this.depth_downsampling_pass = new postfx.DepthDownsamplingPass({
                normalBuffer: normal_pass.texture,
                resolutionScale: 1
            });
            const normal_depth_buffer = this.normal_depth_buffer = renderer.capabilities.isWebGL2 ? depth_downsampling_pass.texture : null;
            const ssao_effect = this.ssao_effect = new postfx.SSAOEffect(camera, normal_pass.texture, {
                blendFunction: postfx.BlendFunction.MULTIPLY,
                distanceScaling: false,
                depthAwareUpsampling: false,
                // normal_depth_buffer,
                samples: 8,
                rings: 7,
                distanceThreshold: 0.1,	// Render up to a distance of ~20 world units
                distanceFalloff: 0.1,	// with an additional ~2.5 units of falloff.
                rangeThreshold: 0.0003,		// Occlusion proximity of ~0.3 world units
                rangeFalloff: 0.0001,			// with ~0.1 units of falloff.
                luminanceInfluence: 1,
                minRadiusScale: 32,
                radius: 0.125,
                intensity: 12,
                bias: 0.4,
                fade: 3,
                color: 0x000108,
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
    }
    setup_ssgi(renderer, scene, camera, composer) {
        let normal_pass_scene = this.normal_pass_scene || new Scene()
        this.normal_pass_scene = normal_pass_scene
        const normal_pass = this.normal_pass || new postfx.NormalPass(normal_pass_scene, camera);
        this.normal_pass = normal_pass

        composer.addPass(normal_pass)

        let ssgi_effect = this.ssgi_effect = new SSGIEffect(scene, camera, {
            normal_buffer: normal_pass.texture,
            height: 1024
        });
        let ssgi_pass = this.ssgi_pass = new postfx.EffectPass(camera, this.ssgi_effect);
        composer.addPass(ssgi_pass)
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
