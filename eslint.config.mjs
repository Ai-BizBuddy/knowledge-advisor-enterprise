import coreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const eslintConfig = [
  ...coreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      '.next/**/*',
      'out/**/*',
      'node_modules/**/*',
      '.next/types/**/*',
      'dist/**/*',
    ],
  },
  {
    rules: {
      // Enforce single quotes everywhere
      quotes: [
        'error',
        'single',
        {
          avoidEscape: true,
          allowTemplateLiterals: false,
        },
      ],
      // Enforce single quotes in JSX
      'jsx-quotes': ['error', 'prefer-single'],
      // Ensure consistent quote style in object properties
      'quote-props': ['error', 'as-needed'],
    },
  },
];

export default eslintConfig;
