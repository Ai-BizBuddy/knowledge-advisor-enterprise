/**
 * Error Handling Utilities
 * 
 * Provides consistent error parsing and user-friendly message generation
 * across the application, especially for API responses.
 */

export interface ParsedError {
  message: string;
  originalError?: unknown;
  statusCode?: number;
}

/**
 * Parse API error responses and extract user-friendly messages
 */
export async function parseApiError(
  response: Response, 
  fallbackMessage = 'An error occurred'
): Promise<ParsedError> {
  const statusCode = response.status;
  
  try {
    const responseText = await response.text();
    
    // Try to parse JSON error response
    try {
      const errorData = JSON.parse(responseText);
      
      // Extract message from common error response formats
      let message = fallbackMessage;
      
      if (typeof errorData === 'string') {
        message = errorData;
      } else if (errorData.error) {
        message = typeof errorData.error === 'string' 
          ? errorData.error 
          : errorData.error.message || fallbackMessage;
      } else if (errorData.message) {
        message = errorData.message;
      } else if (errorData.detail) {
        message = errorData.detail;
      } else if (errorData.title) {
        message = errorData.title;
      }
      
      return {
        message,
        statusCode,
        originalError: errorData
      };
    } catch {
      // If JSON parsing fails, use status-based messages
      const message = getStatusMessage(statusCode, responseText);
      return {
        message,
        statusCode,
        originalError: responseText
      };
    }
  } catch {
    // If we can't read response text, use status-based message
    return {
      message: getStatusMessage(statusCode),
      statusCode
    };
  }
}

/**
 * Get user-friendly message based on HTTP status code
 */
export function getStatusMessage(statusCode: number, responseText?: string): string {
  switch (statusCode) {
    case 400:
      return 'Invalid request data';
    case 401:
      return 'Authentication required';
    case 403:
      return 'Access denied';
    case 404:
      return 'Resource not found';
    case 409:
      return 'Resource already exists';
    case 422:
      return 'Validation error';
    case 429:
      return 'Too many requests';
    case 500:
      return 'Server error occurred';
    case 502:
      return 'Service temporarily unavailable';
    case 503:
      return 'Service temporarily unavailable';
    case 504:
      return 'Request timeout';
    default:
      return responseText ? `Request failed (${statusCode})` : 'An unexpected error occurred';
  }
}

/**
 * Parse any error (API response, Error object, or unknown) into user-friendly message
 */
export function parseGenericError(error: unknown, fallbackMessage = 'An error occurred'): string {
  if (error instanceof Error) {
    return error.message || fallbackMessage;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object') {
    const errorObj = error as Record<string, unknown>;
    
    if (errorObj.message && typeof errorObj.message === 'string') {
      return errorObj.message;
    }
    
    if (errorObj.error && typeof errorObj.error === 'string') {
      return errorObj.error;
    }
  }
  
  return fallbackMessage;
}

/**
 * Create a user-friendly Error object from an API response
 */
export async function createApiError(
  response: Response, 
  fallbackMessage = 'API request failed'
): Promise<Error> {
  const parsed = await parseApiError(response, fallbackMessage);
  const error = new Error(parsed.message);
  
  // Attach additional context for debugging
  (error as any).statusCode = parsed.statusCode;
  (error as any).originalError = parsed.originalError;
  
  return error;
}

/**
 * Check if an error is a network/connection error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('network') || 
           message.includes('fetch') || 
           message.includes('connection') ||
           message.includes('timeout') ||
           error.name === 'NetworkError' ||
           error.name === 'TypeError';
  }
  return false;
}
