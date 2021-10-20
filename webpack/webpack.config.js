"use strict";

const path = require("path");
const root = path.join(__dirname, "..");
const merge = require("webpack-merge");
const { VueLoaderPlugin } = require('vue-loader');
const { webpack, DefinePlugin } = require("webpack");
const package_data = require("../package.json")
const CopyPlugin = require("copy-webpack-plugin");



module.exports = (env) => {
    const APP_NAME = env.APP_NAME
    console.log(`APP_NAME: ${APP_NAME}`)
    let define_plugin_params = {}

    for (let k in process.env){
        define_plugin_params[`process.env.${k}`] = JSON.stringify(process.env[k])
    }

    define_plugin_params["PACKAGE_DATA"] = JSON.stringify(package_data)
    define_plugin_params[`process.env.APP_NAME`] = JSON.stringify(APP_NAME)

    let config = {
        entry: {
            main: path.join(root, "src", "main"),
        },
        output: {
            filename: "[name].js",
            path: path.join(root, `dist`, APP_NAME),
            libraryTarget: "umd",
            library: "lib",
            umdNamedDefine: true,
        },
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
                    { from: `src/core/res`, to: `res/core` },
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
                three: 'core/lib/three'
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

    console.log(`Build mode: \x1b[33m${config.mode}\x1b[0m`);
    return config;
};

function getAddons(env) {
    if (!env || !env.addons) return [];
    if (typeof env.addons === "string") return [env.addons];
    return env.addons;
}
