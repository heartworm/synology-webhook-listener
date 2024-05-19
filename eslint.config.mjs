import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
    {
        languageOptions: {
            parser: tseslint.parser,
            globals: globals.node,
            parserOptions: {
                project: "./tsconfig.json",
            },
        },
    },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    eslintConfigPrettier,
];
