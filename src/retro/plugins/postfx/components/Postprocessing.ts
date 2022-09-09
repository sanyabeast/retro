
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import Component from "retro/Component";
import ResourceManager from "retro/ResourceManager";
import { EffectComposer } from 'retro/lib/three/examples/jsm/postprocessing/EffectComposer.js';
import { SSAOPass } from 'retro/lib/three/examples/jsm/postprocessing/SSAOPass.js';
import { SAOPass } from 'retro/lib/three/examples/jsm/postprocessing/SAOPass.js';
import { ShaderPass } from 'retro/lib/three/examples/jsm/postprocessing/ShaderPass.js';
import { RenderPass } from 'retro/lib/three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'retro/lib/three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GammaCorrectionShader } from 'retro/lib/three/examples/jsm/shaders/GammaCorrectionShader.js';
import { ACESFilmicToneMapping, Camera, NoToneMapping, ReinhardToneMapping, Scene, Vector2 } from "three";
import { lerp } from "retro/utils/Tools"

interface PostprocessingEffectParams {
    [x: string]: any
}

class PostprocessingEffectDescriptor {
    power: number = 1
    pass?: any
    params?: PostprocessingEffectParams
    min: PostprocessingEffectParams
    max: PostprocessingEffectParams
    get enabled(): boolean {
        return this.power > 0;
    }
    constructor(min: PostprocessingEffectParams, max: PostprocessingEffectParams, value: number = 1) {
        this.min = min
        this.max = max
        this.power = value
        this.generate_params()
    }
    private generate_params(power: number = 1) {
        this.params = lerp(this.min, this.max, power);
    }
}

class Postprocessing extends Component {
    public static DEFAULT = {}

    public bloom: PostprocessingEffectDescriptor = new PostprocessingEffectDescriptor({
        exposure: 1,
        strength: 0,
        treshold: 0.25,
        radius: 0
    }, {
        exposure: 1,
        strength: 0.3,
        treshold: 0.225,
        radius: 0.5
    })

    public sao: PostprocessingEffectDescriptor = new PostprocessingEffectDescriptor({
        saoBias: 0,
        saoIntensity: 0,
        saoScale: 0,
        saoKernelRadius: 0,
        saoMinResolution: 0,
        saoBlur: true,
        saoBlurRadius: 0,
        saoBlurStdDev: 0,
        saoBlurDepthCutoff: 0
    }, {
        saoBias: 5,
        saoIntensity: 0.001,
        saoScale: 1,
        saoKernelRadius: 150,
        saoMinResolution: 0,
        saoBlur: true,
        saoBlurRadius: 8,
        saoBlurStdDev: 4,
        saoBlurDepthCutoff: 0.01
    })

    public ssao: PostprocessingEffectDescriptor = new PostprocessingEffectDescriptor({
        min_distance: 0.005,
        max_distance: 0.05,
        kernel_radius: 8
    }, {
        min_distance: 0.005,
        max_distance: 0.05,
        kernel_radius: 8
    })

    protected renderer: IRendererComponent
    protected composer: EffectComposer
    protected default_renderer_tonemapping: number
    protected default_renderer_tonemapping_exposure: number

    override on_create() {
        let renderer = this.renderer = this.find_component_of_type("Renderer") as IRendererComponent
        this.default_renderer_tonemapping = this.renderer.tonemapping
        this.default_renderer_tonemapping_exposure = this.renderer.tonemapping_exposure
        this.postfx_render_function = this.postfx_render_function.bind(this)
        let composer = this.composer = new EffectComposer(this.renderer.renderer);

        let camera = this.globals.camera
        let scene = renderer.render_scene

        const renderScene = new RenderPass(scene, camera);

        /**bloom */
        const bloomPass = this.bloom.pass = new UnrealBloomPass(new Vector2(1, 1), 1.5, 0.4, 0.85);
        bloomPass.threshold = this.bloom.params.treshold;
        bloomPass.strength = this.bloom.params.strength;
        bloomPass.radius = this.bloom.params.radius;

        /**sao */
        let saoPass = this.sao.pass = new SAOPass(scene, camera, false, true);
        saoPass.params.output = parseInt(SAOPass.OUTPUT.Default)
        // saoPass.params.output = 0
        saoPass.params.saoBias = this.sao.params.saoBias
        saoPass.params.saoIntensity = this.sao.params.saoIntensity
        saoPass.params.saoScale = this.sao.params.saoScale
        saoPass.params.saoKernelRadius = this.sao.params.saoKernelRadius
        saoPass.params.saoMinResolution = this.sao.params.saoMinResolution
        saoPass.params.saoBlur = this.sao.params.saoBlur
        saoPass.params.saoBlurRadius = this.sao.params.saoBlurRadius
        saoPass.params.saoBlurStdDev = this.sao.params.saoBlurStdDev
        saoPass.params.saoBlurDepthCutoff = this.sao.params.saoBlurDepthCutoff

        /**gamma corr */
        const gammaCorrection = new ShaderPass(GammaCorrectionShader);

        /**ssao0 */
        const ssaoPass = this.ssao.pass = new SSAOPass(scene, camera, 512, 512);
        ssaoPass.kernelRadius = this.ssao.params.kernel_radius;
        ssaoPass.minDistance = this.ssao.params.min_distance;
        ssaoPass.maxDistance = this.ssao.params.max_distance;
        ssaoPass.output = SSAOPass.OUTPUT.Default

        /**adding passes */
        composer.addPass(renderScene)
        composer.addPass(gammaCorrection)
        composer.addPass(bloomPass)
        // composer.addPass(ssaoPass)

        // composer.addPass(saoPass)


    }
    override on_enable() {
        let renderer = this.renderer
        if (renderer) {
            renderer.custom_render_function = this.postfx_render_function
            renderer.tonemapping = ACESFilmicToneMapping
            renderer.tonemapping_exposure = 1
            // renderer.clear_depth = false
            // renderer.clear_stencil = false
        }
    }
    override on_tick(td: IRetroObjectTimeData) {
        this.composer.setSize(
            this.globals.uniforms.resolution.value.x,
            this.globals.uniforms.resolution.value.y
        )
    }
    override on_disable() {
        let renderer = this.renderer
        if (renderer) {
            renderer.custom_render_function = undefined
            renderer.tonemapping = this.default_renderer_tonemapping
            renderer.tonemapping_exposure = this.default_renderer_tonemapping_exposure
        }
    }
    postfx_render_function(scene: Scene, camera: Camera) {
        let renderer = this.renderer
        //renderer.renderer.render(scene, camera);
        this.composer.render()
        // this.composer.setSize(renderer.resolution.x, renderer.resolution.y)
        // this.composer.render()
    }
}

export default Postprocessing;
