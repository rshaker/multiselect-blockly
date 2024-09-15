const path = require("path");
const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");

// https://webpack.js.org/configuration/mode/ -- 'mode' is set by --mode flag
// https://webpack.js.org/configuration/optimization/#optimizationminimizer
// https://webpack.js.org/plugins/terser-webpack-plugin/
// https://terser.org/docs/options/

// Determine externals based on the entry name
function determineExternals(entryName) {
    switch (entryName) {
        case "multiselect":
            // Don't bundle blockly libs with the plugin
            return {
                "blockly/core": {
                    root: "Blockly",
                    commonjs: "blockly/core",
                    commonjs2: "blockly/core",
                    amd: "blockly/core",
                },
            };
        default:
            return {};
    }
}

module.exports = (env, argv) => {
    const isDevelopment = argv.mode === "development";

    const entries = {
        multiselect: "./src/index.ts",
    };
    if (isDevelopment) {
        entries.playground = "./test/playground/index.ts";
        entries.workspace = "./test/workspace/index.ts";
    }

    return Object.keys(entries).map((entry) => ({
        mode: isDevelopment ? "development" : "production",
        entry: {
            [entry]: entries[entry],
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: [
                        {
                            loader: "ts-loader",
                            options: {
                                configFile: isDevelopment ? "tsconfig.dev.json" : "tsconfig.prod.json",
                            },
                        },
                    ],
                    exclude: /node_modules/,

                    // exclude: [
                    //     path.resolve(__dirname, "node_modules"),
                    //     ...(isDevelopment ? [path.join(__dirname, "test")] : []),
                    // ],
                },
            ],
        },
        resolve: {
            extensions: [".tsx", ".ts", ".js"],
            // Needed to avoid error when using "util" in @blockly/dev-tools sinon dependency
            fallback: {
                util: false,
            },
        },
        externals: determineExternals(entry),
        output: {
            filename: "[name].js",
            path: path.resolve(__dirname, "dist"),
            library: "[name]", // jquery($), lodash(_), etc.
            libraryTarget: "umd",
            umdNamedDefine: true,
            globalObject: "this",
        },
        optimization: {
            minimizer: [
                new TerserPlugin({
                    parallel: true,
                    extractComments: false,
                    terserOptions: {
                        compress: {
                            drop_console: !isDevelopment,
                        },
                    },
                }),
            ],
            // minimize: false, // Disable code minimization

            // Configure optimization depending on the entry and mode (dev vs prod).
            // Don't include source maps in distributed packages.
            // https://stackoverflow.com/questions/41040266/remove-console-logs-with-webpack-uglify
        },
        plugins: [
            // @blockly/dev-scripts expects this to be defined
            new webpack.DefinePlugin({
                "process.env.PACKAGE_NAME": JSON.stringify("my-package-name-is-unimportant"),
            }),
        ],
        devtool: "source-map",
    }));
};
