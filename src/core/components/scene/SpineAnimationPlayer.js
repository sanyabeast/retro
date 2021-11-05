/* created by @sanyabeast 9/6/2021
 *
 *
 */

import SceneComponent from "core/SceneComponent";
import ResourceManager from "core/ResourceManager"
import { forEach, isUndefined, isArray } from "lodash-es";
import * as THREE from 'three';
const path = require("path")
const SPINE_VERSION = 38
let spine = undefined

// import spine from "spine/spine-threejs.js";
switch (SPINE_VERSION) {
    case 38: {
        spine = require("spine/spine-threejs-38.js").default
        // spine = require("spine/spine-all-38.js").default
        break
    }
    case 40: {
        spine = require("spine/spine-threejs-40.js").default
        break
    }
    default:
        break;
}
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
    depth_test = false
    transparent = true
    /**private */
    playlist = undefined
    get current_playlist_item() {
        return this.playlist[0] || undefined
    }
    async on_create() {
        this.playlist = isArray(this.playlist) ? this.playlist : []
        switch (SPINE_VERSION) {
            case 38: {
                let base_url = this.base_url = `${path.dirname(this.src)}/`
                let file_name = this.file_name = path.basename(this.src).replace(".json", "")
                let atlas_file = this.atlas_file = `${this.file_name}.atlas`;
                let data_file = this.data_file = `${this.file_name}.json`
                this.patch_spine_asset_manager()
                this.spine_asset_manager = new spine.threejs.AssetManager(base_url);
                await this.load_assets();
                await this.setup_view();

                console.log(this.subject)
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
                await this.load_assets();
                await this.setup_view();
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
        this.log(`created...`, this)
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
    on_destroy() {
        super.on_destroy()
    }
    on_tick(time_delta) {
        this.update_queue()
        if (this.subject) {
            this.subject.update(time_delta.delta)
        }
    }
    update_queue() {
        if (!this.subject) { return; }
        let current_playlist_item = this.current_playlist_item
        if (isUndefined(current_playlist_item)) {
        } else {
            if (isUndefined(current_playlist_item.is_new)) current_playlist_item.is_new = true
            if (isUndefined(current_playlist_item.is_playing)) current_playlist_item.is_playing = true
            if (isUndefined(current_playlist_item.repeat)) current_playlist_item.repeat = 1
            if (isUndefined(current_playlist_item.played_times)) current_playlist_item.played_times = 0

            if (current_playlist_item.repeat > 0 && current_playlist_item.repeat < Infinity) {
                if (current_playlist_item.played_times >= current_playlist_item.repeat) {
                    current_playlist_item = this.playlist.shift();
                    if (this.loop_playlist === true) {
                        this.add_to_queue({
                            animation_name: current_playlist_item.animation_name,
                            repeat: current_playlist_item.repeat
                        })
                    }
                } else {
                    if (current_playlist_item.is_playing === false) {
                        this.subject.state.setAnimation(0, current_playlist_item.animation_name, false)
                        current_playlist_item.is_playing = true
                    }
                }
            } else {
                if (current_playlist_item.is_playing === false) {
                    this.subject.state.setAnimation(0, current_playlist_item.animation_name, false)
                    current_playlist_item.is_playing = true
                }
            }
            if (current_playlist_item.is_new === true) {
                current_playlist_item.is_new = false
                this.subject.state.setAnimation(0, current_playlist_item.animation_name, false)
                current_playlist_item.is_playing = true
            }
        }
    }
    setup_view() {
        switch (SPINE_VERSION) {
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
    }
    handle_animation_interrupt(payload) {
        let animation = payload.animation
        let animation_name = animation.name
    }
    handle_animation_end(payload) {
        let animation = payload.animation
        let animation_name = animation.name
    }
    handle_animation_complete(payload) {
        let animation = payload.animation
        let animation_name = animation.name
        let current_playlist_item = this.current_playlist_item
        if (current_playlist_item && current_playlist_item.animation_name === animation_name) {
            if (!current_playlist_item.is_playing) return
            current_playlist_item.is_playing = false
            current_playlist_item.played_times++;
        }
        // this.log(`animation event: "complete"`, animation_name)
    }
    handle_animation_event(payload) {
        let animation = payload.animation
        let animation_name = animation.name
        // this.log(`animation event: "event"`, animation_name)
    }
}

SpineAnimationPlayer.GLOBAL_SKELETONS_SCALE = 0.01;

export default SpineAnimationPlayer;