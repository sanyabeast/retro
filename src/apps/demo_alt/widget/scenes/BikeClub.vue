<template>
    <div>
        <R_Object>
            <R_Sun :params="{
                global_intensity: 1,
                cycling: 1024,
                time: 0.5,
            }" />
            <R_OrbitControlsComponent :params="{
                position: [4.478374654333801, -0.15902620548700136, -2.4388380423563714],
                target: [0.803509710406148, 0.4675825987034759, 0.8322525554630225]
            }" />
            <R_SkyBox :params="{
                cubemap: 'res/retro/plugins/extra-assets/cubemaps/nissi_beach_1',
                cubemap_format: 'jpg',
                cubemap_gamma: 1.2
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

import BaseScene from "./BaseScene"

export default {
    name: "OneMoreScene",
    mixins: [BaseScene],
    data() {
        return {
            fov: 45
        }
    },
    mounted() { },
    methods: {}
}
</script>
<style>

</style>