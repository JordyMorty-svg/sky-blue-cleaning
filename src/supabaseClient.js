import { createClient } from "@supabase/supabase-js";

// Values come from .env (local) and Netlify env vars (production).
// These are the publishable URL + key — safe for the browser because
// Row-Level Security governs what the anon role can actually do.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);