/* created by @sanyabeast 9/6/2021
 *
 *
 */

import SceneComponent from "retro/SceneComponent";
import ResourceManager from "retro/ResourceManager"
import { forEach, isUndefined, isArray, isFunction } from "lodash-es";
import { log } from "retro/utils/Tools"
const path = require("path")
let spine = undefined


/**TODO. Clearing */
const POOL = {}

switch (PRESET.SPINE_VERSION) {
    case 38: {
        spine = require("spine/spine-threejs-38.js").default
        break
    }
    case 40: {
        //spine = require("spine/spine-threejs-40.js").default
        break
    }
    default:
        break;
}

log(`SpineComponent`, `spine version: ${PRESET.SPINE_VERSION}`)

class SpineAnimationPlayer extends SceneComponent {
    src = "res/spine/raptor.json";
    animation_name = undefined;
    inited = false
    skeleton_scale = 1
    z_offset = 0.001
    /**private */
    data_file = "raptor.json"
    atlas_file = "raptor.atlas";
    base_url = "res/spine/"
    file_name = "raptor"
    spine_asset_manager = undefined
    tick_rate = 30
    loop_playlist = true
    disable_cache = false
    disable_pool = false
    depth_test = false
    transparent = true
    current_playlist_item_id = 0
    time_correction = true
    default_fps = 30
    /**private */
    playlist = []
    get current_playlist_item() {
        if (this.current_playlist_item_id < this.playlist.length) {
            return this.playlist[this.current_playlist_item_id]
        } else {
            return undefined
        }
    }
    get_reactive_props() {
        return [
            "playlist",
            ...super.get_reactive_props()
        ]
    }
    on_update(props) {
        super.on_update(props)
        props.forEach(prop => {
            switch (prop) {
                case "playlist": {
                    this.current_playlist_item_id = 0
                }
            }
        })
    }
    async on_create() {
        switch (PRESET.SPINE_VERSION) {
            case 38: {
                let base_url = this.base_url = `${path.dirname(this.src)}/`
                let file_name = this.file_name = path.basename(this.src).replace(".json", "")
                let atlas_file = this.atlas_file = `${this.file_name}.atlas`;
                let data_file = this.data_file = `${this.file_name}.json`
                this.patch_spine_asset_manager()
                this.spine_asset_manager = new spine.threejs.AssetManager(base_url);

                let from_pool = this.get_from_pool()
                if (from_pool) {
                    this.subject = from_pool
                } else {
                    await this.load_assets();
                    await this.setup_view();
                }
                let mesh = this.subject
                this.subject.asset_src = this.src
                if (typeof this.visibility_rule === "function") {
                    Object.defineProperty(mesh, "visible", {
                        get: () => {
                            return this.visibility_rule()
                        }
                    })
                }
                break
            }
            case 40: {
                let base_url = this.base_url = `${path.dirname(this.src)}/`
                let file_name = this.file_name = path.basename(this.src).replace(".json", "")
                let atlas_file = this.atlas_file = `${this.file_name}.atlas`;
                let data_file = this.data_file = `${this.file_name}.json`
                let spine_asset_manager = this.spine_asset_manager = new spine.AssetManager(base_url);
                let from_pool = this.get_from_pool()
                if (from_pool) {
                    this.subject = from_pool
                } else {
                    await this.load_assets();
                    await this.setup_view();
                }
                let mesh = this.subject
                if (typeof this.visibility_rule === "function") {
                    Object.defineProperty(mesh, "visible", {
                        get: () => {
                            return this.visibility_rule()
                        }
                    })
                }
                break
            }
        }
        this.subject.state.addListener({
            start: this.handle_animation_start.bind(this),
            interrupt: this.handle_animation_interrupt.bind(this),
            end: this.handle_animation_end.bind(this),
            complete: this.handle_animation_complete.bind(this),
            event: this.handle_animation_event.bind(this),
        })
        if (this.animation_name !== undefined) {
            this.add_to_queue({
                animation_name: this.animation_name,
                repeat: Infinity
            })
        }
        this.on_update([
            "position",
            "rotation",
            "scale"
        ])
    }
    patch_spine_asset_manager() {
        if (spine.threejs.AssetManager.prototype.$is_patched) {
            return
        }
        let self = this
        let original_download_binary = spine.threejs.AssetManager.prototype.downloadBinary
        let original_download_text = spine.threejs.AssetManager.prototype.downloadText
        let original_load_texture = spine.threejs.AssetManager.prototype.loadTexture
        spine.threejs.AssetManager.prototype.downloadText = function (url, success, error) {
            if (self.disable_cache !== true && ResourceManager.cached_spine_data[url]) {
                success(ResourceManager.cached_spine_data[url])
            } else {
                return original_download_text.call(this, url, (data) => {
                    ResourceManager.cached_spine_data[url] = data
                    success(data)
                }, error)
            }
        }
        spine.threejs.AssetManager.prototype.loadTexture = function (path, success, error) {
            if (self.disable_cache !== true && ResourceManager.cached_spine_data[path]) {
                success(ResourceManager.cached_spine_data[path])
            } else {
                return original_load_texture.call(this, path, (data) => {
                    ResourceManager.cached_spine_data[path] = data
                    success(data)
                }, error)
            }
        }

        spine.threejs.AssetManager.prototype.downloadBinary = function (path, success, error) {
            if (self.disable_cache !== true && ResourceManager.cached_spine_data[path]) {
                success(ResourceManager.cached_spine_data[path])
            } else {
                return original_download_binary.call(this, path, (data) => {
                    ResourceManager.cached_spine_data[path] = data
                    success(data)
                }, error)
            }
        }

        spine.threejs.AssetManager.prototype.$is_patched = true
    }
    get_from_pool() {
        POOL[this.src] = POOL[this.src] || []
        let mesh = POOL[this.src].pop()
        return mesh
    }
    on_destroy() {
        if (this.disable_pool === false) {
            let mesh = this.subject
            delete this.subject
            POOL[this.src] = POOL[this.src] || []
            POOL[this.src].push(mesh)
        }
        super.on_destroy()
    }
    on_tick(time_data) {
        this.update_queue()
        if (this.subject) {
            if (this.time_correction){
                this.subject.update(time_data.delta)
            } else {
                this.subject.update(1 / this.default_fps)
            }
        }
    }
    update_queue() {
        if (!this.subject) { return; }
        let current_playlist_item = this.current_playlist_item
        if (isUndefined(current_playlist_item)) {
        } else {
            if (isUndefined(current_playlist_item.is_new)) current_playlist_item.is_new = true;
            if (isUndefined(current_playlist_item.is_playing)) current_playlist_item.is_playing = true;
            if (isUndefined(current_playlist_item.repeat)) current_playlist_item.repeat = 0;
            if (isUndefined(current_playlist_item.played_times)) {
                current_playlist_item.played_times = 0;
            }

            if (current_playlist_item.is_new === true) {
                current_playlist_item.is_new = false
                /**on start callback */
                if (isFunction(current_playlist_item.on_start)) {
                    current_playlist_item.on_start(this)
                    delete current_playlist_item.on_start
                }
                setTimeout(a => this.subject.state.setAnimation(0, current_playlist_item.animation_name, false))
                current_playlist_item.is_playing = true
            }

            if (current_playlist_item.repeat > 0 && current_playlist_item.repeat < Infinity) {
                if (current_playlist_item.played_times >= current_playlist_item.repeat) {
                    this.current_playlist_item_id++
                    current_playlist_item = this.current_playlist_item
                    if (this.loop_playlist === true) {
                        this.current_playlist_item_id = this.current_playlist_item_id % this.playlist.length
                    }
                } else {
                    if (current_playlist_item.is_playing === false) {
                        setTimeout(a => this.subject.state.setAnimation(0, current_playlist_item.animation_name, false))
                        current_playlist_item.is_playing = true
                    }
                }
            } else {
                if (current_playlist_item.is_playing === false) {
                    setTimeout(a => this.subject.state.setAnimation(0, current_playlist_item.animation_name, false))
                    current_playlist_item.is_playing = true
                }
            }



        }
    }
    setup_view() {
        switch (PRESET.SPINE_VERSION) {
            case 38: {
                let skeleton_data = ResourceManager.cached_spine_skeleton_data[this.src]
                if (skeleton_data === undefined) {
                    let atlas = this.spine_asset_manager.get(this.atlas_file);
                    let atlas_loader = new spine.AtlasAttachmentLoader(atlas);
                    let skeleton_json = new spine.SkeletonJson(atlas_loader);
                    skeleton_json.scale = this.skeleton_scale * SpineAnimationPlayer.GLOBAL_SKELETONS_SCALE;
                    skeleton_data = skeleton_json.readSkeletonData(this.spine_asset_manager.get(this.data_file));
                    ResourceManager.cached_spine_skeleton_data[this.src] = skeleton_data
                }
                let subject = this.subject = new spine.threejs.SkeletonMesh(skeleton_data, (parameters) => {
                    parameters.depthTest = this.depth_test;
                    parameters.transparent = this.transparent
                });
                subject.zOffset = this.z_offset
                break
            }
            case 40: {
                let skeleton_data = ResourceManager.cached_spine_skeleton_data[this.src]
                if (skeleton_data === undefined) {
                    let atlas = this.spine_asset_manager.require(this.atlas_file);
                    let atlas_loader = new spine.AtlasAttachmentLoader(atlas);
                    let skeleton_json = new spine.SkeletonJson(atlas_loader);
                    skeleton_json.scale = this.skeleton_scale * SpineAnimationPlayer.GLOBAL_SKELETONS_SCALE;
                    skeleton_data = skeleton_json.readSkeletonData(this.spine_asset_manager.require(this.data_file));
                    ResourceManager.cached_spine_skeleton_data[this.src] = skeleton_data
                }

                let subject = this.subject = new spine.SkeletonMesh(skeleton_data, (parameters) => {
                    parameters.depthTest = this.depth_test;
                    parameters.transparent = this.transparent
                });
                subject.zOffset = this.z_offset
                break
            }
        }
    }
    load_assets() {
        let spine_asset_manager = this.spine_asset_manager;
        return new Promise(resolve => {
            spine_asset_manager.loadText(this.data_file);
            spine_asset_manager.loadTextureAtlas(this.atlas_file);
            let iid = setInterval(() => {
                if (spine_asset_manager.isLoadingComplete()) {
                    clearInterval(iid);
                    resolve();
                } else {
                }
            }, 100);
        });
    }
    /**playlisting */
    add_to_queue(animation_params) {
        this.playlist.push(animation_params)
    }
    /**spine animation state listener api*/
    handle_animation_start(payload) {
        // let animation_name = payload.
        let animation = payload.animation
        let animation_name = animation.name

        this.emit("animation.start", {
            animation_name: animation_name
        })
    }
    handle_animation_interrupt(payload) {
        let animation = payload.animation
        let animation_name = animation.name

        this.emit("animation.interrupt", {
            animation_name: animation_name
        })
    }
    handle_animation_end(payload) {
        let animation = payload.animation
        let animation_name = animation.name

        this.emit("animation.end", {
            animation_name: animation_name
        })
    }
    handle_animation_complete(payload) {
        let animation = payload.animation
        let animation_name = animation.name
        let current_playlist_item = this.current_playlist_item
        if (current_playlist_item && current_playlist_item.animation_name === animation_name) {
            if (!current_playlist_item.is_playing) return
            current_playlist_item.is_playing = false
            /**on complete callback */
            if (isFunction(current_playlist_item.on_complete)) {
                current_playlist_item.on_complete(this)
                delete current_playlist_item.on_complete
            }
            current_playlist_item.played_times++;
        }
        this.emit("animation.complete", {
            animation_name: animation_name
        })
    }
    handle_animation_event(payload) {
        let animation = payload.animation
        let animation_name = animation.name

        this.emit("animation.event", {
            animation_name: animation_name,
            event_name: "?"
        })
    }
}

SpineAnimationPlayer.GLOBAL_SKELETONS_SCALE = 0.01;

export default SpineAnimationPlayer;