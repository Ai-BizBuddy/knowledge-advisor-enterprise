/**
 * Formats various date/time inputs to "MMM DD, YYYY" format (e.g., "Aug 13, 2024")
 *
 * @param dateInput - Can be a Date object, ISO string, timestamp (number), or date string
 * @returns Formatted date string in "MMM DD, YYYY" format
 * @throws Error if the input cannot be parsed as a valid date
 */
export function formatToMonthDayYear(
  dateInput: Date | string | number,
): string {
  let date: Date;

  try {
    if (dateInput instanceof Date) {
      // Already a Date object
      date = dateInput;
    } else if (typeof dateInput === 'number') {
      // Timestamp (milliseconds or seconds)
      // If the number is less than 1e12, assume it's in seconds, otherwise milliseconds
      const timestamp = dateInput < 1e12 ? dateInput * 1000 : dateInput;
      date = new Date(timestamp);
    } else if (typeof dateInput === 'string') {
      // String input - could be ISO string, date string, etc.
      date = new Date(dateInput);
    } else {
      throw new Error('Invalid date input type');
    }

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }

    // Format the date to "MMM DD, YYYY"
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    throw new Error(
      `Unable to parse date: ${dateInput}. ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Alternative function with more explicit handling of different formats
 * Useful when you need more control over parsing specific formats
 */
export function parseAndFormatDate(dateInput: Date | string | number): string {
  let date: Date;

  if (dateInput instanceof Date) {
    date = dateInput;
  } else if (typeof dateInput === 'number') {
    // Handle both seconds and milliseconds timestamps
    date = new Date(dateInput < 1e12 ? dateInput * 1000 : dateInput);
  } else if (typeof dateInput === 'string') {
    // Try to parse various string formats
    const trimmedInput = dateInput.trim();

    // Check for ISO format
    if (trimmedInput.includes('T') || trimmedInput.includes('Z')) {
      date = new Date(trimmedInput);
    }
    // Check for slash format (MM/DD/YYYY, DD/MM/YYYY, etc.)
    else if (trimmedInput.includes('/')) {
      date = new Date(trimmedInput);
    }
    // Check for dash format (YYYY-MM-DD, DD-MM-YYYY, etc.)
    else if (trimmedInput.includes('-')) {
      date = new Date(trimmedInput);
    }
    // Try parsing as-is
    else {
      date = new Date(trimmedInput);
    }
  } else {
    throw new Error('Unsupported date input type');
  }

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${dateInput}`);
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Utility function to check if a date input is valid
 * @param dateInput - Date input to validate
 * @returns boolean indicating if the date is valid
 */
export function isValidDate(dateInput: Date | string | number): boolean {
  try {
    formatToMonthDayYear(dateInput);
    return true;
  } catch {
    return false;
  }
}

// Export the main function as default
export default formatToMonthDayYear;

// CommonJS exports for Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatToMonthDayYear,
    parseAndFormatDate,
    isValidDate,
    default: formatToMonthDayYear,
  };
}
