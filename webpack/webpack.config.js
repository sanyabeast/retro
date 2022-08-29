'use strict';

const _ = require('lodash')
const path = require('path');
const root = path.join(__dirname, '..');
const merge = require('webpack-merge').merge;
const VueLoaderPlugin = require('vue-loader').VueLoaderPlugin;
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const { DefinePlugin, ProvidePlugin, ProgressPlugin } = require('webpack');
const PACKAGE_DATA = require('../package.json')
const CopyPlugin = require('copy-webpack-plugin');
const tools = require("./tools.js")

module.exports = (env) => {
	tools.log(`working on app '${env.APP_NAME}'...`)
	const APP_NAME = env.APP_NAME
	const PRESET = tools.load_preset(APP_NAME)
	const DEFINES = tools.generate_defines(env, APP_NAME)

	tools.update_typescript_config(env, APP_NAME)

	let config = {
		stats: { assets: true },
		entry: {
			main: path.join(root, 'src', 'main'),
		},
		output: tools.get_output_config(APP_NAME, PRESET),
		module: {
			rules: [
				{
					test: /\.vue$/,
					loader: 'vue-loader'
				},
				{
					test: /\.js$/,
					exclude: /node_modules|lib/,
					loader: 'babel-loader'
				},
				{
					test: /\.png$/,
					loader: 'base64-image-loader'
				},
				{
					test: /\.html$/,
					exclude: /node_modules/,
					loader: 'file-loader',
					options: {
						name: '[name].[ext]',
					},
				},
				{
					test: /\.ya?ml$/,
					use: [
						{
							loader: path.join(root, 'scripts', 'data-loader.js'),
							options: {
								app_name: APP_NAME,
								schema_lib: tools.load_schema_lib(env, APP_NAME),
								plugins: ['retro', ...(PRESET.PLUGINS || []), `apps/${APP_NAME}`]
							}
						},
						'yaml-loader'
					]
				},
				{
					test: /\.css$/,
					use: [
						'vue-style-loader',
						'css-loader',
						'postcss-loader'
					]
				},
				{
					test: /\.less$/i,
					use: [
						// compiles Less to CSS
						'vue-style-loader',
						'css-loader',
						'postcss-loader',
						'sass-loader',
					],
				},
				{
					test: /\.scss$/,
					use: [
						'vue-style-loader',
						'css-loader',
						'postcss-loader',
						'sass-loader'
					]
				},
				{
					test: /\ResourceManager.js$/,
					loader: path.join(root, 'scripts', 'assets-loader.js'),
					options: {
						app_name: APP_NAME,
						plugins: ['retro', ...(PRESET.PLUGINS || []), `apps/${APP_NAME}`]
					}
				},

				{
					test: /\.coffee$/,
					loader: 'coffee-loader',
					options: {
						transpile: {
							presets: ['@babel/env'],
						}
					}
				},
				{
					test: /\.tsx?$/,
					exclude: /node_modules/,
					loader: 'ts-loader'
				}
			],
		},
		plugins: [
			new CopyPlugin({
				patterns: tools.get_copy_plugin_patterns(APP_NAME, PRESET)
			}),
			new ProgressPlugin({
				activeModules: false,
				entries: true,
				handler(percentage, message, ...args) {
					// custom logic
				},
				modules: true,
				modulesCount: 5000,
				profile: false,
				dependencies: true,
				dependenciesCount: 10000,
				percentBy: null,
			}),
			new NodePolyfillPlugin(),
			new VueLoaderPlugin(),
			new DefinePlugin(DEFINES),
			new ProvidePlugin({
				JSON5: 'json5',
				path: 'path',
				ResourceManager: "retro/ResourceManager"
			}),

		],
		devServer: {
			// publicPath: '/',
			// contentBase: './public',
			hot: true,
			// overlay: true,
			host: '0.0.0.0'
		},
		resolve: {
			extensions: ['.tsx', '.ts', '.vue', '.coffee', '.js', '.yaml', '.json'],
			modules: ['src', 'lib', 'node_modules', 'dist'],
			alias: {
				'@': path.resolve(__dirname, 'src'),
				vue: 'vue/dist/vue.js',
				three: 'retro/lib/three',
				'../../../build/three.module.js': 'retro/lib/three'
			}
		},
	};

	// Builds
	const build = env && env.production ? 'prod' : 'dev';
	const mode_config = require(path.join(root, 'webpack', 'builds', `webpack.config.${build}`))

	config = merge(
		config,
		typeof mode_config === 'function' ? mode_config({
			APP_NAME,
			PRESET
		}) : mode_config
	);

	// Addons
	const addons = getAddons(env);
	addons.forEach((addon) => {
		config = merge(
			config,
			require(path.join(root, 'webpack', 'addons', `webpack.${addon}`))
		);
	});

	tools.log(`Build mode: \x1b[33m${config.mode}\x1b[0m`);

	return config;
};

function getAddons(env) {
	if (!env || !env.addons) return [];
	if (typeof env.addons === 'string') return [env.addons];
	return env.addons;
}
