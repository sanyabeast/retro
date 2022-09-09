<template>
    <div>
        <R_Object>
            <R_Sun :params="{
                global_intensity: 1,
                cycling: 1,
                time: 0.25,
            }" />
            <R_OrbitControlsComponent :params="{
                position:[-0.1752421164654105, 1.0710630744243492, 2.640019650461639],
                target:[0.0035584294804567322, 0.9388281297505157, 0.876047726004135]
            }" />
            <R_SkyBox :params="{
                cubemap: 'res/retro/plugins/extra-assets/cubemaps/cntower_1',
                cubemap_format: 'jpg',
                cubemap_gamma: 2
            }" />
            <R_Fog :params="{
                density: 0.03
            }" />

            <R_Object :params="{
                rotation: [0, 0, 0],
            }">
                <R_MeshRenderer :params="{
                    scale: 1,
                    rotation: [0, 0, 0],
                    position: [0, 0, 0],
                    src: 'res/retro/plugins/extra-assets/models/xbot.glb',
                    emission_scale: 0
                }" />
            </R_Object>
        </R_Object>
    </div>
</template>
<script>

import BaseScene from "./BaseScene"

export default {
    name: "Skinning",
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