<template>
    <div class="app">
        <R_Sun :params="{
            use_postfx: false,
            debug_transform: true,
            global_intensity: 1,
            cycling: 512,
            time: 0.5,
        }"/>
        <R_Fog :params="{
            density: 0.02
        }"/>
        <R_SkyBox :params="{
            cubemap: 'res/retro/plugins/extra-assets/cubemaps/nalovardo_1',
            cubemap_format: 'jpg'
        }"/>

        <R_Object>
            <R_MeshRenderer :params="{
                scale: 0.2,
                rotation: [0, 3.14, 0],
                position: [0, 0.35, 0],
                src: 'res/demo_alt/models/wizard_table/scene.gltf',
            }"/>
            <R_LightComponent :params="{
                type: 'RectAreaLight',
                position: [0, 2.2, 0],
                rotation: [-1.5707, 0, 0],
                rect_width: 0.5,
                rect_height: 0.5,
                intensity: 75
            }"/>
            <R_TroikaTextComponent :params="{
                text: '`Wizard Table` by Asylum Nox',
                position: [0.5, 2, -0.5],
                font_size: 0.05,
                rotation: [0, 0, 0],
            }"/>
        </R_Object>

    </div>
</template>
<script>
    export default {
        name: "Main"
    }
</script>
<style lang="scss">
    .app { 
        width: 100%;
        height: 100%;
    }
</style>