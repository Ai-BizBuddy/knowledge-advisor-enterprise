/**
 * Input Validation and Sanitization Utilities
 *
 * Provides comprehensive input validation to prevent XSS, injection attacks,
 * and ensure data integrity across the application.
 */

import DOMPurify from 'isomorphic-dompurify';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: string;
}

interface ValidationOptions {
  maxLength?: number;
  minLength?: number;
  allowHTML?: boolean;
  allowedTags?: string[];
  pattern?: RegExp;
  customValidator?: (value: string) => string | null;
}

/**
 * Core validation class
 */
class InputValidator {
  /**
   * Validates and sanitizes text input
   */
  validateText(
    input: string,
    options: ValidationOptions = {},
  ): ValidationResult {
    const {
      maxLength = 10000,
      minLength = 0,
      allowHTML = false,
      allowedTags = [],
      pattern,
      customValidator,
    } = options;

    const errors: string[] = [];
    let sanitized = input;

    // Check if input is string
    if (typeof input !== 'string') {
      errors.push('Input must be a string');
      return { isValid: false, errors };
    }

    // Length validation
    if (input.length < minLength) {
      errors.push(`Input must be at least ${minLength} characters`);
    }

    if (input.length > maxLength) {
      errors.push(`Input must not exceed ${maxLength} characters`);
      sanitized = input.substring(0, maxLength);
    }

    // Pattern validation
    if (pattern && !pattern.test(input)) {
      errors.push('Input format is invalid');
    }

    // HTML sanitization
    if (allowHTML) {
      sanitized = DOMPurify.sanitize(sanitized, {
        ALLOWED_TAGS: allowedTags,
        ALLOWED_ATTR: ['href', 'title', 'alt', 'src'],
        FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
      });
    } else {
      // Remove all HTML tags and encode special characters
      sanitized = this.escapeHTML(sanitized);
    }

    // Custom validation
    if (customValidator) {
      const customError = customValidator(sanitized);
      if (customError) {
        errors.push(customError);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized,
    };
  }

  /**
   * Validates email addresses
   */
  validateEmail(email: string): ValidationResult {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const errors: string[] = [];

    if (!email || typeof email !== 'string') {
      errors.push('Email is required');
      return { isValid: false, errors };
    }

    const sanitized = email.trim().toLowerCase();

    if (!emailRegex.test(sanitized)) {
      errors.push('Invalid email format');
    }

    if (sanitized.length > 254) {
      errors.push('Email is too long');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized,
    };
  }

  /**
   * Validates URLs
   */
  validateURL(
    url: string,
    options: { allowedProtocols?: string[] } = {},
  ): ValidationResult {
    const { allowedProtocols = ['http:', 'https:'] } = options;
    const errors: string[] = [];

    if (!url || typeof url !== 'string') {
      errors.push('URL is required');
      return { isValid: false, errors };
    }

    let sanitized = url.trim();

    try {
      const urlObj = new URL(sanitized);

      if (!allowedProtocols.includes(urlObj.protocol)) {
        errors.push(`Protocol ${urlObj.protocol} is not allowed`);
      }

      // Remove potential XSS vectors
      if (urlObj.protocol === 'javascript:' || urlObj.protocol === 'data:') {
        errors.push('Potentially dangerous URL protocol');
      }

      sanitized = urlObj.href;
    } catch {
      errors.push('Invalid URL format');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized,
    };
  }

  /**
   * Validates file uploads
   */
  validateFile(
    file: File,
    options: {
      maxSize?: number;
      allowedTypes?: string[];
      allowedExtensions?: string[];
    } = {},
  ): ValidationResult {
    const {
      maxSize = 50 * 1024 * 1024, // 50MB default
      allowedTypes = [],
      allowedExtensions = [],
    } = options;

    const errors: string[] = [];

    if (!file || !(file instanceof File)) {
      errors.push('Valid file is required');
      return { isValid: false, errors };
    }

    // Size validation
    if (file.size > maxSize) {
      errors.push(
        `File size must not exceed ${Math.round(maxSize / 1024 / 1024)}MB`,
      );
    }

    // Type validation
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }

    // Extension validation
    if (allowedExtensions.length > 0) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !allowedExtensions.includes(extension)) {
        errors.push('File extension is not allowed');
      }
    }

    // Filename validation
    const sanitizedName = this.sanitizeFilename(file.name);
    if (sanitizedName !== file.name) {
      errors.push('Filename contains invalid characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: sanitizedName,
    };
  }

  /**
   * Validates JSON input
   */
  validateJSON(input: string): ValidationResult {
    const errors: string[] = [];
    let parsed;

    if (!input || typeof input !== 'string') {
      errors.push('JSON input is required');
      return { isValid: false, errors };
    }

    try {
      parsed = JSON.parse(input);
    } catch {
      errors.push('Invalid JSON format');
      return { isValid: false, errors };
    }

    // Check for potentially dangerous keys
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
    const hasDangerousKeys = this.checkForDangerousKeys(parsed, dangerousKeys);

    if (hasDangerousKeys) {
      errors.push('JSON contains potentially dangerous properties');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: input,
    };
  }

  /**
   * Escapes HTML characters
   */
  private escapeHTML(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };

    return text.replace(/[&<>"'/]/g, (char) => map[char]);
  }

  /**
   * Sanitizes filenames
   */
  private sanitizeFilename(filename: string): string {
    // Remove path traversal attempts and dangerous characters
    return filename
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
      .replace(/^\.+/, '')
      .substring(0, 255);
  }

  /**
   * Checks for dangerous keys in objects
   */
  private checkForDangerousKeys(
    obj: Record<string, unknown>,
    dangerousKeys: string[],
  ): boolean {
    if (typeof obj !== 'object' || obj === null) return false;

    for (const key of Object.keys(obj)) {
      if (dangerousKeys.includes(key)) return true;

      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (
          this.checkForDangerousKeys(
            obj[key] as Record<string, unknown>,
            dangerousKeys,
          )
        )
          return true;
      }
    }

    return false;
  }
}

