import { createClient } from '@supabase/supabase-js';

let supabaseInstance: any = null;

// Initialize a default instance if env vars are present, or provide a getter
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance;
  if (supabase) {
    supabaseInstance = supabase;
    return supabaseInstance;
  }
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase credentials missing. Database functionality will be limited.");
    return null;
  }
  
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
};
