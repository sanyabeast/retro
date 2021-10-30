
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import Component from "core/Component";
import AssetManager from "core/utils/AssetManager";
import { render } from "less";
import * as THREE from 'three';
import Device from "core/utils/Device"

const BLOOM_TYPE = "default"
const postfx = require("core/lib/postprocessing").default

class Postprocessing extends Component {
    outline_selection = []
    /**private */
    composer = undefined
    outline_effect = undefined
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

    grain_power = 0.025

    vignette_power = 0.2
    vignette_offset = 0.5

    bloom_smoothing = 0.4
    bloom_threshold = 0.7

    gc_gamma = 1

    hue = 0
    saturation = 0.25
    brightness = 0.025
    contrast = -0.025

    /**private */
    local_sun = undefined
    outline_selection = []

    constructor() {
        super(...arguments)
        let sun = this.local_sun = new THREE.Mesh(new THREE.BufferGeometry(0.1, 32, 32), new THREE.MeshBasicMaterial())
        sun.frustumCulled = false;
        sun.matrixAutoUpdate = false;

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
    get_reactive_props() {
        return [
            "outline_selection",
            "grain_power",
            "bloom_smoothing",
            "bloom_threshold"
        ].concat(super.get_reactive_props())
    }
    on_update(props) {
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

            this.use_godrays = enabled
            this.use_tonemapping = enabled
            this.use_hs = enabled
            this.use_bc = enabled
            this.use_chromatic_abberation = enabled
            this.use_grain = enabled
            this.use_vignette = enabled
            this.use_gc = enabled

            if (this.use_ssao) this.setup_ssao(renderer, scene, camera, composer)
            if (this.use_hs) this.setup_hs(renderer, scene, camera, composer)
            if (this.use_bc) this.setup_bc(renderer, scene, camera, composer)
            if (this.use_tonemapping) this.setup_tonemapping(renderer, scene, camera, composer)
            if (this.use_chromatic_abberation) this.setup_chromatic_abberation(renderer, scene, camera, composer)
            if (this.use_godrays) this.setup_godrays(renderer, scene, camera, composer)
            if (this.use_bloom) this.setup_bloom(renderer, scene, camera, composer)
            if (this.use_outline) this.setup_outline(renderer, scene, camera, composer)
            if (this.use_grain) this.setup_grain(renderer, scene, camera, composer)
            if (this.use_vignette) this.setup_vignette(renderer, scene, camera, composer)
            if (this.use_gc) this.setup_gc(renderer, scene, camera, composer)
        } else {
            this.log("Renderer not found")
        }

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
        const bc_effect = new postfx.BrightnessContrastEffect({
            // blendFunction: postfx.BlendFunction.COLOR,
            brightness: this.brightness,
            contrast: this.contrast
        });

        composer.addPass(new postfx.EffectPass(camera, bc_effect));
    }
    setup_hs(renderer, scene, camera, composer) {
        const hs_effect = new postfx.HueSaturationEffect({
            // blendFunction: postfx.BlendFunction.COLOR,
            saturation: this.saturation,
            hue: this.hue
        });

        composer.addPass(new postfx.EffectPass(camera, hs_effect));
    }
    setup_chromatic_abberation(renderer, scene, camera, composer) {
        let chromatic_abberation_effect = new postfx.ChromaticAberrationEffect({
            blendFunction: postfx.BlendFunction.ADD,
            offset: new THREE.Vector2(
                this.chromatic_abberation_offset_x / 1000,
                this.chromatic_abberation_offset_y / 1000
            )
        });
        composer.addPass(new postfx.EffectPass(camera, chromatic_abberation_effect))
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
            blendFunction: postfx.BlendFunction.SUBTRACT,
            distanceScaling: false,
            depthAwareUpsampling: true,
            // normal_depth_buffer,
            samples: 12,
            rings: 7,
            distanceThreshold: 0.02,	// Render up to a distance of ~20 world units
            distanceFalloff: 0.0025,	// with an additional ~2.5 units of falloff.
            rangeThreshold: 0.0003,		// Occlusion proximity of ~0.3 world units
            rangeFalloff: 0.0001,			// with ~0.1 units of falloff.
            luminanceInfluence: 0.7,
            minRadiusScale: 0.33,
            radius: 0.1,
            intensity: 5,
            bias: 0.1,
            fade: 0.1,
            color: 0x000000,
            resolutionScale: 1
        });
        const texture_effect = this.ssao_texture_effect = new postfx.TextureEffect({
            blendFunction: postfx.BlendFunction.SKIP,
            texture: depth_downsampling_pass.texture
        });
        composer.addPass(normal_pass)
        composer.addPass(new postfx.EffectPass(camera,
            ssao_effect,
            texture_effect,
        ));

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
