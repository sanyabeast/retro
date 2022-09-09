<template>
    <div class="app">

        <div class="level-selection">
            <h2>Level Selection</h2>
            <div v-for="(item, index) in scenes" class="button" :class="{ active: active_scene_index === index }"
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
        <DefaultScene v-if="active_scene_index === 0" />
        <OneMoreScene v-if="active_scene_index === 1" />
        <EvenOneMoreScene v-if="active_scene_index === 2" />
        <Cornell v-if="active_scene_index === 3" />

    </div>
</template>
<script>

import DefaultScene from "./scenes/RetroCity"
import OneMoreScene from "./scenes/BikeClub"
import EvenOneMoreScene from "./scenes/VillageHouse"
import Cornell from "./scenes/CornellBox"

import { isNumber } from "lodash-es"

export default {
    name: "Main",
    components: { DefaultScene, OneMoreScene, EvenOneMoreScene, Cornell },
    data() {
        return {
            default_orbit_control_params: {
                position: [0.929241595859249, 1.8136047161671325, 2.274839086785093],
                target: [0.03767997569932003, 0.7096796787072052, 0.0013812853566007584],
                zoom: 1
            },
            active_scene_index: 0,
            scenes: [
                {
                    name: "Retro City",
                    time: 0.7,
                    day_speed: 16,
                    fov: 100,
                    orbit: {
                        position: [-11.294560793680253, 0.1889378449363967, -1.8473739934966689],
                        target: [-10.054951874718869, 0.6395549681604925, -0.3840704194996165]
                    }
                },
                {
                    name: "Bike Club",
                    time: 0.5,
                    day_speed: 2048,
                    fov: 30,
                    orbit: {
                        position: [4.478374654333801, -0.15902620548700136, -2.4388380423563714],
                        target: [0.803509710406148, 0.4675825987034759, 0.8322525554630225]
                    }
                },
                {
                    name: "Village House",
                    time: 0.6,
                    day_speed: 0,
                    fov: 20,
                    orbit: {
                        position: [16.619918756677336, 2.656135238693106, -15.688689921895433],
                        target: [1.636843780338092, 3.7179910781808103, -1.2230025832643918]
                    }
                },
                {
                    name: "Cornell Box",
                    time: 0.6,
                    day_speed: 0,
                    fov: 75,
                    orbit: {
                        position: [0.6771750234492657, 0.713310910409051, -2.203436932973154],
                        target: [-0.14573447685923396, 0.8348631412120733, 1.749587158542458]
                    }
                }
            ]
        }
    },
    watch: {
        active_scene_index(new_index) {
            this.init_scene(new_index)
        }
    },
    computed: {
        active_scene() {
            return this.scenes[this.active_scene_index]
        }
    },
    mounted() {
        this.init_scene(this.active_scene_index)
    },
    methods: {
        init_scene() {
            let scene_data = this.scenes[this.active_scene_index]
            if (isNumber(scene_data.fov)) {
                this.globals.camera.fov = scene_data.fov
                this.globals.camera.updateProjectionMatrix();
            }
        },
        set_active_scene_index(index) {
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