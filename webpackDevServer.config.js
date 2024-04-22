const path = require("path");

module.exports = {
    name: "serve-static",
    mode: "development",
    entry: {}, // No entry point needed for static server
    devServer: {
        static: {
            directory: path.join(__dirname, "/"), // Root directory with static pages
        },
        // compress: true,
        // port: 8080, // Port to listen on (default?)
        port: "auto",
        hot: true,
        watchFiles: {
            paths: "./dist",
            options: {
                ignored: ["node_modules"],
            },
        },
    },
};
