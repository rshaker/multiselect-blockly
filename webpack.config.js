const path = require("path");
const webpack = require("webpack");

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
        playground: "./test/playground/index.ts",
        workspace: "./test/workspace/index.ts",
    };

    return Object.keys(entries).map((entry) => ({
        mode: isDevelopment ? "development" : "production",
        entry: {
            [entry]: entries[entry],
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: "ts-loader",
                    exclude: /node_modules/,
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
            minimize: false, // Disable code minimization
        },
        plugins: [
            // @blockly/dev-scripts expects this to be defined
            new webpack.DefinePlugin({
                "process.env.PACKAGE_NAME": JSON.stringify("my-package-name"),
            }),
        ],
        devtool: "source-map",
    }));
};
