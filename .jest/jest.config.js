/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  rootDir: "..", // Aponta a raiz para o diretório principal do projeto
  testEnvironment: "node",
  preset: "ts-jest/presets/default-esm",
  transform: {
    "^.+\\.m?[tj]s$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "<rootDir>/tsconfig.jest.json",
      },
    ],
  },
  moduleFileExtensions: ["ts", "js", "json", "node"],
  testMatch: ["<rootDir>/src/**/*.test.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  collectCoverage: true,
  coverageDirectory: "<rootDir>/coverage",
  collectCoverageFrom: ["<rootDir>/src/**/*.ts", "!<rootDir>/src/**/*.test.ts"],
  // Aponta para um arquivo de setup que criaremos a seguir
  setupFilesAfterEnv: ["<rootDir>/.jest/setup.ts"],
};
