<template>
    <div>
        <R_Object>
            <R_Sun :params="{
                global_intensity: 1,
                cycling: 16,
                time: 0.7,
            }" />
            <R_MapControlsComponent :params="{
                position: [-11.294560793680253, 0.1889378449363967, -1.8473739934966689],
                target: [-10.054951874718869, 0.6395549681604925, -0.3840704194996165]
            }" />
            <R_SkyBox :params="{
                cubemap: 'res/retro/plugins/extra-assets/cubemaps/tantolunden_1',
                cubemap_format: 'jpg'
            }" />
            <R_Fog :params="{
                density: 0.03
            }" />
            <R_Object :params="{
                rotation: [0, 0, 0],
            }">
                <R_MeshRenderer :params="{
                    scale: 0.1,
                    rotation: [0, 3.14, 0],
                    position: [-20, 0, -20],
                    src: 'res/demo_alt/models/city/scene.gltf',
                    override_texture_filter: 'NearestFilter',
                    emission_scale: 0
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
    name: "RetroCity",
    mixins: [BaseScene],
    data() {
        return {
            fov: 90
        }
    },
    mounted() { },
    methods: {}
}
</script>
<style>

</style>