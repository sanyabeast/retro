<template>
    <div>
        <R_Object>
            <R_Sun :params="{
                global_intensity: 0.5,
                cycling: 16,
                time: 0.1,
            }" />
            <R_OrbitControlsComponent :params="{
                position: [0.6771750234492657, 0.713310910409051, -2.203436932973154],
                target: [-0.14573447685923396, 0.8348631412120733, 1.749587158542458]
            }" />
            <R_SkyBox :params="{
                cubemap: 'res/retro/plugins/extra-assets/cubemaps/nalovardo_1',
                cubemap_format: 'jpg',
                cubemap_gamma: 0.1
            }" />
            <R_Fog :params="{
                density: 0.01
            }" />
            <R_Object :params="{
                rotation: [0, 0, 0],
            }">
                <R_MeshRenderer :params="{
                    scale: 1,
                    rotation: [0, 3.14, 0],
                    position: [0, 0, 0],
                    src: 'res/retro/plugins/extra-assets/models/cornell_box_b/scene.gltf',
                    emission_scale: 0
                }" />
            </R_Object>
        </R_Object>
    </div>
</template>
<script>

import BaseScene from "./BaseScene"

export default {
    name: "CornellBox",
    mixins: [BaseScene],
    data() {
        return {
            fov: 75
        }
    },
    mounted() { },
    methods: {}
}
</script>
<style>

</style>