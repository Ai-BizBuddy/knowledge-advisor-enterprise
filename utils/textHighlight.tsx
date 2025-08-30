import React from 'react';

/**
 * Highlights matching text in a string by wrapping matches in HTML elements
 * @param text - The text to search and highlight in
 * @param searchQuery - The search term to highlight
 * @param className - CSS classes to apply to highlighted text
 * @returns JSX element with highlighted text
 */
export const highlightText = (
  text: string,
  searchQuery: string,
  className: string = 'bg-yellow-200 dark:bg-yellow-800 rounded font-medium',
): React.ReactNode => {
  if (!searchQuery || !text) {
    return text;
  }

  // Split the search query into individual words and filter out empty strings
  const searchTerms = searchQuery
    .trim()
    .split(/\s+/)
    .filter((term) => term.length > 0);

  if (searchTerms.length === 0) {
    return text;
  }

  // Create a regex pattern that matches any of the search terms (case-insensitive)
  const pattern = new RegExp(
    `(${searchTerms.map((term) => escapeRegExp(term)).join('|')})`,
    'gi',
  );

  // Split the text by the pattern while keeping the matched parts
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, index) => {
        // Check if this part matches any of our search terms
        const isHighlight = searchTerms.some(
          (term) => part.toLowerCase() === term.toLowerCase(),
        );

        return isHighlight ? (
          <span key={index} className={className}>
            {part}
          </span>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        );
      })}
    </>
  );
};

/**
 * Escapes special regex characters in a string
 * @param string - The string to escape
 * @returns Escaped string safe for use in regex
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Highlights text with multiple highlighting styles
 * @param text - The text to highlight
 * @param searchQuery - The search term
 * @param options - Highlighting options
 * @returns JSX element with highlighted text
 */
export const highlightTextAdvanced = (
  text: string,
  searchQuery: string,
  options: {
    highlightClassName?: string;
    caseSensitive?: boolean;
    wholeWords?: boolean;
    maxLength?: number;
  } = {},
): React.ReactNode => {
  const {
    highlightClassName = 'bg-yellow-200 dark:bg-yellow-800 rounded font-medium',
    caseSensitive = false,
    wholeWords = false,
    maxLength,
  } = options;

  if (!searchQuery || !text) {
    return maxLength ? truncateText(text, maxLength) : text;
  }

  const searchTerms = searchQuery
    .trim()
    .split(/\s+/)
    .filter((term) => term.length > 0);

  if (searchTerms.length === 0) {
    return maxLength ? truncateText(text, maxLength) : text;
  }

  // Create regex pattern based on options
  let pattern: RegExp;
  if (wholeWords) {
    pattern = new RegExp(
      `\\b(${searchTerms.map((term) => escapeRegExp(term)).join('|')})\\b`,
      caseSensitive ? 'g' : 'gi',
    );
  } else {
    pattern = new RegExp(
      `(${searchTerms.map((term) => escapeRegExp(term)).join('|')})`,
      caseSensitive ? 'g' : 'gi',
    );
  }

  const textToProcess = maxLength ? truncateText(text, maxLength) : text;
  const parts = textToProcess.split(pattern);

  return (
    <>
      {parts.map((part, index) => {
        const isHighlight = pattern.test(part);
        // Reset regex lastIndex for next test
        pattern.lastIndex = 0;

        return isHighlight ? (
          <span key={index} className={highlightClassName}>
            {part}
          </span>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        );
      })}
    </>
  );
};

/**
 * Truncates text to a specified length with ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength).trim() + '...';
}
