
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import Component from "core/Component";
import AssetManager from "core/utils/AssetManager";
import { render } from "less";
import * as THREE from 'three';

const postfx = require("core/lib/postprocessing").default

class Postprocessing extends Component {
    outline_selection = []
    /**private */
    composer = undefined
    outline_effect = undefined
    on_created() {
        this.postfx_render_function = this.postfx_render_function.bind(this)
        this.setup_postfx()
    }
    on_tick(time_delta) {

    }
    get_reactive_props() {
        return [
            "outline_selection"
        ].concat(super.get_reactive_props())
    }
    on_update(props) {
        props.forEach(prop => {
            switch (prop) {
                case "outline_selection": {
                    this.outline_effect.selection.set(this.outline_selection)
                    break
                }
            }
        })
    }
    setup_postfx() {
        let renderer = this.find_component_of_type("RendererComponent")
        if (renderer) {
            let composer = this.composer = new postfx.EffectComposer(renderer.renderer)
            let camera = this.find_component_of_type("CameraComponent").subject
            let scene = renderer.render_scene

            const normal_pass = new postfx.NormalPass(scene, camera);

            const depth_downsampling_pass = new postfx.DepthDownsamplingPass({
                normalBuffer: normal_pass.texture,
                resolutionScale: 1
            });

            const normalDepthBuffer = renderer.capabilities.isWebGL2 ?
                depth_downsampling_pass.texture : null;

            const ssao_effect = new postfx.SSAOEffect(camera, normal_pass.texture, {
                blendFunction: postfx.BlendFunction.MULTIPLY,
                distanceScaling: false,
                depthAwareUpsampling: true,
                normalDepthBuffer: normalDepthBuffer,
                samples: 9,
                rings: 7,
                distanceThreshold: 0.02,	// Render up to a distance of ~20 world units
                distanceFalloff: 0.0025,	// with an additional ~2.5 units of falloff.
                rangeThreshold: 0.0003,		// Occlusion proximity of ~0.3 world units
                rangeFalloff: 0.0001,			// with ~0.1 units of falloff.
                luminanceInfluence: 0.7,
                minRadiusScale: 0.33,
                radius: 1.3,
                intensity: 3.33,
                bias: 0.025,
                fade: 0.01,
                color: null,
                resolutionScale: 0.5
            });

            const outline_effect = this.outline_effect = new postfx.OutlineEffect(scene, camera, {
                blendFunction: postfx.BlendFunction.SCREEN,
                edgeStrength: 2.5,
                pulseSpeed: 0.0,
                visibleEdgeColor: 0xffffff,
                hiddenEdgeColor: 0x22090a,
                height: 1280,
                blur: false,
                xRay: true
            });


            composer.addPass(new postfx.RenderPass(scene, camera));
            composer.addPass(new postfx.EffectPass(camera,
                ssao_effect,
                new postfx.BloomEffect({
                    blendFunction: postfx.BlendFunction.SCREEN,
                    kernelSize: postfx.KernelSize.SMALL,
                    luminanceThreshold: 0.3,
                    luminanceSmoothing: 0.45,
                    height: 960
                }),
                outline_effect
            ));
        } else {
            this.log("RendererComponent not found")
        }

    }
    on_enabled() {
        let renderer = this.find_component_of_type("RendererComponent")
        if (renderer) {
            renderer.custom_render_function = this.postfx_render_function
            renderer.clear_depth = false
            renderer.clear_stencil = false
        }
    }
    on_disabled() {
        let renderer = this.find_component_of_type("RendererComponent")
        if (renderer) {
            renderer.custom_render_function = undefined
            renderer.clear_depth = true
            renderer.clear_stencil = true
        }
    }
    postfx_render_function(scene, camera) {
        let renderer = this.find_component_of_type("RendererComponent")
        this.composer.setSize(renderer.resolution.x, renderer.resolution.y)
        this.composer.render()
    }
}

Postprocessing.DEFAULT = {
    
}

export default Postprocessing;
