<template>
    <div>
        <R_Object>
            <R_SkyBox :params="{
                cubemap: 'res/retro/plugins/extra-assets/cubemaps/nalovardo_1',
                cubemap_format: 'jpg'
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
export default {
    name: "Cornell",
    data() {
        return {

        }
    },
    mounted() {

    },
    methods: {

    }
}
</script>
<style>
</style>