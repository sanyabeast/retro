<template>
    <div>
        <R_Object>
            <R_SkyBox :params="{
                cubemap: 'res/retro/plugins/extra-assets/cubemaps/tantolunden_1',
                cubemap_format: 'jpg'
            }" />

            <R_Object :params="{
                rotation: [0, 0, 0],
            }">
                <R_MeshRenderer :params="{
                    scale: 10,
                    rotation: [0, 3.14, 0],
                    position: [-466, -35, -31],
                    src: 'res/demo_alt/models/autumn_forest_wooden_house/scene.gltf',
                }" />
                <R_LightComponent :params="{
                    type: 'PointLight',
                    position: [
                        6,
                        3.6,
                        -1
                    ],
                    intensity: 5,
                    distance: 15,
                    color: '#ffffdd'
                }" />
                <R_TroikaTextComponent :params="{
                    text: 'Melodija 105` by Warkarma',
                    position: [-1, 2, 0],
                    font_size: 0.05,
                    rotation: [0, 3.14, 0],
                }" />
            </R_Object>
        </R_Object>
    </div>
</template>
<script>
    export default {
        name: "EvenOneMoreScene",
        data() {
            return {
                light_colors: ["#e91e63", "#03a9f4", "#3f51b5"],
                time: 0
            }
        },
        mounted() {
            this.retro.tick_rate = 30
            console.log(this)
        },
        methods: {
            math_sin(v) {
                return Math.sin(v)
            },
            math_cos(v) {
                return Math.cos(v)
            },
            on_tick(time_data) {
                this.time += time_data.delta
            }
        }
    }
</script>
<style>
</style>