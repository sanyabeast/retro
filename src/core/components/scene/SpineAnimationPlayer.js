/* created by @sanyabeast 9/6/2021
 *
 *
 */

import SceneComponent from "core/SceneComponent";
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
    animation_name = "idle";
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
    async on_create() {
        switch (SPINE_VERSION) {
            case 38: {
                let base_url = this.base_url = `${path.dirname(this.src)}/`
                let file_name = this.file_name = path.basename(this.src).replace(".json", "")
                let atlas_file = this.atlas_file = `${this.file_name}.atlas`;
                let data_file = this.data_file = `${this.file_name}.json`

                this.spine_asset_manager = new spine.threejs.AssetManager(base_url);
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
    }
    on_tick(time_delta) {
        if (this.subject) {
            this.subject.update(1 / 30 * time_delta.delta)
        }
    }
    setup_view() {
        switch (SPINE_VERSION) {
            case 38: {
                let atlas = this.spine_asset_manager.get(this.atlas_file);
                let atlas_loader = new spine.AtlasAttachmentLoader(atlas);
                let skeleton_json = new spine.SkeletonJson(atlas_loader);
                skeleton_json.scale = this.skeleton_scale * SpineAnimationPlayer.GLOBAL_SKELETONS_SCALE;
                let skeleton_data = skeleton_json.readSkeletonData(this.spine_asset_manager.get(this.data_file));
                let subject = this.subject = new spine.threejs.SkeletonMesh(skeleton_data, (parameters) => {
                    //parameters.depthTest = false;
                });
                subject.zOffset = this.z_offset
                break
            }
            case 40: {
                let atlas = this.spine_asset_manager.require(this.atlas_file);
                let atlas_loader = new spine.AtlasAttachmentLoader(atlas);
                let skeleton_json = new spine.SkeletonJson(atlas_loader);
                skeleton_json.scale = this.skeleton_scale * SpineAnimationPlayer.GLOBAL_SKELETONS_SCALE;
                let skeleton_data = skeleton_json.readSkeletonData(this.spine_asset_manager.require(this.data_file));
                let subject = this.subject = new spine.SkeletonMesh(skeleton_data, (parameters) => {
                    //parameters.depthTest = false;
                });
                subject.zOffset = this.z_offset
                break
            }
        }

        this.subject.state.setAnimation(0, this.animation_name, true);

        this.on_update([
            "position",
            "rotation",
            "scale"
        ])
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
}

SpineAnimationPlayer.GLOBAL_SKELETONS_SCALE = 0.01;

export default SpineAnimationPlayer;