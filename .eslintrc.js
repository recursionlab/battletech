module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
    'prettier',
  ],
  rules: {
    // Enforce consistent coding style
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/prefer-const': 'error',
    '@typescript-eslint/no-var-requires': 'error',
    
    // Architectural rules to prevent monolith
    'max-lines': ['warn', { max: 300, skipComments: true }],
    'max-lines-per-function': ['warn', { max: 50, skipComments: true }],
    'complexity': ['warn', 10],
    'max-depth': ['warn', 4],
    'max-params': ['warn', 4],
    
    // Import organization
    'sort-imports': ['error', {
      ignoreCase: false,
      ignoreDeclarationSort: true,
      ignoreMemberSort: false,
    }],
  },
  env: {
    node: true,
    es2022: true,
  },
};