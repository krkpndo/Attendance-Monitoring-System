import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// ESLint catches bugs and style problems before they run
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'], // these rules apply only to TS/TSX files.
    // pulls in pre-made rule sets so you don't write hundreds of rules by hand
    extends: [
      js.configs.recommended, // baseline JavaScript rules.
      tseslint.configs.recommended, // TypeScript-aware rules
      reactHooks.configs.flat.recommended, // enforces the Rules of Hooks
      reactRefresh.configs.vite, // warns about patterns that break Hot Module Replacement (Fast Refresh) during dev
    ],
    languageOptions: {
      globals: globals.browser, // tells ESLint that browser globals like
    },
    // overrides on top of the extended sets
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructureArrayIgnorePattern: '^_'
        }
      ]
    }
  },
])
