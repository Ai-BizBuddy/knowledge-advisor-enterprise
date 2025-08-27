/**
 * Rate Limiting Utilities
 * 
 * Provides client and server-side rate limiting to prevent abuse
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (identifier: string) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitData {
  count: number;
  resetTime: number;
  firstRequest: number;
}

/**
 * In-memory rate limiter
 */
class RateLimiter {
  private store = new Map<string, RateLimitData>();
  private config: Required<RateLimitConfig>;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: (id: string) => id,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config,
    };

    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Checks if request is allowed and updates counters
   */
  checkLimit(identifier: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    totalHits: number;
  } {
    const key = this.config.keyGenerator(identifier);
    const now = Date.now();
    
    let data = this.store.get(key);

    // Initialize or reset if window expired
    if (!data || now > data.resetTime) {
      data = {
        count: 0,
        resetTime: now + this.config.windowMs,
        firstRequest: now,
      };
    }

    // Increment counter
    data.count++;
    this.store.set(key, data);

    const allowed = data.count <= this.config.maxRequests;
    const remaining = Math.max(0, this.config.maxRequests - data.count);

    return {
      allowed,
      remaining,
      resetTime: data.resetTime,
      totalHits: data.count,
    };
  }

  /**
   * Resets the limit for a specific identifier
   */
  resetLimit(identifier: string): void {
    const key = this.config.keyGenerator(identifier);
    this.store.delete(key);
  }

  /**
   * Gets current limit status without incrementing
   */
  getStatus(identifier: string): {
    remaining: number;
    resetTime: number;
    totalHits: number;
  } | null {
    const key = this.config.keyGenerator(identifier);
    const data = this.store.get(key);

    if (!data || Date.now() > data.resetTime) {
      return null;
    }

    return {
      remaining: Math.max(0, this.config.maxRequests - data.count),
      resetTime: data.resetTime,
      totalHits: data.count,
    };
  }

  /**
   * Cleans up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, data] of this.store.entries()) {
      if (now > data.resetTime) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Gets statistics about the rate limiter
   */
  getStats(): {
    activeKeys: number;
    totalRequests: number;
    averageRequestsPerKey: number;
  } {
    const totalRequests = Array.from(this.store.values())
      .reduce((sum, data) => sum + data.count, 0);

    return {
      activeKeys: this.store.size,
      totalRequests,
      averageRequestsPerKey: this.store.size > 0 ? totalRequests / this.store.size : 0,
    };
  }
}

/**
 * Pre-configured rate limiters for different use cases
 */
export const rateLimiters = {
  // API requests - 100 requests per 15 minutes
  api: new RateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
  }),

  // Authentication - 5 attempts per 15 minutes
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
  }),

  // Chat messages - 30 messages per minute
  chat: new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 30,
  }),

  // File uploads - 10 uploads per hour
  upload: new RateLimiter({
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
  }),

  // Search queries - 50 searches per 5 minutes
  search: new RateLimiter({
    windowMs: 5 * 60 * 1000,
    maxRequests: 50,
  }),
};

/**
 * Client-side rate limiting hook for React components
 */
export function useRateLimit(
  limiterType: keyof typeof rateLimiters,
  identifier: string = 'default'
) {
  const limiter = rateLimiters[limiterType];

  const checkLimit = (): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } => {
    const result = limiter.checkLimit(identifier);
    return {
      allowed: result.allowed,
      remaining: result.remaining,
      resetTime: result.resetTime,
    };
  };

  const getStatus = () => {
    return limiter.getStatus(identifier);
  };

  const resetLimit = () => {
    limiter.resetLimit(identifier);
  };

  return {
    checkLimit,
    getStatus,
    resetLimit,
  };
}

/**
 * Middleware for rate limiting API requests
 */
export function createRateLimitMiddleware(
  limiterType: keyof typeof rateLimiters,
  options: {
    keyGenerator?: (req: Request) => string;
    onLimitReached?: (req: Request, res: Response) => void;
    skipUrls?: string[];
  } = {}
) {
  const limiter = rateLimiters[limiterType];
  
  const defaultKeyGenerator = (req: Request): string => {
    // Try to get IP from various headers
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    
    return forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown';
  };

  const {
    keyGenerator = defaultKeyGenerator,
    onLimitReached,
    skipUrls = [],
  } = options;

  return async (req: Request): Promise<Response | null> => {
    // Skip rate limiting for specified URLs
    const url = new URL(req.url);
    if (skipUrls.some(skipUrl => url.pathname.includes(skipUrl))) {
      return null;
    }

    const identifier = keyGenerator(req);
    const result = limiter.checkLimit(identifier);

    // Add rate limit headers
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', rateLimiters[limiterType]['config'].maxRequests.toString());
    headers.set('X-RateLimit-Remaining', result.remaining.toString());
    headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

    if (!result.allowed) {
      if (onLimitReached) {
        const response = new Response();
        onLimitReached(req, response);
      }

      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: `Too many requests. Limit: ${rateLimiters[limiterType]['config'].maxRequests} per ${rateLimiters[limiterType]['config'].windowMs / 1000} seconds`,
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...Object.fromEntries(headers.entries()),
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    return null; // Allow the request to proceed
  };
}

/**
 * Rate limiting decorator for class methods
 */
export function rateLimit(
  limiterType: keyof typeof rateLimiters,
  keyGenerator?: (this: any, ...args: any[]) => string
) {
  return function <T extends (...args: any[]) => any>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const method = descriptor.value!;
    
    descriptor.value = function (this: any, ...args: any[]): any {
      const identifier = keyGenerator ? keyGenerator.apply(this, args) : 'default';
      const limiter = rateLimiters[limiterType];
      const result = limiter.checkLimit(identifier);

      if (!result.allowed) {
        throw new Error(`Rate limit exceeded for ${propertyName}. Try again in ${Math.ceil((result.resetTime - Date.now()) / 1000)} seconds.`);
      }

      return method.apply(this, args);
    } as T;

    return descriptor;
  };
}

/**
 * Utility functions for rate limit management
 */
export const rateLimitUtils = {
  /**
   * Creates a custom rate limiter
   */
  createLimiter: (config: RateLimitConfig) => new RateLimiter(config),

  /**
   * Gets all rate limiter statistics
   */
  getAllStats: () => {
    const stats: Record<string, any> = {};
    
    for (const [name, limiter] of Object.entries(rateLimiters)) {
      stats[name] = limiter.getStats();
    }

    return stats;
  },

  /**
   * Resets all rate limiters
   */
  resetAll: () => {
    for (const limiter of Object.values(rateLimiters)) {
      limiter['store'].clear();
    }
  },

  /**
   * Checks if an identifier is currently rate limited
   */
  isLimited: (limiterType: keyof typeof rateLimiters, identifier: string): boolean => {
    const status = rateLimiters[limiterType].getStatus(identifier);
    return status ? status.remaining === 0 : false;
  },
};

// Export types
export type { RateLimitConfig, RateLimitData };
export { RateLimiter };

const rateLimitingUtils = {
  rateLimiters,
  useRateLimit,
  createRateLimitMiddleware,
  rateLimit,
  rateLimitUtils,
  RateLimiter,
};

export default rateLimitingUtils;
