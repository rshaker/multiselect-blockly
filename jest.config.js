/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",

    transformIgnorePatterns: [
        "<rootDir>/node_modules/", 
        "<rootDir>/dist/"
    ],
    transform: {
        "^.+\\.tsx?$": "ts-jest",
    },

    testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$",
    moduleDirectories: ["node_modules", "src"]
};

