import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Creates a standard server client using anonymous/publishable key.
 */
export const createServerClient = () => {
  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });
};

/**
 * Creates an administrative service-role client for background jobs, scraping, AI analysis, and log writes.
 * WARNING: Never expose this client or SUPABASE_SERVICE_ROLE_KEY to browser bundles.
 */
export const createServiceRoleClient = () => {
  const key = supabaseServiceRoleKey || supabaseAnonKey;
  return createSupabaseClient<Database>(supabaseUrl, key, {
    auth: {
      persistSession: false,
    },
  });
};
