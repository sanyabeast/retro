/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import SceneComponent from "retro/SceneComponent";
import ResourceManager from "retro/ResourceManager";
import { Texture, Vector3, Vector2, MeshBasicMaterial, PlaneBufferGeometry, Mesh, ShaderMaterial } from 'three';
import { log, error, is_none, console } from "retro/utils/Tools"
import { isString, isObject, isFunction, isArray, isNumber, isBoolean, isUndefined, isNull, map, filter, keys, values, set, get, unset } from "lodash-es"
import Schema from "retro/utils/Schema"
import path from "path"
import YAML from 'yaml'


class SeqAnimationPlayer extends SceneComponent {
    src = undefined
    loading_complete = false
    textures = []
    tile_index = 0
    size_x = 3
    size_y = 3
    fps = 1
    tile_progress = 0
    // private
    metadata = undefined
    tiles_count = 1
    tilesets_count = 1
    tileset_index = -1
    get basedir() {
        return path.dirname(this.src)
    }
    on_create() {
        ResourceManager.cached_seqanims_metadata = ResourceManager.cached_seqanims_metadata || {}


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
                uniform sampler2D map;
                uniform vec2 grid;
                uniform vec2 tile;
                uniform vec2 prev_tile;
                uniform float tile_progress;

                varying vec2 vUv;
                vec4 get_tile_color(vec2 tile){
                    vec2 tile_size = vec2(1./grid.x, 1./grid.y);
                    vec2 tile_offset = vec2(tile.x * tile_size.x, 1. - tile.y * tile_size.y);
                    vec2 subuv = vec2(vUv.x * tile_size.x, vUv.y * tile_size.y);
                    vec2 tileuv = vec2(tile_offset.x + subuv.x, tile_offset.y - subuv.y);
                    vec4 tColor = texture2D(map, tileuv);
                    return tColor;
                }
                void main(){
                    vec4 current_tile_color = get_tile_color(tile);
                    vec4 prev_tile_color = get_tile_color(prev_tile);
                    gl_FragColor = mix(prev_tile_color, current_tile_color, tile_progress);
                }
            `,
            transparent: true,
            depthTest: false,
            uniforms: {
                map: {
                    type: "t",
                },
                grid: {
                    type: "v2",
                    value: new Vector2(1, 1)
                },
                prev_tile: {
                    type: "v2",
                    value: new Vector2(0, 0)
                },
                tile: {
                    type: "v2",
                    value: new Vector2(0, 0)
                },
                tile_progress: {
                    type: "f",
                    value: 1
                }
            }
        })
        let subject = this.subject = new Mesh(new PlaneBufferGeometry(this.size_x, this.size_y, 1), this.material)
        // subject.geometry.scale(-1, )
        subject.geometry.rotateZ(Math.PI)

        this.load_animation(this.src);
    }
    load_animation(base_path) {
        this.loading_complete = false
        this.tile_progress = 0
        this.tileset_index = -1
        let meta_data = this.metadata = ResourceManager.cached_seqanims_metadata[base_path]

        if (!meta_data) {
            try {
                meta_data = this.meta_data = YAML.parse(this.tools.net.request_text_sync(`${this.src}.seqanim`));
                ResourceManager.cached_seqanims_metadata[base_path] = meta_data
            } catch (err) {
                console.log(err)
            }
        }

        if (meta_data != undefined) {
            if (meta_data.grid === undefined) meta_data.grid = [1, 1]
            if (meta_data.mime === undefined) meta_data.mime = "png"

            let textures = this.textures = []
            let tiles_count = this.tiles_count = meta_data.grid[0] * meta_data.grid[1]
            let tilesets_count = this.tilesets_count = Math.ceil(meta_data.frames / tiles_count)
            this.material.uniforms.grid.value.set(meta_data.grid[0], meta_data.grid[1])
            this.fps = meta_data.fps || 30
            // this.fps = 1

            for (let i = 0; i < tilesets_count; i++) {
                let image_src = `${this.basedir}/${meta_data.name}${i}.${meta_data.mime}`
                let t = ResourceManager.load_texture(`${image_src}?wrapS=1000&wrapT=1000&repeat.x=${1}&repeat.y=${1}`)

                textures[i] = t
                this.loading_complete = true
            }

            if (this.tools.type.is_number(meta_data.scale)) {
                this.subject.scale.set(meta_data.scale, meta_data.scale, meta_data.scale)
            } else {
                this.subject.scale.set(1, 1, 1)
            }

            this.loading_complete = true

        } else {
            this.error(`fail to laod sequence-animation "${this.src}"`)
        }
    }
    on_destroy() {
        super.on_destroy(...arguments)
    }
    on_tick(time_data) {
        if (this.loading_complete) {
            // if (this.textures[this.tile_index].image && this.textures[this.tile_index].image.height > 0) {
            //     this.material.uniforms.map.value = this.textures[this.tile_index]
            //     this.material.uniforms.map.needsUpdate = true
            // }

            let tileset_index = Math.floor(this.tile_index / this.tiles_count)

            this.material.uniforms.prev_tile.value.copy(this.material.uniforms.tile.value);
            if (tileset_index != this.tileset_index) {
                this.tileset_index = tileset_index
                this.material.uniforms.prev_tile.value.set(0, 0)
                this.material.uniforms.map.value = this.textures[this.tileset_index]
                this.material.uniforms.map.needsUpdate = true
            }


            let tile_x = this.tile_index % this.meta_data.grid[0]
            let tile_y = Math.floor(this.tile_index / this.meta_data.grid[0])


            this.material.uniforms.tile.value.set(tile_x, tile_y)

            this.material.uniforms.tile.needsUpdate = true
            this.material.uniforms.tile_progress.value = this.tile_progress % 1

            this.tile_progress += time_data.delta * this.fps
            this.tile_index = (Math.floor(this.tile_progress)) % this.meta_data.frames;
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
