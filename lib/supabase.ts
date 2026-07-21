import { createClient } from "@supabase/supabase-js";

// Fallback placeholders prevent the build from crashing if env vars are
// momentarily missing during Vercel's build step. Real values (set in
// Vercel → Settings → Environment Variables) are used at runtime in the browser.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
