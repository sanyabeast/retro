
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import SceneComponent from "core/SceneComponent";
import { Howl, Howler } from 'howler';
import * as THREE from "three"

const SPEAKER_ICON_TEXTURE = new THREE.TextureLoader().load('res/core/gizmo/speaker_a.png');
const SPEAKER_ICON_MATERIAL = new THREE.SpriteMaterial({ map: SPEAKER_ICON_TEXTURE });
const SPEAKER_ICON_MATERIAL_SPATIAL = new THREE.SpriteMaterial({ map: SPEAKER_ICON_TEXTURE, color: "#65b2b8" });

const $v3_1 = new THREE.Vector3()
const $v3_2 = new THREE.Vector3()

class AudioComponent extends SceneComponent {
    src = undefined
    playing = false
    loop = false
    volume = 0.5
    spatial_volume = 1
    spatial_distance = 10
    spatial_fade_power = 2
    autoplay = false
    spatial = true
    tick_rate = 15
    paused = false;
    /**private */
    current_distance_to_camera = 0
    on_create() {
        this.subject = new THREE.Object3D()
        /**gizmo */
        const gizmo_speaker_icon = this.gizmo_speaker_icon = new THREE.Sprite(this.spatial ? SPEAKER_ICON_MATERIAL_SPATIAL : SPEAKER_ICON_MATERIAL);
        gizmo_speaker_icon.scale.set(0.05, 0.05, 0.05)
        gizmo_speaker_icon.material.sizeAttenuation = false
        gizmo_speaker_icon.material.depthTest = false
        gizmo_speaker_icon.material.depthWrite = false
        gizmo_speaker_icon.renderOrder = 1

    }
    update_src() {
        if (this.sound) {
            this.sound.stop()
        }
        this.sound = new Howl({
            src: [`${this.src}.ogg`, `${this.src}.mp3`,],
            loop: this.loop,
            volume: this.volume
        });
    }
    get_reactive_props() {
        return [
            "spatial",
            "src",
            "playing",
            "loop",
            "volume",
            "autoplay",
            "spatial_volume"
        ].concat(super.get_reactive_props())
    }
    get_render_data() {
        return [
            {
                object: this.subject,
                parent: this.game_object
            }
        ]
    }
    get_gizmo_render_data() {
        return [{
            object: this.gizmo_speaker_icon,
            parent: this.subject,
            layers: { gizmo: true }
        }]
    }
    on_update(props) {
        super.on_update(props)
        props.forEach(prop => {
            switch (prop) {
                case "spatial": {
                    if (this.spatial) {
                        this.gizmo_speaker_icon.material = SPEAKER_ICON_MATERIAL_SPATIAL
                    } else {
                        this.gizmo_speaker_icon.material = SPEAKER_ICON_MATERIAL
                    }
                    break
                }
                case "src": {
                    this.update_src()
                    if (this.autoplay || this.playing) {
                        this.sound.play()
                    }
                    break
                }
                case "playing": {
                    if (this.sound) {
                        if (this.playing) {
                            this.sound.play()
                        } else {
                            this.sound.stop()
                        }
                    }
                    break
                }
                case "loop": {
                    this.sound.loop(this.loop)
                    break
                }
                case "volume": {
                    this.sound.volume(this.volume * this.spatial_volume)
                    break
                }
                case "spatial_volume": {
                    this.sound.volume(this.volume * this.spatial_volume)
                    break
                }
                case "autoplay": {
                    if (this.autoplay) {
                        this.play()
                    }

                    break
                }

            }

        })
    }
    on_tick(time_delta) {
        if (this.spatial === true) {
            this.update_spatial()
        }
    }
    update_spatial() {
        let camera = this.globals.camera
        camera.getWorldPosition($v3_1)
        this.subject.getWorldPosition($v3_2)
        let distance = this.current_distance_to_camera = $v3_1.distanceTo($v3_2)
        let fade_progress = distance / this.spatial_distance
        this.spatial_volume = Math.pow(1 - this.clamp(fade_progress, 0, 1), this.spatial_fade_power)

        if (fade_progress > 1) {
            if (!this.paused) {
                this.log(`spatial sound paused ${this.src}`, fade_progress)
                this.paused = true
                this.sound.pause()
            }
        } else if (fade_progress <= 1) {
            if (this.paused && this.playing) {
                this.log(`spatial sound resumed ${this.src}`, fade_progress)
                this.paused = false
                this.sound.play()
            }
        }
    }
    play() {
        this.log("start playing...")
        this.playing = true
    }
}

export default AudioComponent;
