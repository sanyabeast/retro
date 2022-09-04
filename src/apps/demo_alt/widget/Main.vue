<template>
    <div class="app">

        <div class="level-selection">
            <h2>Level Selection</h2>
            <div v-for="(item, index) in scenes" class="button" :class="{active: active_scene_index === index}"
                :key="index" @mousedown="set_active_scene_index(index)">
                <p v-html="item.name"></p>
            </div>
        </div>

        <R_Sun :params="{
            use_postfx: false,
            debug_transform: true,
            global_intensity: 1,
            cycling: active_scene.day_speed,
            time: active_scene.time,
        }" />

        <R_OrbitControlsComponent :params="active_scene.orbit ?? default_orbit_control_params" />

        <R_Fog :params="{
            density: 0.02
        }" />

        <DefaultScene v-if="active_scene_index === 0" />
        <OneMoreScene v-if="active_scene_index === 1" />
        <EvenOneMoreScene v-if="active_scene_index === 2" />

    </div>
</template>
<script>

import DefaultScene from "./comps/DefaultScene"
import OneMoreScene from "./comps/OneMoreScene"
import EvenOneMoreScene from "./comps/EvenOneMoreScene"

export default {
    name: "Main",
    components: { DefaultScene, OneMoreScene, EvenOneMoreScene },
    data() {
        return {
            default_orbit_control_params: {
                position: [0.929241595859249, 1.8136047161671325, 2.274839086785093],
                target: [0.03767997569932003, 0.7096796787072052, 0.0013812853566007584],
                zoom: 1
            },
            active_scene_index: 1,
            scenes: [
                {
                    name: "Default",
                    time: 0.2,
                    day_speed: 0,
                    orbit: {
                        position : [-0.804327808109709, 1.1654925486072987, 1.5054976510375697],
                        target : [-0.06468297831367632, 0.6248641020499907, -0.018214616625668166]
                    }
                },
                {
                    name: "One More",
                    time: 0.5,
                    day_speed: 2048,
                    orbit: {
                        position: [-1.1978937228860436, 0.5976177295902825, 2.2044420170181827],
                        target: [-0.07080320746888534, 0.4503999418148126, -0.22251840267729847]
                    }
                },
                {
                    name: "Even One More",
                    time: 0.65,
                    day_speed: 64,
                    orbit: {
                        position: [5.660666380532865, 5.032615474101596, -7.424760544009651],
                        target: [3.20915372639969, 1.6426733064675614, 1.2838366079394254]
                    }
                }
            ]
        }
    },
    computed: {
        active_scene(){
            return this.scenes[this.active_scene_index]
        }
    },
    mounted() {

    },
    methods: {
        set_active_scene_index(index){
            console.log(index)
            this.active_scene_index = index
        }
    }
}
</script>
<style lang="scss">
.app {
    width: 100%;
    height: 100%;

    .level-selection {

        color: #fff;
        font-size: 16px;
        font-family: monospace;
        display: flex;
        flex-direction: column;
        position: absolute;
        top: 16px;
        left: 16px;
        width: 200px;
        padding: 8px 5px;
        border-radius: 4px;

        >* {
            transition: all 0.2s ease-in-out;
            opacity: 0;
            transform: scale(0);
        }

        &:after {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: #00000014;
            border-radius: 4px;
            border: 1px solid #ffffff42;
            pointer-events: none;
            transition: opacity 0.1s ease-out;
        }

        &:hover {
            background: rgba($color: #000000, $alpha: 0.33);

            >* {
                opacity: 1;
                transform: scale(1);
            }

            &:after {
                opacity: 0;
            }
        }

        h2 {
            font-size: 16px;
            margin: 0;
            margin-bottom: 8px;
            border-bottom: 1px dotted #878787;
            align-self: flex-start;
            color: #cdcdcd;
        }

        .button {
            cursor: pointer;
            border: 1px solid #878787;
            padding: 4px;
            margin: 4px 0;
            border-radius: 4px;
            background: #00000026;
            color: #adadad;

            p {
                margin: 0;
            }

            &.active {
                border-color: #eee;
                color: #ffb100;
            }
        }
    }
}
</style>