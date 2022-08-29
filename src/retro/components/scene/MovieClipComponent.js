
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import Component from "retro/Component";
import ResourceManager from "retro/ResourceManager";
import { Mesh } from 'three';
import MeshComponent from "retro/components/scene/MeshComponent"

class MovieClipComponent extends MeshComponent {
    current_frame = 0
    tick_skip = 1
    playing = true
    loop = true
    hide_stopped = true
    on_create() {
        let geometry = ResourceManager.create_geometry(
            "PlaneBufferGeometry",
            [1, 1, 1]
        )
        let material = ResourceManager.create_material(
            "@retro.movieclip",
            {
                "uniforms.grid.value": this.grid,
                "uniforms.sheet.value": `${this.sheet}`,
                "blending": this.blending
            }
        )

        let mesh = this.subject = new Mesh({
            geometry,
            material
        })
    }

    get_render_data() {
        return [{
            object: this.subject,
            parent: this.game_object
        }]
    }

    show() {
        this.subject.visible = true
    }
    hide() {
        this.subject.visible = false
    }
    play() {
        this.current_frame = 0
        this.playing = true
        if (this.hide_stopped) {
            this.subject.visible = true
        }
    }
    stop() {
        this.playing = false
        if (this.hide_stopped) {
            this.subject.visible = false
        }
    }
    on_tick(time_data) {
        if (this.playing) {
            let frames_count = this.grid[0] * this.grid[1]
            this.current_frame += (this.speed / 60)
            if (this.current_frame > frames_count && this.loop === false) {
                this.stop()
                return
            }
            let current_frame = Math.floor(this.current_frame) % frames_count
            let frame_x = current_frame % this.grid[0]
            let frame_y = this.grid[1] - Math.floor(current_frame / this.grid[1])
            this.subject.material.uniforms.current_frame.value.x = frame_x
            this.subject.material.uniforms.current_frame.value.y = frame_y
        }
    }
}

export default MovieClipComponent;
