import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

// Debug: Check if credentials are loaded
console.log("🔵 Supabase URL:", supabaseUrl ? "✅ Loaded" : "❌ Missing");
console.log("🔵 Supabase Key:", supabaseKey ? "✅ Loaded" : "❌ Missing");

if (!supabaseUrl || !supabaseKey) {
  console.error("🔴 CRITICAL: Supabase credentials are missing!");
  console.error("Please check your .env file contains:");
  console.error("VITE_SUPABASE_URL=your_url");
  console.error("VITE_SUPABASE_KEY=your_key");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

export default supabase;