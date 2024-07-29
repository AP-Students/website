/** @type {import("eslint").Linter.Config} */
const config = {
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": true,
    ecmaVersion: "latest",
    sourceType: "module",
  },
  "plugins": [ "@typescript-eslint",
    "eslint-comments",
  ],
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:@typescript-eslint/stylistic-type-checked",
    "plugin:unicorn/recommended",
    "plugin:deprecation/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript"
  ],
  /**
   * Overall, the rules are set so that the code is as consistent as possible.
   * I want the code to be void of unnecessary stylistic differences,
   * so it's easier to read and puts less strain on maintainers who have to
   * govern what is and isn't allowed.
   */
  "rules": {
    "@typescript-eslint/array-type": "error",
    // prefer type over interface because of global interface merging
    "@typescript-eslint/consistent-type-definitions": ["error", "type"],
    "@typescript-eslint/consistent-type-imports": [
      "warn",
      {
        "prefer": "type-imports",
        "fixStyle": "inline-type-imports"
      }
    ],
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
      }
    ],
    "@typescript-eslint/require-await": "off",
    "@typescript-eslint/no-misused-promises": [
      "error",
      {
        "checksVoidReturn": {
          "attributes": false
        }
      },
    ],
    "@typescript-eslint/ban-ts-comment": "error",
    "@typescript-eslint/consistent-generic-constructors": "error",
    "@typescript-eslint/no-floating-promises": "error",

    // eslint-comments, because people abuse eslint-disable lol
    "eslint-comments/no-unlimited-disable": "error",
    "eslint-comments/no-restricted-disable": ["error"],

    // unicorn
    "unicorn/no-array-for-each": "warn",
    "unicorn/no-null": "off",
    "unicorn/prefer-node-protocol": "off",
    "unicorn/filename-case": [
      "off",
      {
        "case": "kebabCase"
      }
    ], // up for debate
    "unicorn/prevent-abbreviations": [
      "error",
      {
        allowList: {
          env: true,
          src: true,
          props: true,
          db: true,
        },
      },
    ],

    // eslint rules
    "linebreak-style": ["error", "unix"], // LF line endings only
    "max-len": "off", // handled by prettier

    // debug console.log's often get accidentally left in
    // by disallowing them, we prevent random logs from appearing
    // other console methods are allowed because devs are lazy
    // and generally just press tab.
    "no-console": [
      "warn",
      {
        allow: ["warn", "error", "debug", "trace", "info", "fatal"],
      },
    ],

    "no-unused-vars": "off", // handled by typescript-eslint

    // deprecation
    "deprecation/deprecation": "warn", // warn about deprecated methods
  },
  overrides: [
    {
      // disable some rules in test files because jest requires casting
      files: ["*.test.ts"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "unicorn/prevent-abbreviations": ["warn"],
      },
    },
  ],
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  ignorePatterns: [
    //   "*.d.ts",
    //   "types.ts",
    //   "*.js",
    //   "**/jests/**",
    "node_modules/**",
    "dist/**",
    "jest.config.ts",
    "jest.setup.ts",
    "tsup.config.ts",
    "coverage/**",
    "coverage-ts/**",
  ],
}
module.exports = config;
