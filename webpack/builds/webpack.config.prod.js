"use strict";
const TerserPlugin = require("terser-webpack-plugin");
const WebpackAutoInject = require("webpack-auto-inject-version");
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const path = require("path");
const root = path.join(__dirname, "../..");

const terser_options = {
    ecma: undefined,
    parse: {},
    compress: {},
    mangle: true, // Note `mangle.properties` is `false` by default.
    module: false,
    // Deprecated
    output: null,
    format: null,
    toplevel: false,
    nameCache: null,
    ie8: false,
    keep_classnames: true,
    keep_fnames: false,
    safari10: false,
}

module.exports = (params) => {
    return {
        entry: {
            app: path.join(root, "src", "apps", params.APP_NAME, "App")
        },
        mode: "production",
        optimization: {
            minimize: true,
            minimizer: [
                new TerserPlugin({
                    terserOptions: terser_options,
                }),
            ],
        },
        plugins: [
            new TerserPlugin({
                terserOptions: terser_options,
            }),
            new WebpackAutoInject({
                // specify the name of the tag in the outputed files eg
                // bundle.js: [SHORT]  Version: 0.13.36 ...
                SHORT: "CUSTOM",
                SILENT: false,
                PACKAGE_JSON_PATH: "package.json",
                PACKAGE_JSON_INDENT: 4,
                components: {
                    AutoIncreaseVersion: true,
                    InjectAsComment: true,
                    InjectByTag: true,
                },
                componentsOptions: {
                    AutoIncreaseVersion: {
                        runInWatchMode: false, // it will increase version with every single build!
                    },
                    InjectAsComment: {
                        tag: "Version: {version} - {date}",
                        dateFormat: "h:MM:ss TT", // change timezone: `UTC:h:MM:ss` or `GMT:h:MM:ss`
                        multiLineCommentType: false, // use `/** */` instead of `//` as comment block
                    },
                    InjectByTag: {
                        fileRegex: /\.+/,
                        // regexp to find [AIV] tag inside html, if you tag contains unallowed characters you can adjust the regex
                        // but also you can change [AIV] tag to anything you want
                        AIVTagRegexp:
                            /(\[AIV])(([a-zA-Z{} ,:;!()_@\-"'\\\/])+)(\[\/AIV])/g,
                        dateFormat: "h:MM:ss TT",
                    },
                },
                LOGS_TEXT: {
                    AIS_START: "DEMO AIV started",
                },
            }),
            new BundleAnalyzerPlugin({
                analyzerMode: "static",
                reportFilename: params.PRESET.IS_EXAMPLE ? path.join(root, "dist", params.APP_NAME, "bundle-stats.html") : path.join(root, "src", "apps", params.APP_NAME, "dist", "bundle-stats.html")
            })
        ],
    }
}
