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

function log() { console.log(`[RETRO] [i]`.green, ...arguments); }
function warn() { console.log(`[RETRO] [*]`.yellow, ...arguments); }
function err() { console.log(`[RETRO] [!]`.red, ...arguments); }

function load_preset(app_name) {
    log(`loading preset for "${app_name}"`)
    let default_preset = yamlfile.readFileSync(
        path.join(root, "src", "retro", "PRESET.yaml")
    )
    let preset = undefined
    let error_code = undefined
    try {
        preset = yamlfile.readFileSync(
            path.join(root, 'src', 'apps', app_name, "PRESET.yaml")
        )
        preset = {
            ...default_preset,
            ...preset
        }
    } catch (err) {
        error_code = err.code
        err(err.code)
    }

    if (!preset) {
        preset = { ...default_preset }
        if (error_code === 'ENOENT') {
            warn(`Preset not found. Creating new one with default settings...`)
            yamlfile.writeFileSync(
                path.join(root, 'src', 'apps', app_name, "PRESET.yaml"),
                preset
            )
        }
    }
    log(`preset: ${JSON.stringify(preset, null, '\t')}`)
    return preset
}

function get_output_config(app_name, preset) {
    let output_path
    if (preset.IS_EXAMPLE) {
        output_path = path.join(root, `dist`, app_name)
    } else {
        output_path = path.join(root, `src`, 'apps', app_name, 'dist')
    }
    log(`"${app_name}" is bundled to "${output_path}"`)
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
    const preset = load_preset(APP_NAME)
    log(`working on app "${APP_NAME}"...`)
    let define_plugin_params = {}

    for (let k in process.env) {
        define_plugin_params[`process.env.${k}`] = JSON.stringify(process.env[k])
    }

    define_plugin_params["PACKAGE_DATA"] = JSON.stringify(package_data)
    define_plugin_params[`process.env.APP_NAME`] = JSON.stringify(APP_NAME)
    define_plugin_params[`PRESET`] = JSON.stringify(preset)

    let config = {
        entry: {
            main: path.join(root, "src", "main"),
        },
        output: get_output_config(APP_NAME, preset),
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
                }
            ],
        },
        plugins: [
            new CopyPlugin({
                patterns: [
                    { from: `src/apps/${APP_NAME}/res`, to: `res/${APP_NAME}` },
                    { from: `src/retro/res`, to: `res/retro` },
                ]
            }),
            new VueLoaderPlugin(),
            new DefinePlugin(define_plugin_params)
        ],
        devServer: {
            overlay: true,
            host: "192.168.0.107"
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
    config = merge.smart(
        config,
        require(path.join(root, "webpack", "builds", `webpack.config.${build}`))
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
