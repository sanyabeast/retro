
/** created by @sanyabeast | 25 Aug 2022 */

/** imports */
const _ = require('lodash')
const path = require('path');
const root = path.join(__dirname, '..');
const PACKAGE_DATA = require('../package.json')
const fs = require('fs')
const fs_extra = require('fs-extra');
const yamlfile = require('yamlfile')
const jsonfile = require('jsonfile')
const color = require("colors")
const get_repo_info = require('git-repo-info')
const dir_tree = require("directory-tree")
/* --- */

console.log(
    '_____ _____ _____ _____ _____              \n'.yellow +
    '| __  |   __|_   _| __  |     |            \n'.yellow +
    '|    -|   __| | | |    -|  |  |            \n'.yellow +
    '|__|__|_____| |_| |__|__|_____| '.blue + `v. ${PACKAGE_DATA.version}\n`.yellow +
    '- - - - - - - - - - - - - - - - - - - - - - - \n'.yellow +
    'https://github.com/sanyabeast/retro\n'.yellow
);

let tools

class Tools {
    constructor() {
        tools = this
    }
    log() { console.log(`[RETRO] [i]`.yellow, ...arguments); }
    warn() { console.log(`[RETRO] [*]`.yellow, ...arguments); }
    err() { console.log(`[RETRO] [!]`.yellow, ...arguments); }


    resolve_plugin_path(plugin_alias, ...extras){
        let ret = ''
        if (plugin_alias === 'retro') {
            ret = `src/retro`
        } else if (plugin_alias.startsWith('retro/')) {
            ret = `src/${plugin_alias}`
        } else if (plugin_alias.startsWith('apps/')) {
            ret = `src/${plugin_alias}`
        } else {
            ret = `src/apps/${plugin_alias}`
        }
        return path.join(ret, ...extras)
    }

    resolve_plugin_abspath(plugin_alias, ...extras){
        return path.join(root, this.resolve_plugin_path(plugin_alias, ...extras))
    }

    get_copy_plugin_patterns(APP_NAME, PRESET) {
        let r = [
            { from: `src/retro/res`, to: `res/retro` },
        ]

        let plugins = PRESET.PLUGINS || []
        plugins.forEach((plugin_name) => {
            let res_folder_path = `${this.resolve_plugin_path(plugin_name)}/res`
            let res_directory_exists = fs.existsSync(path.join(root, res_folder_path))
            this.log(`res directory for '${plugin_name} exists: ${res_directory_exists}'`)
            if (!res_directory_exists) {
                fs.mkdirSync(path.join(root, res_folder_path), { recursive: true })
            }
            fs_extra.copySync(path.join(root, 'src/retro/res/1x1_black.png'), path.join(root, res_folder_path, '1x1_black.png'));
            r.push({ from: res_folder_path, to: `res/${plugin_name}` })
        })

        r.push({ from: `src/apps/${APP_NAME}/res`, to: `res/${APP_NAME}` })
        this.log(`copy patterns:\n`.white + _.map(r, (data, index) => `    #${index}: ${data.from} -> ${data.to}`.magenta).join('\n'))

        return r
    }

