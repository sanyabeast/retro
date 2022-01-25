/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import SceneComponent from "retro/SceneComponent";
import ResourceManager from "retro/ResourceManager";
import { Texture, Vector3, MeshBasicMaterial, PlaneBufferGeometry, Mesh, ShaderMaterial } from 'three';
import { log, error, is_none, console } from "retro/utils/Tools"
import { isString, isObject, isFunction, isArray, isNumber, isBoolean, isUndefined, isNull, map, filter, keys, values, set, get, unset } from "lodash-es"
import Schema from "retro/utils/Schema"
import path from "path"
import YAML from 'yaml'


class SeqAnimationPlayer extends SceneComponent {
    src = undefined
    loading_complete = false
    textures = []
    frame_index = 0
    size_x = 10
    size_y = 10
    fps = 60
    frame_progress = 0
    get basedir() {
        return path.dirname(this.src)
    }
    on_create() {
        ResourceManager.cached_seqanims_metadata = ResourceManager.cached_seqanims_metadata || {}
        this.load_animation(this.src);

        this.material = new ShaderMaterial({
            vertexShader: `
                varying vec2 vUv; 

                void main() {
                    //vUv = vec2((position.x/2.) + 0.5, (position.y/2.) + 0.5); 
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); 
                }
            `,
            fragmentShader: `
                uniform sampler2D frame;
                varying vec2 vUv;
                void main(){
                    vec4 tColor = texture2D(frame, vUv.xy);
                    gl_FragColor = tColor;
                }
            `,
            transparent: true,
            depthTest: false,
            uniforms: {
                frame: {
                    type: "t",
                }
            }
        })
        let subject = this.subject = new Mesh(new PlaneBufferGeometry(this.size_x, this.size_y, 1), this.material)
    }
    load_animation(base_path) {
        this.loading_complete = false
        this.frame_progress = 0
        let meta_data = ResourceManager.cached_seqanims_metadata[base_path]
        if (!meta_data) {
            try {
                meta_data = this.meta_data = YAML.parse(this.tools.net.request_text_sync(`${this.src}.seqanim`));
                ResourceManager.cached_seqanims_metadata[base_path] = meta_data
            } catch (err) {
                console.log(err)
            }
        }

        if (meta_data != undefined) {
            let textures = this.textures = []
            for (let i = 0; i < meta_data.frames; i++) {
                let image_src = `${this.basedir}/${meta_data.name}${i}.${meta_data.mime}`
                let t = ResourceManager.load_texture(image_src)
                textures[i] = t
                this.loading_complete = true
            }

        } else {
            this.error(`fail to laod sequence-animation "${this.src}"`)
        }
    }
    on_destroy() {
        super.on_destroy(...arguments)
    }
    on_tick(time_data) {
        if (this.loading_complete) {
            if (this.textures[this.frame_index].image && this.textures[this.frame_index].image.height > 0) {
                this.material.uniforms.frame.value = this.textures[this.frame_index]
                this.material.uniforms.frame.needsUpdate = true
            }
            this.frame_progress += time_data.delta * this.fps
            this.frame_index = (Math.floor(this.frame_progress)) % this.textures.length;
        }
    }
    get_reactive_props() {
        return [
            "src"
        ].concat(super.get_reactive_props())
    }
    on_update(props) {
        super.on_update(props)
        props.forEach(prop => {
            switch (prop) {
                case "src": {
                    this.load_animation(this.src)
                    break;
                }
            }
        })
    }
}

export default SeqAnimationPlayer;
