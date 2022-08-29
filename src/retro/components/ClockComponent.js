
/* created by @sanyabeast 9/4/2021 
 *
 *
 */


import Component from "retro/Component";
import * as worker_timers from 'worker-timers';
import { keys } from "lodash-es"
import ResourceManager from "retro/ResourceManager"

let tick_loop_types = ["worker", "default", "raf"]

class ClockComponent extends Component {
    tick_loop_type = PRESET.TICKING_LOOP_TYPE
    scene_tick_enabled = true
    tick_interval = 1000 / 60
    
    tick_delta = 1
    prev_scene_tick_date = +new Date()
    started = false;
    time_data = {
        now: +new Date(),
        started_at: -1,
        frame_time: (1000 / 60),
        delta: 1,
        prev_frame_time: +new Date(),
        fps: 60
    }
    time_data_raf = {
        now: +new Date(),
        started_at: -1,
        frame_time: (1000 / 60),
        delta: 1,
        prev_frame_time: +new Date(),
        fps: 60
    }

    bg_tick_interval_id = 0

    on_create() {
        this.tick_loop_type = this.tick_loop_type || "worker"
        this.handle_tick_interval = this.handle_tick_interval.bind(this)
        this.handle_raf = this.handle_raf.bind(this)
        this.raf_cb_id = 0
        this.raf_callbacks = {}

        this.handle_document_visiblity_change = this.handle_document_visiblity_change.bind(this)
        document.addEventListener('visibilitychange', this.handle_document_visiblity_change, false);
    }
    handle_document_visiblity_change(){
        let is_visible = document.visibilityState === "visible"
        if (this.tools.device.is_mobile && !is_visible){
            this.run_tick_interval_actions()
        }
    }
    begin_tick() {
        if (this.started) {
            this.log(`cannot begin. clock is already started`)
            return
        }
        this.started = true;
        this.time_data.started_at = +new Date()
        this.time_data_raf.started_at = +new Date()
        this.loop_id = requestAnimationFrame(this.handle_raf)

        this.log(`starting tick loop. type: "${this.tick_loop_type}"`)
        switch (this.tick_loop_type) {
            case "worker": {
                let tick_interval_id = this.tick_interval_id = worker_timers.setInterval(() => {
                    this.handle_tick_interval()
                }, 1000 / 60);
                break;
            }
            case "raf": {
                let tick_interval_id = this.tick_interval_id = requestAnimationFrame(this.handle_tick_interval)
                break
            }
            default: {
                let tick_interval_id = this.tick_interval_id = setInterval(() => {
                    this.handle_tick_interval()
                }, 1000 / 60);
            }
        }

        if (PRESET.WORK_IN_BACKGROUND){
            let bg_tick_interval_id = this.bg_tick_interval_id = worker_timers.setInterval(() => {
                if (!this.tools.screen.is_document_visible){
                    this.handle_bg_tick_interval()
                }
            }, 1000 / 60);
        }

    }
    handle_raf() {
        let now = this.time_data_raf.now = +new Date()
        let frame_time = this.time_data_raf.frame_time = now - this.time_data_raf.prev_frame_time
        let delta = this.time_data_raf.delta = frame_time / (1000 / 60)
        let fps = this.time_data_raf.fps = 1000 / frame_time
        this.time_data_raf.prev_frame_time = now
        for (let k in this.raf_callbacks) {
            this.raf_callbacks[k](this.time_data_raf)
        }

        this.loop_id = requestAnimationFrame(this.handle_raf)
    }
    handle_bg_tick_interval () {
        this.run_tick_interval_actions()
    }
    handle_tick_interval() {
        switch (this.tick_loop_type) {
            case "raf": {
                this.tick_interval_id = requestAnimationFrame(this.handle_tick_interval)
                break;
            }
        }

        this.run_tick_interval_actions()
    }
    run_tick_interval_actions(){
        let now = this.globals.now = +new Date()
        let frame_time = this.time_data.frame_time = now - this.time_data.prev_frame_time
        let delta = this.time_data.delta = frame_time / (1000 / 60)
        let fps = this.time_data.fps = 1000 / frame_time
        this.time_data.prev_frame_time = now
        let scene = this.globals.app
        if (scene) {
            scene.tick(this.time_data)
        }

        /**global uniforms */
        this.globals.uniforms.time.value += (1 / 60) * delta;

        /*components` static ticks*/
        let active_components_names = keys(ResourceManager.components_instances)
        active_components_names.forEach(component_name => {
            let creator = ResourceManager.classes_of_components[component_name]
            if (creator) {
                creator.tick(ResourceManager.components_instances[component_name])
            } else {
                //**inline components */
            }
        })
    }
    on_tick(time_data) {}
    on_destroy() {
        super.on_destroy(...arguments)
        cancelAnimationFrame(this.loop_id)
        document.removeEventListener('visibilitychange', this.handle_document_visiblity_change, false)

        switch (this.tick_loop_type) {
            case "worker": {
                worker_timers.clearInterval(this.tick_interval_id)
                break;
            }
            case "raf": {
                cancelAnimationFrame(this.tick_interval_id)
                break
            }
            default: {
                clearInterval(this.tick_interval_id)
            }
        }
    }
    add(cb) {
        this.raf_callbacks[this.raf_cb_id] = cb
        return this.raf_cb_id++
    }
    create(cb) {
        let raf_data = {}
        let loop_func = () => {
            raf_data.id = requestAnimationFrame(loop_func)
            if (this.started) {
                cb()
            }
        }
        raf_data.id = requestAnimationFrame(loop_func)
        raf_data.stop = () => {
            cancelAnimationFrame(raf_data.id)
        }
        return raf_data
    }
    remove(id) {
        delete this.raf_callbacks[id]
    }
}

export default ClockComponent;