    load_preset(APP_NAME) {
        tools.log(`loading preset for '${APP_NAME}'`)
        let default_preset = yamlfile.readFileSync(
            path.join(root, 'src', 'retro', 'PRESET.yaml')
        )

        let PRESET = undefined
        let error_code = undefined
        try {
            PRESET = yamlfile.readFileSync(
                path.join(root, 'src', 'apps', APP_NAME, 'PRESET.yaml')
            )
            PRESET = {
                ...default_preset,
                ...PRESET
            }
        } catch (e) {
            error_code = e.code
            console.error(e.code)
        }

        if (!PRESET) {
            PRESET = { ...default_preset }
            if (error_code === 'ENOENT') {
                tools.warn(`Preset not found. Creating new one with default settings...`)
                yamlfile.writeFileSync(
                    path.join(root, 'src', 'apps', APP_NAME, 'PRESET.yaml'),
                    PRESET
                )
            }
        }
        tools.log(`preset:\n`.white + _.map(PRESET, (data, index) => `    ${index} = ${data}`.magenta).join('\n'))
        tools.log(`used plugins:\n`.white + _.map(PRESET.PLUGINS, (data, index) => `   #${index}: ${data}`.magenta).join("\n"))
        return PRESET
    }
    get_output_config(APP_NAME, PRESET) {
        let output_path
        if (PRESET.IS_EXAMPLE) {
            output_path = path.join(root, `dist`, APP_NAME)
        } else {
            output_path = path.join(root, `src`, 'apps', APP_NAME, 'dist')
        }
        tools.log(`'${APP_NAME}' is bundled to '${output_path}'`)

        return {
            filename: '[name].js',
            path: output_path,
            libraryTarget: 'umd',
            library: 'lib',
            umdNamedDefine: true,
        }
    }
    get_repo_info(repo_path) {
        let r = get_repo_info(repo_path)
        tools.log(`REPO "${repo_path ?? "retro"}":\n`, r)
        return r
    }
    generate_defines(env, APP_NAME) {
        const ret = {}
        let PRESET = tools.load_preset(APP_NAME)

        for (let k in process.env) {
            ret[`process.env.${k}`] = JSON.stringify(process.env[k])
        }

        // ret['__VUE_OPTIONS_API__'] = false
        // ret['__VUE_PROD_DEVTOOLS__'] = false
        let REPO_RETRO = this.get_repo_info()
        let REPO_APP = this.get_repo_info(path.join(root, `src`, 'apps', APP_NAME))

        ret['PACKAGE_DATA'] = JSON.stringify(PACKAGE_DATA)
        ret['process.env.APP_NAME'] = JSON.stringify(APP_NAME)
        ret['PRESET'] = JSON.stringify(PRESET)
        ret['REPO_RETRO'] = JSON.stringify(REPO_RETRO)
        ret['REPO_APP'] = JSON.stringify(REPO_APP)
        ret['IS_DEV'] = JSON.stringify(!env.production)
        ret['IS_PROD'] = JSON.stringify(!!env.production)
        ret['VERSION_TAG'] = JSON.stringify(`${REPO_APP.abbreviatedSha}:${REPO_RETRO.abbreviatedSha}`)

        return ret
    }
    /** ts */
    update_typescript_config(env, APP_NAME) {
        let PRESET = tools.load_preset(APP_NAME)
        let programs_list = this.get_programs_list()
        let unused_programs = []
        let ts_config = jsonfile.readFileSync(path.join(root, 'webpack', '.tsconfig.json'))
        let app_path = `apps/${APP_NAME}`

        programs_list.forEach((program_path) => {
            let used = false
            if (program_path === app_path) {
                used = true
            } else {
                if (PRESET.PLUGINS) {
                    PRESET.PLUGINS.forEach((p_path) => {
                        if (p_path === program_path) {
                            used = true
                        }
                    })
                }
            }

            if (!used) {
                unused_programs.push(program_path)
            }
        })

        ts_config.exclude = ["node_modules"].concat(_.map(unused_programs, (prog_path) => {
            return `src/${prog_path}`
        }))

        jsonfile.writeFile(path.join(root, 'tsconfig.json'), ts_config, { spaces: 4 })
    }
    get_programs_list() {
        return this.get_plugins_list().concat(this.get_apps_list())
    }
    get_apps_list() {
        let data = dir_tree(path.join(root, 'src', 'apps'))
        let list = []
        function traverse(item, parent) {
            if (item.name == "PRESET.yaml") {
                list.push(path.relative(root, parent.path).replace(/\\/gi, "/").replace("src/", ""))
            } else {
                if (item.children) {
                    item.children.forEach((child, index) => {
                        traverse(child, item)
                    })
                }
            }
        }
        traverse(data)
        return list
    }
    get_plugins_list() {
        let data = dir_tree(path.join(root, 'src', 'retro', 'plugins'))
        let list = []
        function traverse(item, parent) {
            if (item.name == "PRESET.yaml") {
                list.push(path.relative(root, parent.path).replace(/\\/gi, "/").replace("src/", ""))
            } else {
                if (item.children) {
                    item.children.forEach((child, index) => {
                        traverse(child, item)
                    })
                }
            }
        }
        traverse(data)
        return list
    }
    load_schema_lib(env, APP_NAME){
        console.log(`loading schema lib for ${APP_NAME}`)
        let ret = {}
        let PRESET = this.load_preset(APP_NAME)
        let programs = ['retro', ...(PRESET.PLUGINS ?? []), `src/apps/${APP_NAME}`]
        programs.forEach((plugin_alias, index)=>{
            if (fs.existsSync(path.join(this.resolve_plugin_abspath(plugin_alias, "SCHEMA.yaml")))) {
                let program_schema_lib = yamlfile.readFileSync(path.join(this.resolve_plugin_abspath(plugin_alias, "SCHEMA.yaml")));
                if (_.isObject(program_schema_lib.$)){
                    for (let k in program_schema_lib.$){
                        ret[k] = program_schema_lib.$[k]
                    }
                }
            }
        })
        return ret
    }
}

module.exports = new Tools()