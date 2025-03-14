module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended'
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: [
    'react',
    'react-hooks'
  ],
  rules: {
    // Turn off prop-types validation for now
    'react/prop-types': 'off',
    // Allow JSX in .js files
    'react/jsx-filename-extension': [1, { 'extensions': ['.js', '.jsx'] }],
    // Warning for console logs
    'no-console': 'warn',
    // Enforce React import
    'react/react-in-jsx-scope': 'off',
    // Enforce hook dependencies
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn'
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
};