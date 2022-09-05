<template>
    <div>
        <R_Object>
            <R_SkyBox :params="{
                cubemap: 'res/retro/plugins/extra-assets/cubemaps/nissi_beach_1',
                cubemap_format: 'jpg'
            }" />
            <R_Fog :params="{
                density: 0.05
            }" />
            <R_Object :params="{
                rotation: [0, 0, 0],
            }">
                <R_MeshRenderer :params="{
                    scale: 1,
                    rotation: [0, 3.14, 0],
                    position: [0, 0.35, 0],
                    src: 'res/demo_alt/models/cyberpunk_bike_concept_design/scene.gltf',
                }" />
                <R_MeshRenderer :params="{
                    scale: 1,
                    rotation: [0, 2, 0],
                    position: [2, 0.35, 1],
                    src: 'res/demo_alt/models/cyberpunk_bike_concept_design/scene.gltf',
                }" />
                <R_TroikaTextComponent :params="{
                    text: '`Wizard Table` by Asylum Nox',
                    position: [0.5, 2, -0.5],
                    font_size: 0.05,
                    rotation: [0, 0, 0],
                }" />
            </R_Object>
        </R_Object>
    </div>
</template>
<script>
export default {
    name: "OneMoreScene",
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