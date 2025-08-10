/* Global ESLint config for the monorepo */
module.exports = {
  root: true,
  env: { browser: true, node: true, es2022: true },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  plugins: ["@typescript-eslint", "react", "react-hooks", "import", "prettier", "lit"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:lit/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:prettier/recommended",
  ],
  settings: {
    react: { version: "detect" },
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
        project: [__dirname + "/packages/*/tsconfig.json", __dirname + "/tsconfig.json"],
      },
      node: { extensions: [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"] },
    },
  },
  rules: {
    "prettier/prettier": ["error", { endOfLine: "auto" }],
    // TypeScript tweaks
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "@typescript-eslint/no-explicit-any": "off",
    // React 17+ JSX runtime doesn't require React in scope
    "react/react-in-jsx-scope": "off",
    // General
    "no-console": "off",
  },
  overrides: [
    { files: ["**/*.ts", "**/*.tsx"], parserOptions: { project: false } },
    { files: ["packages/bff-account-summary/**/*.ts"], env: { node: true, browser: false } },
  ],
  ignorePatterns: [
    "node_modules/",
    "dist/",
    "build/",
    "coverage/",
    "*.config.js",
    "*.config.cjs",
    ".eslintrc.cjs",
  ],
};
