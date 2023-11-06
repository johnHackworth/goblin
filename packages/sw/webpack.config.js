const webpack = require("webpack");
const path = require("path");
const locales = require("../../locales");
const meta = require("../../package.json");

const isProduction = process.env.NODE_ENV === "production";

module.exports = {
	mode: isProduction ? "production" : "development",
	stats: "errors-only",
	entry: "./src/sw.ts",
	output: {
		path: path.resolve(__dirname, "../../built/_sw_dist_"),
		filename: "sw.js",
	},
	resolve: {
		extensions: [".js", ".ts"],
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: /(node_modules|bower_components)/,
				use: {
					loader: "swc-loader",
					options: {
						// This makes swc-loader invoke swc synchronously.
						sync: true,
						jsc: {
							parser: {
								syntax: "typescript",
							},
						},
					},
				},
			},
		],
	},
	plugins: [
		new webpack.DefinePlugin({
			_VERSION_: JSON.stringify(meta.version),
			_LANGS_: JSON.stringify(
				Object.entries(locales).map(([k, v]) => [k, v._lang_]),
			),
			_ENV_: JSON.stringify(process.env.NODE_ENV),
			_DEV_: !isProduction,
			_PERF_PREFIX_: JSON.stringify("Firefish:"),
		}),
	],
};
