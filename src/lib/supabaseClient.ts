import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Helper function to validate and normalize Supabase URL
function validateAndNormalizeSupabaseUrl(url: string | undefined): string {
  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  }

  // Remove any whitespace
  let normalizedUrl = url.trim();

  // Remove trailing slash if present
  normalizedUrl = normalizedUrl.replace(/\/$/, '');

  // Ensure URL starts with https://
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    // If it starts with db., that's incorrect - it should be the project URL
    if (normalizedUrl.startsWith('db.')) {
      throw new Error(
        `Invalid Supabase URL format. The URL should be your project URL (e.g., https://your-project.supabase.co), not a database connection string. Got: ${normalizedUrl.substring(0, 30)}...`
      );
    }
    normalizedUrl = `https://${normalizedUrl}`;
  }

  // Validate URL format
  try {
    const urlObj = new URL(normalizedUrl);
    if (!urlObj.hostname.includes('.supabase.co')) {
      console.warn(
        `Supabase URL hostname doesn't match expected pattern (.supabase.co): ${urlObj.hostname}`
      );
    }
  } catch (error) {
    throw new Error(
      `Invalid Supabase URL format: ${normalizedUrl.substring(0, 50)}. URL must be a valid HTTPS URL.`
    );
  }

  return normalizedUrl;
}

// Supabase configuration using environment variables
const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!rawSupabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file and ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
  );
}

// Validate and normalize the Supabase URL
const supabaseUrl = validateAndNormalizeSupabaseUrl(rawSupabaseUrl);

// Log the URL format (without exposing the full URL for security)
if (typeof window === 'undefined') {
  // Server-side logging
  const urlObj = new URL(supabaseUrl);
  console.log(`[Supabase] Initializing client with URL: https://${urlObj.hostname}`);
  console.log(`[Supabase] URL is set: ${!!rawSupabaseUrl}, Anon key is set: ${!!supabaseAnonKey}`);
} else {
  // Client-side: log in both development and production for debugging
  const urlObj = new URL(supabaseUrl);
  console.log(`[Supabase] Client initialized with hostname: ${urlObj.hostname}`);
  console.log(`[Supabase] Environment check - URL set: ${!!rawSupabaseUrl}, Anon key set: ${!!supabaseAnonKey}`);
  
  // In production, also log a warning if variables seem missing
  if (process.env.NODE_ENV === 'production' && (!rawSupabaseUrl || !supabaseAnonKey)) {
    console.error('[Supabase] ⚠️ WARNING: Supabase environment variables may not be set correctly in production!');
  }
}

// Enhanced Supabase client configuration with better error handling
const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public' as const,
  },
  global: {
    headers: {
      'X-Client-Info': 'brixsport-web-app'
    }
  }
};

// Create a single supabase client for interacting with the database
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);

// For server-side operations, you might want to use service role key
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceRoleKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY not set. Admin operations will not be available.');
}

// Enhanced admin client with specific configuration for server-side operations
export const supabaseAdmin: SupabaseClient | null = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      db: {
        schema: 'public' as const,
      },
      global: {
        headers: {
          'X-Client-Info': 'brixsport-server-app'
        }
      }
    })
  : null;

// Health check function to verify Supabase connection
export const checkSupabaseHealth = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('Competition')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Supabase health check failed:', error.message);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Supabase health check error:', error);
    return false;
  }
};

// Function to handle Supabase errors consistently
export const handleSupabaseError = (error: any): Error => {
  if (error?.message) {
    // Map common Supabase errors to more user-friendly messages
    if (error.message.includes('constraint')) {
      return new Error('Data validation failed. Please check your input.');
    }
    if (error.message.includes('permission')) {
      return new Error('Access denied. You do not have permission to perform this action.');
    }
    if (error.message.includes('network')) {
      return new Error('Network error. Please check your connection and try again.');
    }
    return new Error(error.message);
  }
  return new Error('An unknown error occurred');
};