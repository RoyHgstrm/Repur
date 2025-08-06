module.exports = {
  extends: [
    'next/core-web-vitals'
  ],
  rules: {
    // Disable specific warnings
    '@typescript-eslint/no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      destructuredArrayIgnorePattern: '^_'
    }],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    '@typescript-eslint/prefer-optional-chain': 'warn'
  }
};