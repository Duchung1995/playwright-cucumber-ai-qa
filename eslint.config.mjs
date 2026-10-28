import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['node_modules', 'reports', 'cucumber.mjs', 'eslint.config.mjs'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.mjs'],
    languageOptions: { globals: { process: 'readonly', console: 'readonly' } },
  },
  {
    files: ['**/*.ts'],
    rules: {
      // Deterministic waits only: rely on Playwright auto-waiting and web-first assertions.
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name='waitForTimeout']",
          message: 'Hard waits are forbidden. Use web-first assertions or waitForResponse.',
        },
        {
          selector: "CallExpression[callee.name='setTimeout']",
          message: 'Hard waits are forbidden. Use web-first assertions or waitForResponse.',
        },
        {
          selector: 'CallExpression[callee.property.name=/^(\\$|\\$\\$|waitForSelector)$/]',
          message: 'Use typed Locators (getByRole/getByLabel/getByTestId) instead of ElementHandles.',
        },
      ],
    },
  },
);
