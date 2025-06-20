
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if the variables are placeholders or missing.
if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL_HERE' || !supabaseUrl.startsWith('http')) {
  throw new Error("Supabase URL is missing or incorrect. Please go to your .env file and replace 'YOUR_SUPABASE_URL_HERE' with the actual URL from your Supabase project settings (API section).");
}
if (!supabaseAnonKey || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY_HERE' || supabaseAnonKey.trim() === '') {
  throw new Error("Supabase anon key is missing or incorrect. Please go to your .env file and replace 'YOUR_SUPABASE_ANON_KEY_HERE' with the actual anon public key from your Supabase project settings (API section).");
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
