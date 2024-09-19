import globals from 'globals';
import pluginJs from '@eslint/js';
import tsEslint from 'typescript-eslint';
import tsParser from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  eslintConfigPrettier,
  pluginJs.configs.recommended,
  ...tsEslint.configs.recommended,
  {
    ignores: ['bin/**/*'],
  },
  {
    languageOptions: { globals: globals.browser, parser: tsParser },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-async-promise-executor': 'warn',
    },
  },
];
