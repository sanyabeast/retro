
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import Component from "retro/Component";
import ResourceManager from "retro/ResourceManager";
import { EffectComposer } from 'retro/lib/three/examples/jsm/postprocessing/EffectComposer.js';
import { SSAOPass } from 'retro/lib/three/examples/jsm/postprocessing/SSAOPass.js';
import { RenderPass } from 'retro/lib/three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'retro/lib/three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ACESFilmicToneMapping, Camera, NoToneMapping, ReinhardToneMapping, Scene, Vector2 } from "three";

class Postprocessing extends Component {
    public static DEFAULT = {}

    public bloom_params = {
        exposure: 1,
        strength: 0.3,
        treshold: 0.3,
        radius: 1
    }

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

        const renderScene = new RenderPass( renderer.render_scene, camera );

        const bloomPass = new UnrealBloomPass( new Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
        bloomPass.threshold = this.bloom_params.treshold;
        bloomPass.strength = this.bloom_params.strength;
        bloomPass.radius = this.bloom_params.radius;

        composer.addPass(renderScene)
        composer.addPass(bloomPass)
    }
    override on_enable() {
        let renderer = this.renderer
        if (renderer) {
            renderer.custom_render_function = this.postfx_render_function
            renderer.tonemapping = ACESFilmicToneMapping
            renderer.tonemapping_exposure = 0.55
            // renderer.clear_depth = false
            // renderer.clear_stencil = false
        }
    }
    override on_tick(td: IRetroObjectTimeData){
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
