"use strict";
const TerserPlugin = require("terser-webpack-plugin");
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
            splitChunks: {
                chunks: 'async',
                minSize: 20000,
                minChunks: 1,
                maxAsyncRequests: 30,
                maxInitialRequests: 30,
                enforceSizeThreshold: 50000,
                cacheGroups: {
                    defaultVendors: {
                        test: /[\\/]node_modules[\\/]/,
                        priority: -10,
                        reuseExistingChunk: true,
                    },
                    default: {
                        minChunks: 2,
                        priority: -20,
                        reuseExistingChunk: true,
                    },
                },
            }
        },
        plugins: [
            new TerserPlugin({
                terserOptions: terser_options,
            }),
            new BundleAnalyzerPlugin({
                analyzerMode: "static",
                reportFilename: params.PRESET.IS_EXAMPLE ? path.join(root, "dist", params.APP_NAME, "bundle-stats.html") : path.join(root, "src", "apps", params.APP_NAME, "dist", "bundle-stats.html")
            })
        ],
    }
}
