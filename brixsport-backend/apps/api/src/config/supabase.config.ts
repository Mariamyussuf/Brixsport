import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration using environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file and ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
  );
}

// Supabase client configuration for server-side operations
const supabaseOptions = {
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
      'X-Client-Info': 'brixsport-backend-api'
    }
  }
};

// Create a single supabase client for interacting with the database
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, supabaseOptions);

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