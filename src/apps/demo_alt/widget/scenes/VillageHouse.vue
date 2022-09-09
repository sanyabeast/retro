<template>
    <div>
        <R_Object>
            <R_Sun :params="{
                global_intensity: 1,
                cycling: 8,
                time: 0.6,
            }" />
            <R_MapControlsComponent :params="{
                position: [16.619918756677336, 2.656135238693106, -15.688689921895433],
                target: [1.636843780338092, 3.7179910781808103, -1.2230025832643918]
            }" />
            <R_SkyBox :params="{
                cubemap: 'res/retro/plugins/extra-assets/cubemaps/tantolunden_1',
                cubemap_format: 'jpg'
            }" />
            <R_Fog :params="{
                density: 0.01
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

import BaseScene from "./BaseScene"

export default {
    name: "VillageHouse",
    mixins: [BaseScene],
    data() {
        return {
            fov: 30
        }
    },
    mounted() { },
    methods: {}
}
</script>
<style>

</style>