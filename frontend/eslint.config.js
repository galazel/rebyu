import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

/** Vitest injects these; the test files use them without importing. */
const VITEST_GLOBALS = {
  describe: 'readonly',
  it: 'readonly',
  test: 'readonly',
  expect: 'readonly',
  vi: 'readonly',
  beforeEach: 'readonly',
  afterEach: 'readonly',
  beforeAll: 'readonly',
  afterAll: 'readonly',
}

export default defineConfig([
  globalIgnores(['dist']),
  /*
   * The app is .jsx, and nothing was linting it: the block below only matches
   * ts/tsx, so a reference to a name that does not exist -- a variable renamed
   * in one place, an icon used without importing it -- built cleanly and threw
   * at render. Three such crashes were in shipped pages. This catches that one
   * class of mistake across the JavaScript sources without turning on rules
   * the codebase has never been held to.
   */
  {
    files: ['src/**/*.{js,jsx}'],
    // Registered but not enabled: these files carry
    // `eslint-disable-next-line react-hooks/exhaustive-deps` comments, and a
    // disable for a rule ESLint has never heard of is itself an error.
    plugins: { 'react-hooks': reactHooks },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: { 'no-undef': 'error' },
  },
  {
    files: ['src/**/*.test.{js,jsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node, ...VITEST_GLOBALS } },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
])
