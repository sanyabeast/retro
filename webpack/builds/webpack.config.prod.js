"use strict";
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const WebpackAutoInject = require("webpack-auto-inject-version");
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const path = require("path");
const root = path.join(__dirname, "../..");

module.exports = {
    entry: {
        app: path.join(root, "src", "retro", "App")
    },
    mode: "production",
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    ecma: undefined,
                    warnings: false,
                    parse: {},
                    compress: {},
                    mangle: true,
                    module: false,
                    output: null,
                    toplevel: false,
                    nameCache: null,
                    ie8: false,
                    keep_classnames: undefined,
                    keep_fnames: true, // change to true here
                    safari10: false,
                },
            }),
        ],
    },
    plugins: [
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
            analyzerMode: "static"
        })
    ],
};
