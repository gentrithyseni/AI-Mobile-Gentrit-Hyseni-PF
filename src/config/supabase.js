import { createClient } from '@supabase/supabase-js';

// Replace with env handling you prefer. Keep keys out of source control.
const SUPABASE_URL = process.env.SUPABASE_URL || '<YOUR_SUPABASE_URL>';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '<YOUR_SUPABASE_ANON_KEY>';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
