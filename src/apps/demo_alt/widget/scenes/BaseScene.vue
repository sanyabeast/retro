<template>
    <div></div>
</template>
<script>
export default {
    name: "BaseScene",
    data() {
        return {
            fov: 60
        }
    },
    mounted() {
        this.globals.camera.fov = this.fov;
        this.globals.camera.updateProjectionMatrix()
    },
    methods: {}
}
</script>
<style>

</style>