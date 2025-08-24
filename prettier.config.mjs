/** @type {import('prettier').Config} */
const config = {
  // Core formatting
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'all',
  tabWidth: 2,
  useTabs: false,
  printWidth: 80,
  endOfLine: 'lf',

  // JSX specific - enforce single quotes in JSX
  jsxSingleQuote: true,

  // Plugins
  plugins: ['prettier-plugin-tailwindcss'],

  // Tailwind CSS specific
  tailwindAttributes: ['theme'],
  tailwindFunctions: ['twMerge', 'createTheme'],

  // File-specific overrides
  overrides: [
    {
      files: ['*.md', '*.mdx'],
      options: {
        printWidth: 100,
        proseWrap: 'always',
      },
    },
  ],
};

export default config;
