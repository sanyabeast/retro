const path = require("path")
const root = path.join(__dirname, "..");
const loader_utils = require('loader-utils')
const colors = require("colors")
const { forEach } = require("lodash")
const fs = require("fs")


function log() {
    console.log(`[AssetLoader] [i]`.magenta, ...arguments)
}

const placeholder_string = "/**ASSETS_LOADER_INJECTED_CODE**/"

module.exports = function (source_code, map, meta) {
    let options = loader_utils.getOptions(this)

    if (source_code.indexOf(placeholder_string) < 0) {
        this.emitError(new Error("please add '/**ASSETS_LOADER_INJECTED_CODE**/' line to retro/ResourceManager"))
        return source_code
    }

    let loaded = []
    let injected_code = `/**this code has been injected with 'scripts/assets-loader.js'**/\n`
    forEach(options.plugins, (plugin_name) => {
        if (loaded.indexOf(plugin_name) > -1) return
        let context = plugin_name
        let base_path = plugin_name
        context = context.replace("apps/", "")
        log(`loading plugin "${context}" ...`)

        injected_code += `/** PRELOADING PLUGIN: ${plugin_name.toUpperCase()}**/`


        if (fs.existsSync(path.join(root, "src", base_path, "patch")))
            injected_code += `rm.load_patches("${context}", require.context("${base_path}/patch/", true, /\.js$|\.coffee$|\.ts/));\n`
        if (fs.existsSync(path.join(root, "src", base_path, "components")))
            injected_code += `rm.preload_components("${context}", require.context("${base_path}/components/", true, /\.js$|\.coffee$|\.ts/));\n`
        if (fs.existsSync(path.join(root, "src", base_path, "materials", "classes")))
            injected_code += `rm.preload_classes("${context}", require.context("${base_path}/materials/classes", true, /\.js$|\.coffee$|\.ts/), "materials");\n`
        if (fs.existsSync(path.join(root, "src", base_path, "geometry", "classes")))
            injected_code += `rm.preload_classes("${context}", require.context("${base_path}/geometry/classes", true, /\.js$|\.coffee$|\.ts/), "geometries");\n`
        if (fs.existsSync(path.join(root, "src", base_path, "objects")))
            injected_code += `rm.preload_classes("${context}", require.context("${base_path}/objects", true, /\.js$|\.coffee$|\.ts/), "objects");\n`
        if (fs.existsSync(path.join(root, "src", base_path, "textures")))
        //     injected_code += `rm.preload_textures("${context}", require.context("${base_path}/textures/", true, /\.png$/));\n`
        // if (fs.existsSync(path.join(root, "src", base_path, "widget")))
            injected_code += `rm.preload_vue_components("${context}", require.context("${base_path}/widget/", false, /\.vue$/));\n`
        if (fs.existsSync(path.join(root, "src", base_path, "textures")))
            injected_code += `rm.preload_textures2("${context}", require.context("${base_path}/textures/", true, /\.yaml$/));\n`
        if (fs.existsSync(path.join(root, "src", base_path, "materials/lib")))
            injected_code += `rm.preload_templates_of_shader_parts("${context}", require.context("${base_path}/materials/lib/", true, /\.yaml$/));\n`
        if (fs.existsSync(path.join(root, "src", base_path, "materials")))
            injected_code += `rm.preload_materials("${context}", require.context("${base_path}/materials/", true, /\.yaml$/));\n`
        if (fs.existsSync(path.join(root, "src", base_path, "geometry")))
            injected_code += `rm.preload_geometries("${context}", require.context("${base_path}/geometry/", true, /\.yaml$/));\n`
        if (fs.existsSync(path.join(root, "src", base_path, "prefabs")))
            injected_code += `rm.preload_prefabs("${context}", require.context("${base_path}/prefabs/", true, /\.yaml$/));\n`

        injected_code += `\n\n`
        loaded.push(plugin_name)
    })

    source_code = source_code.replace(placeholder_string, injected_code)
    log(`[scipts/asset-loader] [i] injected code for\n${options.plugins.join(",\n")}`)

    return source_code
}