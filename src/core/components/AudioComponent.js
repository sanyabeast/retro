
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import Component from "core/Component";
import { Howl, Howler } from 'howler';
import * as THREE from "three"

const SPEAKER_ICON_TEXTURE = new THREE.TextureLoader().load('res/core/gizmo/speaker_a.png');
const SPEAKER_ICON_MATERIAL = new THREE.SpriteMaterial({ map: SPEAKER_ICON_TEXTURE });


class AudioComponent extends Component {
    src = undefined
    playing = false
    loop = false
    volume = 0.5
    autoplay = false
    on_create() {
        // this.update_src()
        // if (this.autoplay) {
        //     this.play()
        // }

        // console.log(this)

        /**gizmo */
        const gizmo_speaker_icon = this.gizmo_speaker_icon = new THREE.Sprite(SPEAKER_ICON_MATERIAL);
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
            "src",
            "playing",
            "loop",
            "volume",
            "autoplay"
        ].concat(super.get_reactive_props())
    }
    get_gizmo_render_data() {
        return [{
            object: this.gizmo_speaker_icon,
            parent: this.game_object,
            layers: { gizmo: true }
        }]
    }
    on_update(props) {
        props.forEach(prop => {
            switch (prop) {
                case "src": {
                    this.update_src()
                    if (this.autoplay || this.playing) {
                        this.sound.play()
                    }
                    break
                }
                case "playing": {
                    if (this.sound) {
                        this.sound.play()
                    }
                    break
                }
                case "loop": {
                    this.sound.loop(this.loop)
                    break
                }
                case "volume": {
                    this.sound.volume(this.volume)
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

    }
    play() {
        this.log("start playing...")
        this.playing = true
    }
}

export default AudioComponent;
