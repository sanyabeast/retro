
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import SceneComponent from "core/SceneComponent";
import * as THREE from "three"
import ResourceManager from "core/ResourceManager"

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
    ref_distance = 2
    max_distance = 10
    rolloff = 1
    autoplay = false
    spatial = true
    tick_rate = 5
    paused = false;
    /**private */
    current_distance_to_camera = 0
    extra_gizmo_render_data = undefined
    constructor() {
        super(...arguments)
        this.extra_gizmo_render_data = []
    }
    on_create() {
        console.log(ResourceManager)
        this.subject = new THREE.Object3D()
        /**gizmo */
        const gizmo_speaker_icon = this.gizmo_speaker_icon = new THREE.Sprite(this.spatial ? SPEAKER_ICON_MATERIAL_SPATIAL : SPEAKER_ICON_MATERIAL);
        gizmo_speaker_icon.scale.set(0.05, 0.05, 0.05)
        gizmo_speaker_icon.material.sizeAttenuation = false
        gizmo_speaker_icon.material.depthTest = false
        gizmo_speaker_icon.material.depthWrite = false
        gizmo_speaker_icon.renderOrder = 1

    }
    async update_src() {
        let sound = this.sound = await ResourceManager.load_audio(this.src, this.spatial, this.autoplay)
        if (sound.helper) {
            this.extra_gizmo_render_data = [{
                object: sound.helper,
                parent: this.subject,
                layers: { gizmo: true }
            }]
        } else {
            this.extra_gizmo_render_data = []
        }

        if (this.spatial) {
            sound.setRefDistance(this.ref_distance)
            sound.setRolloffFactor(this.rolloff)
            sound.setMaxDistance(this.max_distance)
        }

        sound.setLoop(this.loop)
        sound.setVolume(this.volume)
    }
    get_reactive_props() {
        return [
            "src",
            "playing",
            "loop",
            "volume",
            "autoplay",
            "spatial_volume",
            "ref_distance",
            "max_distance",
            "rolloff"
        ].concat(super.get_reactive_props())
    }
    get_render_data() {
        return [
            {
                object: this.subject,
                parent: this.game_object
            },
            {
                object: this.sound,
                parent: this.subject
            }
        ]
    }
    get_gizmo_render_data() {
        return [{
            object: this.gizmo_speaker_icon,
            parent: this.subject,
            layers: { gizmo: true }
        }, ...this.extra_gizmo_render_data]
    }
    on_update(props) {
        super.on_update(props)
        props.forEach(prop => {
            switch (prop) {
                case "src": {
                    this.update_src()
                    if (this.sound && (this.autoplay || this.playing)) {
                        this.sound.play()
                    }
                    break
                }
                case "ref_distance": {
                    if (this.sound && this.spatial) {
                        this.sound.setRefDistance(this.ref_distance)
                    }
                }
                case "rolloff": {
                    if (this.sound && this.spatial) {
                        this.sound.setRolloffFactor(this.rolloff)
                    }
                }
                case "max_distance": {
                    if (this.sound && this.spatial) {
                        this.sound.setMaxDistance(this.max_distance)
                    }
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
                    if (this.sound) {
                        this.sound.setLoop(this.loop)
                    }
                    break
                }
                case "volume": {
                    if (this.sound) {
                        this.sound.setVolume(this.volume)
                    }
                    break
                }
                case "autoplay": {
                    if (this.sound && this.autoplay) {
                        this.play()
                    }

                    break
                }

            }

        })
    }
    on_tick(time_delta) {

    }
    play() {
        this.log("start playing...")
        this.playing = true
    }
}

export default AudioComponent;
