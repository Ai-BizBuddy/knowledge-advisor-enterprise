/**
 * CSRF Protection Utilities
 *
 * Provides Cross-Site Request Forgery protection for the application
 */

import { randomBytes } from 'crypto';

interface CSRFTokenData {
  token: string;
  timestamp: number;
  expiry: number;
}

/**
 * CSRF Protection Manager
 */
class CSRFProtection {
  private static instance: CSRFProtection;
  private tokenStorage = new Map<string, CSRFTokenData>();
  private readonly TOKEN_EXPIRY = 30 * 60 * 1000; // 30 minutes
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.startCleanupTimer();
  }

  public static getInstance(): CSRFProtection {
    if (!CSRFProtection.instance) {
      CSRFProtection.instance = new CSRFProtection();
    }
    return CSRFProtection.instance;
  }

  /**
   * Generates a new CSRF token
   */
  generateToken(sessionId?: string): string {
    const token = randomBytes(32).toString('hex');
    const timestamp = Date.now();
    const expiry = timestamp + this.TOKEN_EXPIRY;

    // Store token with metadata
    const key = sessionId || 'default';
    this.tokenStorage.set(key, {
      token,
      timestamp,
      expiry,
    });

    return token;
  }

  /**
   * Validates a CSRF token
   */
  validateToken(token: string, sessionId?: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    const key = sessionId || 'default';
    const tokenData = this.tokenStorage.get(key);

    if (!tokenData) {
      return false;
    }

    // Check if token matches
    if (tokenData.token !== token) {
      return false;
    }

    // Check if token has expired
    if (Date.now() > tokenData.expiry) {
      this.tokenStorage.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Invalidates a token
   */
  invalidateToken(sessionId?: string): void {
    const key = sessionId || 'default';
    this.tokenStorage.delete(key);
  }

  /**
   * Refreshes an existing token
   */
  refreshToken(sessionId?: string): string | null {
    const key = sessionId || 'default';
    const existingToken = this.tokenStorage.get(key);

    if (!existingToken) {
      return null;
    }

    // Generate new token
    return this.generateToken(sessionId);
  }

  /**
   * Cleans up expired tokens
   */
  private cleanupExpiredTokens(): void {
    const now = Date.now();

    for (const [key, tokenData] of this.tokenStorage.entries()) {
      if (now > tokenData.expiry) {
        this.tokenStorage.delete(key);
      }
    }
  }

  /**
   * Starts the cleanup timer
   */
  private startCleanupTimer(): void {
    if (typeof window === 'undefined') return; // Server-side only

    setInterval(() => {
      this.cleanupExpiredTokens();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Gets token statistics (for debugging)
   */
  getStats(): { activeTokens: number; oldestToken: number | null } {
    let oldestToken: number | null = null;

    for (const tokenData of this.tokenStorage.values()) {
      if (oldestToken === null || tokenData.timestamp < oldestToken) {
        oldestToken = tokenData.timestamp;
      }
    }

    return {
      activeTokens: this.tokenStorage.size,
      oldestToken,
    };
  }
}

/**
 * Client-side CSRF helpers
 */
export class ClientCSRF {
  private static readonly STORAGE_KEY = 'csrf_token';
  private static readonly META_TAG_NAME = 'csrf-token';

  /**
   * Gets CSRF token from meta tag or storage
   */
  static getToken(): string | null {
    // Try to get from meta tag first (server-side rendered)
    if (typeof document !== 'undefined') {
      const metaTag = document.querySelector(
        `meta[name="${this.META_TAG_NAME}"]`,
      );
      if (metaTag) {
        return metaTag.getAttribute('content');
      }

      // Fallback to sessionStorage
      return sessionStorage.getItem(this.STORAGE_KEY);
    }

    return null;
  }

  /**
   * Sets CSRF token in storage
   */
  static setToken(token: string): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(this.STORAGE_KEY, token);
    }
  }

  /**
   * Removes CSRF token from storage
   */
  static removeToken(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Adds CSRF token to request headers
   */
  static addToHeaders(
    headers: Record<string, string> = {},
  ): Record<string, string> {
    const token = this.getToken();

    if (token) {
      return {
        ...headers,
        'X-CSRF-Token': token,
      };
    }

    return headers;
  }

  /**
   * Adds CSRF token to form data
   */
  static addToFormData(formData: FormData): void {
    const token = this.getToken();

    if (token) {
      formData.append('_csrf_token', token);
    }
  }

  /**
   * Validates the current page has a CSRF token
   */
  static validatePageToken(): boolean {
    return this.getToken() !== null;
  }
}

/**
 * React hook for CSRF protection
 */
export function useCSRF() {
  const getToken = (): string | null => {
    return ClientCSRF.getToken();
  };

  const addToHeaders = (
    headers: Record<string, string> = {},
  ): Record<string, string> => {
    return ClientCSRF.addToHeaders(headers);
  };

  const addToFormData = (formData: FormData): void => {
    ClientCSRF.addToFormData(formData);
  };

  const isTokenValid = (): boolean => {
    return ClientCSRF.validatePageToken();
  };

  return {
    getToken,
    addToHeaders,
    addToFormData,
    isTokenValid,
  };
}

/**
 * Express middleware for CSRF protection (for API routes)
 */
export function createCSRFMiddleware() {
  const csrf = CSRFProtection.getInstance();

  return {
    /**
     * Generates and sets CSRF token
     */
    generate: (sessionId?: string) => {
      return csrf.generateToken(sessionId);
    },

    /**
     * Validates CSRF token from request
     */
    validate: (token: string, sessionId?: string) => {
      return csrf.validateToken(token, sessionId);
    },

    /**
     * Middleware function for Next.js API routes
     */
    middleware: (
      req: Request & {
        session?: { id?: string };
        body?: { _csrf_token?: string };
      },
      res: Response & {
        status: (code: number) => { json: (data: object) => void };
      },
      next: () => void,
    ) => {
      // Skip GET, HEAD, OPTIONS requests
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method || '')) {
        return next();
      }

      const token = req.headers.get('x-csrf-token') || req.body?._csrf_token;
      const sessionId = req.session?.id || req.headers.get('x-session-id');

      if (!csrf.validateToken(token as string, sessionId as string)) {
        res.status(403).json({
          error: 'Invalid CSRF token',
          code: 'CSRF_INVALID',
        });
        return;
      }

      next();
    },
  };
}

// Export singleton instance
export const csrfProtection = CSRFProtection.getInstance();

// Export utility functions
export const generateCSRFToken = (sessionId?: string) =>
  csrfProtection.generateToken(sessionId);
export const validateCSRFToken = (token: string, sessionId?: string) =>
  csrfProtection.validateToken(token, sessionId);

const csrfUtils = {
  CSRFProtection,
  ClientCSRF,
  useCSRF,
  createCSRFMiddleware,
  csrfProtection,
};

export default csrfUtils;
