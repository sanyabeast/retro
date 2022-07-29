"use strict";
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
    mode: "development",
    devtool: "eval-source-map",
    plugins: [
        // new BundleAnalyzerPlugin()
    ]
};
