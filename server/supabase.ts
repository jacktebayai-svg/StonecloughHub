import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables. Please check SUPABASE_URL and SUPABASE_SERVICE_KEY.');
}

// Server-side Supabase client with service role key for admin operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper function to create client with user's session token
export function createSupabaseServerClient(accessToken?: string) {
  if (!supabaseUrl) {
    throw new Error('Missing SUPABASE_URL environment variable');
  }

  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseAnonKey) {
    throw new Error('Missing SUPABASE_ANON_KEY environment variable');
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: accessToken ? {
        Authorization: `Bearer ${accessToken}`
      } : {}
    }
  });

  return client;
}

export default supabaseAdmin;
