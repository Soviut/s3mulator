import eslint from '@eslint/js'
import prettier from 'eslint-plugin-prettier/recommended'

export default [
  eslint.configs.recommended,
  prettier,
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
]
