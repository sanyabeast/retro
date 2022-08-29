
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import SceneComponent from "retro/SceneComponent";
import { Sprite, Object3D, TextureLoader, SpriteMaterial, Vector3 } from "three"
import ResourceManager from "retro/ResourceManager"

const SPEAKER_ICON_TEXTURE = new TextureLoader().load('res/retro/gizmo/speaker_a.png');
const SPEAKER_ICON_MATERIAL = new SpriteMaterial({ map: SPEAKER_ICON_TEXTURE });
const SPEAKER_ICON_MATERIAL_SPATIAL = new SpriteMaterial({ map: SPEAKER_ICON_TEXTURE, color: "#65b2b8" });

const $v3_1 = new Vector3()
const $v3_2 = new Vector3()

let global_volume = 0.5;

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
    tick_rate = 30
    paused = false;
    glitch_gap = 0.1
    bound_object = undefined
    /**private */
    current_distance_to_camera = 0
    extra_gizmo_render_data = undefined
    constructor() {
        super(...arguments)
        this.extra_gizmo_render_data = []
    }
    on_create() {
        this.subject = new Object3D()
        /**gizmo */
        const gizmo_speaker_icon = this.gizmo_speaker_icon = new Sprite(this.spatial ? SPEAKER_ICON_MATERIAL_SPATIAL : SPEAKER_ICON_MATERIAL);
        gizmo_speaker_icon.scale.set(0.05, 0.05, 0.05)
        gizmo_speaker_icon.material.sizeAttenuation = false
        gizmo_speaker_icon.material.depthTest = false
        gizmo_speaker_icon.material.depthWrite = false
        gizmo_speaker_icon.renderOrder = 1
        this.on_sound_ended = this.on_sound_ended.bind(this)

    }
    on_destroy(){
        if (this.sound){
            this.sound.stop()
        }
    }
    async update_src() {
        if (this.sound) {
            this.sound.setLoop(false)
        }
        this.sound = undefined
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

        sound.loopStart = 0
        sound.loopEnd = Math.floor(sound.buffer.duration)
        sound.setLoop(this.loop)
        sound.setVolume(this.volume * global_volume)
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
                parent: this.bound_object || this.game_object
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
    async on_update(props) {
        super.on_update(props)

        if (props.indexOf("src") > -1) {
            await this.update_src()
            if (this.autoplay) {
                this.playing = true
            }
        }
        props.forEach(prop => {
            switch (prop) {
                case "src": {

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
                        if (this.playing && !this.sound.isPlaying) {
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
                        this.sound.setVolume(this.volume * global_volume)
                    }
                    break
                }
                case "autoplay": {
                    if (this.autoplay) {
                        this.playing = true
                    }

                    break
                }

            }

        })
    }
    on_tick(time_data) {
        if (this.sound !== undefined && this.sound.is_new) {
            this.sound.is_new = false
            if (this.playing && !this.sound.isPlaying) {
                this.never_played = false
                this.sound.play()
            }
            if (!this.playing && this.sound.isPlaying) {
                this.sound.stop()
            }
            this.sound.setLoop(this.loop)
            this.sound.setVolume(this.volume * global_volume)
        }
    }
    play() {
        this.log("start playing...")
        this.playing = true
    }
    on_sound_ended() {
    }
    replay() {
        if (this.sound) {
            this.sound.stop()
            this.sound.play()
        }
    }
}

AudioComponent.set_volume = function (v) {
    global_volume = v
}

export default AudioComponent;
