/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  rootDir: "..",
  testEnvironment: "node",
  preset: "ts-jest/presets/default-esm",

  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },

  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "<rootDir>/tsconfig.json",
      },
    ],
  },

  setupFilesAfterEnv: ["<rootDir>/src/test-utils/setup.ts"],
  testMatch: ["<rootDir>/src/**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json", "node"],
  collectCoverage: true,
  coverageDirectory: "<rootDir>/coverage",
  collectCoverageFrom: [
    "<rootDir>/src/**/*.ts",
    "!<rootDir>/src/**/*.test.ts",
    "!<rootDir>/src/test-utils/**/*.ts",
  ],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};
