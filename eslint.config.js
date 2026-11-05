// ESLint 9 (flat config) — Imprenta Córdova
// =========================================
// Objetivo: atrapar errores reales (hooks mal usados, variables sin definir,
// promesas sueltas en handlers) sin ahogar el proyecto en ruido de estilo.
// El formato no se discute acá: no hay reglas de comillas/indentación.
//
// Uso:  npm run lint        → solo errores bloquean
//       npm run lint:fix    → arregla lo automático
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  {
    // Nada de linter sobre artefactos, dependencias, scratch ni el backend
    // (el backend de Render es CommonJS y tiene su propio ciclo de vida).
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'scratch/**',
      'scratch.txt',
      'dev-dist/**',
      'cordova-sri-backend/**',
      'sri-chrome-extension/**',
      'supabase/**',
      'public/**',
      '**/*.timestamp-*.mjs',
    ],
  },

  // --- Código de la app (React + TypeScript, corre en el navegador) ---
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.es2022 },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,

      // Hooks: esto sí rompe la app en runtime.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Deuda tipada heredada: se avisa, no se bloquea.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',

      // Errores de verdad.
      'no-constant-condition': ['error', { checkLoops: false }],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-var': 'error',
    },
  },

  // --- Tests: globals de vitest y mano más suelta ---
  {
    files: ['__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },

  // --- Scripts y config de build: corren en Node ---
  {
    files: ['*.config.{js,ts,mjs}', 'scripts/**/*.{js,mjs}', 'seed*.{mjs,ts}'],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: { ...globals.node },
      sourceType: 'module',
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
