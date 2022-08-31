const path = require("path")
const root = path.join(__dirname, "..");
const loader_utils = require('loader-utils')
const colors = require("colors")
const { forEach, update } = require("lodash")
const fs = require("fs")
const directory_tree = require("directory-tree")
const tools = require("../webpack/tools")

function log() {
    console.log(`[AssetLoader] [i]`.magenta, ...arguments)
}

if (String.prototype.splice === undefined) {
    /**
     * Splices text within a string.
     * @param {int} offset The position to insert the text at (before)
     * @param {string} text The text to insert
     * @param {int} [removeCount=0] An optional number of characters to overwrite
     * @returns {string} A modified string containing the spliced text.
     */
    String.prototype.splice = function (offset, text, removeCount = 0) {
        let calculatedOffset = offset < 0 ? this.length + offset : offset;
        return this.substring(0, calculatedOffset) +
            text + this.substring(calculatedOffset + removeCount);
    };
}

const CURSOR_STRING = "export default"
const ASSET_INDEX = {
    items: []
}

function traverse_tree(tree, cb) {
    if (tree) {
        cb(tree, !!tree.children)
        if (tree.children) {
            if (!fs.existsSync(path.join(tree.path, '.noindex'))){
                tree.children.forEach((node) => traverse_tree(node, cb))
            }
        }
    }
}

function update_asset_index(plugins) {
    let items = []
    forEach(plugins, (plugin_name) => {
        let res_directory_data = directory_tree(path.join(root, tools.resolve_plugin_path(plugin_name), 'res'))
        traverse_tree(res_directory_data, (node, is_file)=>{
            items.push([node.path.replace(root, '').replace(/\\/gi, '/'), is_file])
        })
    })
    ASSET_INDEX.items = items
}

module.exports = function (source_code, map, meta) {

    let options = loader_utils.getOptions(this)
    update_asset_index(options.PLUGINS)

    if (source_code.indexOf(CURSOR_STRING) < 0) {
        this.emitError(new Error("please add 'export default' section to ResourceManager.js"))
        return source_code
    }

    let loaded = []
    let injected_code = `/**this code has been injected with 'scripts/assets-loader.js'**/\n`

    injected_code += `rm.load_asset_index(${JSON.stringify(ASSET_INDEX, null, "\t")})\n`

    forEach(options.PLUGINS, (plugin_name) => {
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

    injected_code += `rm.run_postload_tasks();\n`

    source_code = source_code.splice(source_code.indexOf(CURSOR_STRING), injected_code)

    return source_code
}