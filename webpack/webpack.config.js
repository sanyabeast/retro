"use strict";

const path = require("path");
const root = path.join(__dirname, "..");
const merge = require("webpack-merge");
const { VueLoaderPlugin } = require('vue-loader');
const { webpack, DefinePlugin } = require("webpack");
const package_data = require("../package.json")
const CopyPlugin = require("copy-webpack-plugin");
const dir_tree = require("directory-tree");
const jsonfile = require('jsonfile')
const yamlfile = require('yamlfile')
const colors = require("colors")
const ip = require('ip');
const fs = require("fs")
const fs_extra = require('fs-extra');

function log() { console.log(`[RETRO] [i]`.green, ...arguments); }
function warn() { console.log(`[RETRO] [*]`.yellow, ...arguments); }
function err() { console.log(`[RETRO] [!]`.red, ...arguments); }
log

function get_copy_plugin_patterns(APP_NAME, PRESET) {
    let r = [
        { from: `src/retro/res`, to: `res/retro` },
    ]

    let plugins = PRESET.PLUGINS || []
    plugins.forEach((plugin_name) => {
        let full_path
        if (plugin_name === "retro") {
            full_path = `src/retro/res`
        } else if (plugin_name.startsWith("retro/")) {
            full_path = `src/${plugin_name}/res`
        } else {
            full_path = `src/apps/${plugin_name}/res`
        }

        let res_directory_exists = fs.existsSync(path.join(root, full_path))
        log(`res directory for "${plugin_name} exists: ${res_directory_exists}"`)
        if (!res_directory_exists) {
            fs.mkdirSync(path.join(root, full_path), { recursive: true }) 
        }
        fs_extra.copySync(path.join(root, "src/retro/res/1x1_black.png"), path.join(root, full_path, "1x1_black.png"));
        r.push({ from: full_path, to: `res/${plugin_name}` })
    })

    r.push({ from: `src/apps/${APP_NAME}/res`, to: `res/${APP_NAME}` })
    log(`copy patterns:\n${JSON.stringify(r, null, "\t")}`)

    return r
}

function load_preset(APP_NAME) {
    log(`loading preset for "${APP_NAME}"`)
    let default_preset = yamlfile.readFileSync(
        path.join(root, "src", "retro", "PRESET.yaml")
    )

    let PRESET = undefined
    let error_code = undefined
    try {
        PRESET = yamlfile.readFileSync(
            path.join(root, 'src', 'apps', APP_NAME, "PRESET.yaml")
        )
        PRESET = {
            ...default_preset,
            ...PRESET
        }
    } catch (e) {
        error_code = e.code
        err(e.code)
    }

    if (!PRESET) {
        PRESET = { ...default_preset }
        if (error_code === 'ENOENT') {
            warn(`Preset not found. Creating new one with default settings...`)
            yamlfile.writeFileSync(
                path.join(root, 'src', 'apps', APP_NAME, "PRESET.yaml"),
                PRESET
            )
        }
    }
    log(`preset: ${JSON.stringify(PRESET, null, '\t')}`)
    return PRESET
}

function get_output_config(APP_NAME, PRESET) {
    let output_path
    if (PRESET.IS_EXAMPLE) {
        output_path = path.join(root, `dist`, APP_NAME)
    } else {
        output_path = path.join(root, `src`, 'apps', APP_NAME, 'dist')
    }
    log(`"${APP_NAME}" is bundled to "${output_path}"`)
    return {
        filename: "[name].js",
        path: output_path,
        libraryTarget: "umd",
        library: "lib",
        umdNamedDefine: true,
    }
}

module.exports = (env) => {
    const APP_NAME = env.APP_NAME
    const PRESET = load_preset(APP_NAME)
    log(`working on app "${APP_NAME}"...`)
    let define_plugin_params = {}

    env.PRESET = PRESET
    for (let k in process.env) {
        define_plugin_params[`process.env.${k}`] = JSON.stringify(process.env[k])
    }

    define_plugin_params["PACKAGE_DATA"] = JSON.stringify(package_data)
    define_plugin_params[`process.env.APP_NAME`] = JSON.stringify(APP_NAME)
    define_plugin_params[`PRESET`] = JSON.stringify(PRESET)

    let config = {
        stats: { assets: false },
        entry: {
            main: path.join(root, "src", "main"),
        },
        output: get_output_config(APP_NAME, PRESET),
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules|lib/,
                    use: "babel-loader",
                },
                {
                    test: /\.html$/,
                    exclude: /node_modules/,
                    loader: "file-loader",
                    options: {
                        name: "[name].[ext]",
                    },
                },
                {
                    test: /\.ya?ml$/,
                    type: "json", // Required by Webpack v4
                    use: "yaml-loader",
                },
                {
                    test: /\.png$/,
                    exclude: /node_modules|lib|res|dist/,
                    use: "base64-image"
                },
                {
                    test: /\.vue$/,
                    loader: 'vue-loader'
                },
                {
                    test: /\.css$/,
                    use: [
                        'vue-style-loader',
                        'css-loader'
                    ]
                },
                {
                    test: /\.less$/i,
                    loader: [
                        // compiles Less to CSS
                        "vue-style-loader",
                        "css-loader",
                        "sass-loader",
                    ],
                },
                {
                    test: /\.scss$/,
                    use: [
                        'vue-style-loader',
                        'css-loader',
                        'sass-loader'
                    ]
                },
                {
                    test: /\ResourceManager.js$/,
                    loaders: path.join(root, "scripts", "assets-loader.js"),
                    options: {
                        app_name: APP_NAME,
                        plugins: ["retro", ...(PRESET.PLUGINS || []), `apps/${APP_NAME}`]
                    }
                },
                {
                    test: /\.(jpe?g|png|webp)$/i,
                    use: [
                        {
                            loader: 'responsive-loader',
                            options: {
                                adapter: require('responsive-loader/sharp')
                            }
                        }
                    ]
                }
            ],
        },
        plugins: [
            new CopyPlugin({
                patterns: get_copy_plugin_patterns(APP_NAME, PRESET)
            }),
            new VueLoaderPlugin(),
            new DefinePlugin(define_plugin_params)
        ],
        devServer: {
            overlay: true,
            host: "0.0.0.0"
        },
        resolve: {
            modules: ["src", "lib", "node_modules", "dist"],
            alias: {
                "@": path.resolve(__dirname, "src"),
                vue: 'vue/dist/vue.js',
                three: 'retro/lib/three',
                "../../../build/three.module.js": "retro/lib/three"
            },
        },
    };

    // Builds
    const build = env && env.production ? "prod" : "dev";
    const mode_config = require(path.join(root, "webpack", "builds", `webpack.config.${build}`))
    console.log(mode_config)
    config = merge.smart(
        config,
        typeof mode_config === "function" ? mode_config({
            APP_NAME,
            PRESET
        }) : mode_config
    );

    // Addons
    const addons = getAddons(env);
    addons.forEach((addon) => {
        config = merge.smart(
            config,
            require(path.join(root, "webpack", "addons", `webpack.${addon}`))
        );
    });

    log(`Build mode: \x1b[33m${config.mode}\x1b[0m`);
    return config;
};

function getAddons(env) {
    if (!env || !env.addons) return [];
    if (typeof env.addons === "string") return [env.addons];
    return env.addons;
}