/**
 * Specific validators for common use cases
 */
export const validators = {
  /**
   * Chat message validation
   */
  chatMessage: (message: string): ValidationResult => {
    const validator = new InputValidator();
    return validator.validateText(message, {
      maxLength: 4000,
      minLength: 1,
      allowHTML: false,
      customValidator: (text) => {
        // Check for potential script injection
        if (/javascript:|data:|vbscript:/i.test(text)) {
          return 'Message contains potentially dangerous content';
        }
        return null;
      },
    });
  },

  /**
   * Knowledge base title validation
   */
  knowledgeBaseTitle: (title: string): ValidationResult => {
    const validator = new InputValidator();
    return validator.validateText(title, {
      maxLength: 100,
      minLength: 3,
      allowHTML: false,
      pattern: /^[a-zA-Z0-9\s\-_ก-๙]+$/,
    });
  },

  /**
   * User search query validation
   */
  searchQuery: (query: string): ValidationResult => {
    const validator = new InputValidator();
    return validator.validateText(query, {
      maxLength: 500,
      minLength: 1,
      allowHTML: false,
      customValidator: (text) => {
        // Prevent SQL injection patterns
        if (/('|(\\')|(--)|(%27)|(%3D)|(;))/i.test(text)) {
          return 'Search query contains invalid characters';
        }
        return null;
      },
    });
  },

  /**
   * Document upload validation
   */
  documentUpload: (file: File): ValidationResult => {
    const validator = new InputValidator();
    return validator.validateFile(file, {
      maxSize: 50 * 1024 * 1024, // 50MB
      allowedTypes: [
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      allowedExtensions: ['pdf', 'txt', 'doc', 'docx'],
    });
  },
};

// Export the main validator class and utility functions
export { InputValidator };
export type { ValidationResult, ValidationOptions };

// Create a default instance
export const inputValidator = new InputValidator();

// Export common validation functions
export const validateInput = inputValidator.validateText.bind(inputValidator);
export const validateEmail = inputValidator.validateEmail.bind(inputValidator);
export const validateURL = inputValidator.validateURL.bind(inputValidator);
export const validateFile = inputValidator.validateFile.bind(inputValidator);
export const validateJSON = inputValidator.validateJSON.bind(inputValidator);
