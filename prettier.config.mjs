/** @type {import('prettier').Config} */
const config = {
  // Core formatting
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'es5',
  tabWidth: 2,
  useTabs: false,
  printWidth: 80,
  endOfLine: 'lf',
  
  // Plugins
  plugins: ["prettier-plugin-tailwindcss"],
  
  // Tailwind CSS specific
  tailwindAttributes: ["theme"],
  tailwindFunctions: ["twMerge", "createTheme"],
  
  // File-specific overrides
  overrides: [
    {
      files: ['*.json', '*.jsonc'],
      options: {
        singleQuote: false,
      },
    },
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
