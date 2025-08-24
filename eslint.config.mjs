import { FlatCompat } from '@eslint/eslintrc';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
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
