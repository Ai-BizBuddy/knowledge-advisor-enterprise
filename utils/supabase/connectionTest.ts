import { createClient } from './client';

/**
 * Test Supabase connection and configuration
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  details?: {
    url?: string;
    schema?: string;
    tablesAccessible?: boolean;
    authWorking?: boolean;
    error?: string;
    hasUrl?: boolean;
    hasAuth?: boolean;
    hasAnonKey?: boolean;
    hint?: string;
    hasDatabase?: boolean;
    isAuthenticated?: boolean;
    user?: string | null;
  };
}> {
  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        success: false,
        message: 'Supabase environment variables not configured',
        details: {
          hasUrl: !!supabaseUrl,
          hasAnonKey: !!supabaseAnonKey,
          hint: 'Check your .env.local file for NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY',
        },
      };
    }

    // Test basic connection
    const supabase = createClient();

    // Try to get current session (this will work even without authentication)
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) {
      return {
        success: false,
        message: 'Failed to connect to Supabase Auth',
        details: {
          error: sessionError.message,
          hint: 'Check your Supabase URL and anon key',
        },
      };
    }

    // Test database connection by checking if we can read from a basic table
    // This will fail gracefully if tables don't exist
    const { data: testData, error: dbError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    void testData; // Explicitly ignore the data, we only care if the query succeeds

    if (dbError) {
      return {
        success: false,
        message: 'Database connection failed',
        details: {
          error: dbError.message,
          hint:
            dbError.code === '42P01'
              ? "knowledge_base table doesn't exist - run database migrations"
              : 'Check your database permissions and table setup',
        },
      };
    }

    return {
      success: true,
      message: 'Supabase connection successful',
      details: {
        hasAuth: true,
        hasDatabase: true,
        isAuthenticated: !!sessionData.session,
        user: sessionData.session?.user?.email || null,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: 'Unexpected error during connection test',
      details: {
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

/**
 * Test authentication status
 */
export async function testAuthentication(): Promise<{
  isAuthenticated: boolean;
  user?: {
    id: string;
    email?: string;
  };
  error?: string;
}> {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      return {
        isAuthenticated: false,
        error: error.message,
      };
    }

    return {
      isAuthenticated: !!user,
      user: user
        ? {
            id: user.id,
            email: user.email,
          }
        : undefined,
    };
  } catch (error) {
    return {
      isAuthenticated: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
