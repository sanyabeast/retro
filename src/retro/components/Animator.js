/* created by @sanyabeast 8/14/2021 2:53:12 AM
 *
 *
 */

import Component from "retro/Component";
import { set, get, has, hasIn } from "lodash-es";

/**
 *  ANIMATION
    {
        duration: Number,
        values: Object
        from_values: undefined|Object
        target_object: Object
        loop: Boolean

    }



 */

class Animator extends Component {
    tick_skip = 2;
    active_animations = {};
    animations = {}
    on_create() { }
    on_enable() {
        for (let k in this.animations) {
            if (this.animations[k].autoplay) {
                this.animate(k, 1);
            }
        }
    }

    animate(animation_name, duration_scale, callbacks) {
        return new Promise((resolve) => {
            if (this.tools.type.is_object(duration_scale)) {
                let anim_params = duration_scale;
                if (this.tools.type.is_object(this.animations[animation_name])) {
                    if (this.animations[animation_name].resolved === false) {
                        this.animations[animation_name].resolve()
                    }

                    delete this.active_animations[animation_name]
                }
                this.animations[animation_name] = anim_params;
                duration_scale = 1;
            }

            let anim_params = this.animations[animation_name]

            if (this.tools.type.is_none(anim_params)) {
                console.log(`Animator: no such animation: ${animation_name}`);
            }
            duration_scale = this.tools.type.is_number(duration_scale) ? duration_scale : 1
            // console.log(`Animator: playing ${animation_name}`)
            let start_values = {};
            for (let k in anim_params.values) {
                if (
                    anim_params.from_values &&
                    anim_params.from_values[k] !== undefined
                ) {
                    start_values[k] =
                        anim_params.from_values[k];
                } else {
                    let sv = get(this.game_object, k)
                    start_values[k] = typeof sv === "number" ? sv : 0;
                }
            }
            this.active_animations[animation_name] = {
                name: animation_name,
                start: +new Date(),
                end:
                    +new Date() +
                    anim_params.duration *
                    duration_scale *
                    1000,
                progress: 0,
                started: false,
                stopped: false,
                on_complete: callbacks ? callbacks.on_complete : undefined,
                on_start: callbacks ? callbacks.on_start : undefined,
                on_update: callbacks ? callbacks.on_update : undefined,
                start_values: start_values,
                resolve: resolve,
                resolved: false,
                target_object: anim_params.target_object,
                values: anim_params.values,
                ease: anim_params.ease
            };
        })
    }

    on_tick(time_data) {
        let now = +new Date();
        let new_values = {};

        for (let k in this.active_animations) {
            let a = this.active_animations[k];
            let ease = a.ease || "linear";
            let target_object = this.animations[a.name].target_object
            if (target_object === undefined) {
                this.error(`cannot animation: no target object`)
                return
            }
            let progress = this.tools.easings[ease](
                (now - a.start) / (a.end - a.start)
            );

            if (progress > 1) {
                if (this.animations[a.name].loop) {
                    progress = progress % 1;
                } else {
                    progress = 1;
                }
            }

            if (a.stopped) {
                delete this.active_animations[k];
            }

            if (!a.started) {
                a.started = true;
                if (a.on_start) {
                    a.on_start();
                }
            }

            let target_values = this.animations[a.name].values;
            for (let k in target_values) {
                let cv = this.tools.math.lerp(
                    a.start_values[k],
                    target_values[k],
                    progress
                );
                if (hasIn(target_object, k)) {
                    set(target_object, k, cv);
                }
            }

            if (a.on_update) {
                a.on_update(progress, new_values, a);
            }

            if (progress >= 1) {
                if (a.on_complete) {
                    a.on_complete();
                }

                a.resolved = true
                a.resolve()
                delete this.active_animations[k];
            }

            this.globals.need_render = true
        }
    }
}

export default Animator;
