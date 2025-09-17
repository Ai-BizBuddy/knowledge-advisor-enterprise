/**
 * Environment Validation Utilities
 *
 * Validates and sanitizes environment variables for security
 */

interface EnvironmentConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  schema: string;
  ingressService?: string;
  langflowSearchPath?: string;
  langflowChatPath?: string;
  adkBaseUrl?: string;
  storageUrl?: string;
}

/**
 * Validates required environment variables
 */
export function validateEnvironment(): EnvironmentConfig {
  const requiredVars = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };

  // Check for required variables
  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  // Validate URL formats
  const urlValidation = [
    { key: 'supabaseUrl', url: requiredVars.supabaseUrl },
    { key: 'ingressService', url: process.env.NEXT_PUBLIC_INGRESS_SERVICE },
    { key: 'adkBaseUrl', url: process.env.NEXT_PUBLIC_ADK_BASE_URL },
  ];

  for (const { key, url } of urlValidation) {
    if (url && !isValidUrl(url)) {
      throw new Error(`Invalid URL format for ${key}: ${url}`);
    }
  }

  return {
    supabaseUrl: requiredVars.supabaseUrl!,
    supabaseAnonKey: requiredVars.supabaseAnonKey!,
    schema: process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || 'knowledge',
    ingressService: process.env.NEXT_PUBLIC_INGRESS_SERVICE,
    langflowSearchPath: process.env.NEXT_PUBLIC_LANGFLOW_SEARCH_PATH,
    langflowChatPath: process.env.NEXT_PUBLIC_LANGFLOW_CHAT_PATH,
    adkBaseUrl: process.env.NEXT_PUBLIC_ADK_BASE_URL,
    storageUrl: process.env.NEXT_PUBLIC_STORAGE_URL,
  };
}

/**
 * Validates URL format and allowed protocols
 */
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    // Only allow HTTPS in production, allow HTTP for development
    const allowedProtocols =
      process.env.NODE_ENV === 'production' ? ['https:'] : ['http:', 'https:'];

    return allowedProtocols.includes(url.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitizes environment variables to prevent injection
 */
export function sanitizeEnvVar(value: string | undefined): string | undefined {
  if (!value) return undefined;

  // Remove potentially dangerous characters
  return value
    .replace(/[<>\"'&]/g, '') // Remove HTML/XML special chars
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/data:/gi, '') // Remove data protocol
    .trim();
}

/**
 * Gets environment configuration with validation
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  try {
    return validateEnvironment();
  } catch (error) {
    
    // In development, provide fallbacks
    if (process.env.NODE_ENV === 'development') {
            return {
        supabaseUrl:
          process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://localhost:54321',
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dev-key',
        schema: 'knowledge',
      };
    }

    throw error;
  }
}

/**
 * Runtime environment checks
 */
export const environmentChecks = {
  isProduction: () => process.env.NODE_ENV === 'production',
  isDevelopment: () => process.env.NODE_ENV === 'development',
  isServer: () => typeof window === 'undefined',
  isClient: () => typeof window !== 'undefined',

  /**
   * Checks if we're running in a secure context
   */
  isSecureContext: () => {
    if (typeof window === 'undefined') return true; // Server-side
    return window.isSecureContext;
  },

  /**
   * Validates runtime security requirements
   */
  validateRuntimeSecurity: () => {
    const checks = {
      httpsInProduction:
        !environmentChecks.isProduction() ||
        environmentChecks.isSecureContext(),
      environmentVariables: true,
    };

    try {
      validateEnvironment();
    } catch {
      checks.environmentVariables = false;
    }

    return {
      ...checks,
      allPassed: Object.values(checks).every(Boolean),
    };
  },
};

const environmentUtils = {
  validateEnvironment,
  sanitizeEnvVar,
  getEnvironmentConfig,
  environmentChecks,
};

export default environmentUtils;
