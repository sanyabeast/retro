/* created by @sanyabeast 9/6/2021
 *
 *
 */

import SceneComponent from "core/SceneComponent";
import * as THREE from 'three';

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
    asset_name = "animation";
    skeleton_file = "animation.json";
    atlas_file = "animation.atlas";
    animation_name = "idle";
    asset_manager = null;
    inited = false
    skeleton_scale = 1
    file_name = undefined
    z_offset = 0.001
    async on_create() {
        switch (SPINE_VERSION) {
            case 38: {
                let base_url = `res/${this.asset_name}/`;
                this.skeleton_file = `${this.file_name}.json`;
                this.atlas_file = `${this.file_name}.atlas`;


                this.asset_manager = new spine.threejs.ResourceManager(base_url);
                // this.asset_manager.loadText(this.skeleton_file);
                // this.asset_manager.loadTextureAtlas(`res/${this.asset_name}/${this.atlas_file}`);
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
                let base_url = `res/${this.asset_name}/`;
                if (this.file_name === undefined) {
                    this.file_name = this.asset_name.split("/")
                    this.file_name = this.file_name[this.file_name.length - 1]
                }


                let asset_manager = this.asset_manager = new spine.ResourceManager(
                    base_url
                );
                this.skeleton_file = `${this.file_name}.json`;
                this.atlas_file = `${this.file_name}.atlas`;

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
        // asset_manager.loadText(skeletonFile);
        // asset_manager.loadTextureAtlas(atlasFile);
    }
    on_tick(time_delta) {
        if (this.subject) {
            this.subject.update(1 / 60)
        }
    }
    setup_view() {
        switch (SPINE_VERSION) {
            case 38: {
                let atlas = this.asset_manager.get(this.atlas_file);
                let atlas_loader = new spine.AtlasAttachmentLoader(atlas);
                let skeleton_json = new spine.SkeletonJson(atlas_loader);
                skeleton_json.scale = this.skeleton_scale * SpineAnimationPlayer.GLOBAL_SKELETONS_SCALE;
                let skeleton_data = skeleton_json.readSkeletonData(this.asset_manager.get(this.skeleton_file));
                let subject = this.subject = new spine.threejs.SkeletonMesh(skeleton_data, (parameters) => {
                    //parameters.depthTest = false;
                });
                subject.zOffset = this.z_offset
                break
            }
            case 40: {
                let atlas = this.asset_manager.require(this.atlas_file);
                let atlas_loader = new spine.AtlasAttachmentLoader(atlas);
                let skeleton_json = new spine.SkeletonJson(atlas_loader);
                skeleton_json.scale = this.skeleton_scale * SpineAnimationPlayer.GLOBAL_SKELETONS_SCALE;
                let skeleton_data = skeleton_json.readSkeletonData(this.asset_manager.require(this.skeleton_file));
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
        let asset_manager = this.asset_manager;
        return new Promise(resolve => {
            asset_manager.loadText(this.skeleton_file);
            asset_manager.loadTextureAtlas(this.atlas_file);
            let iid = setInterval(() => {
                if (asset_manager.isLoadingComplete()) {
                    clearInterval(iid);
                    resolve();
                } else {
                }
            }, 100);
        });
    }
}

SpineAnimationPlayer.GLOBAL_SKELETONS_SCALE = 0.1;

export default SpineAnimationPlayer;