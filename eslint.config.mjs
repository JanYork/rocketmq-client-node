import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';


export default [
  {
    files: ["**/*.js", "**/*.cjs", "**/*.mjs"],
    languageOptions: {sourceType: "script"},
  },
  {
    languageOptions: { globals: globals.browser },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
];