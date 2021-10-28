
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import Component from "core/Component";
import { Howl, Howler } from 'howler';

class AudioComponent extends Component {
    src = undefined
    playing = false
    loop = false
    volume = 0.5
    autoplay = false
    on_created() {
        // this.update_src()
        // if (this.autoplay) {
        //     this.play()
        // }

        // console.log(this)
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
