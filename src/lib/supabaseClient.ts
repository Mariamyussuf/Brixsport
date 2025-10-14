import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration using environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file and ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
  );
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