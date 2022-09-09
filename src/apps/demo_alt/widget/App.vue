<template>
    <div class="app">

        <div class="level-selection">
            <h2>Level Selection</h2>
            <div v-for="(item, index) in scenes" class="button" :class="{ active: active_scene_index === index }"
                :key="index" @mousedown="active_scene_index = index">
                <p v-html="item.name"></p>
            </div>
        </div>

        <RetroCityScene v-if="active_scene_index === 0" />
        <BikeClubScene v-if="active_scene_index === 1" />
        <VillageHouseScene v-if="active_scene_index === 2" />
        <CornellBoxScene v-if="active_scene_index === 3" />
        <Skinning v-if="active_scene_index === 4" />

    </div>
</template>
<script>

import RetroCityScene from "./scenes/RetroCity"
import BikeClubScene from "./scenes/BikeClub"
import VillageHouseScene from "./scenes/VillageHouse"
import CornellBoxScene from "./scenes/CornellBox"
import Skinning from "./scenes/Skinning"

import { isNumber } from "lodash-es"

export default {
    name: "Main",
    components: { RetroCityScene, BikeClubScene, VillageHouseScene, CornellBoxScene, Skinning },
    data() {
        return {
            active_scene_index: 0,
            scenes: [
                {
                    name: "Retro City"
                },
                {
                    name: "Bike Club"
                },
                {
                    name: "Village House"
                },
                {
                    name: "Cornell Box"
                },
                {
                    name: "Skinning"
                }
            ]
        }
    },
    watch: {},
    computed: {},
    mounted() { },
    methods: {}
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