// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

/**
 * ESLint (flat config) per app e libreria, eseguito da `ng lint`
 * (target `lint` dei due progetti in angular.json).
 */
module.exports = defineConfig([
  {
    ignores: ['dist/**', 'coverage/**', 'out-tsc/**', '.angular/**'],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'lnk', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'lnk', style: 'kebab-case' },
      ],
      // Parametri/variabili con prefisso "_" = non usati di proposito.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {
      // I controlli di form custom (ControlValueAccessor) contano come campo
      // associato all'etichetta, come gli input nativi.
      '@angular-eslint/template/label-has-associated-control': [
        'error',
        { controlComponents: ['lnk-select', 'lnk-secret-input', 'lnk-code-field'] },
      ],
      // `x != null` esclude insieme null e undefined: è voluto.
      '@angular-eslint/template/eqeqeq': ['error', { allowNullOrUndefined: true }],
    },
  },
  {
    // Libreria condivisa: alcuni output hanno nomi di eventi DOM (close,
    // select, cancel, ...). Rinominarli cambierebbe l'API usata dalle app
    // GovDesk: la regola resta attiva per l'app e si disattiva qui fino a una
    // major della libreria.
    files: ['projects/lnk-shared-ui/**/*.ts'],
    rules: {
      '@angular-eslint/no-output-native': 'off',
    },
  },
]);
