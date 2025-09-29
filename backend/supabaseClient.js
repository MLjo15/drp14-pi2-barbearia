// backend/supabaseClient.js
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load .env as early as possible when this module is imported
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  const missing = [];
  if (!supabaseUrl) missing.push("SUPABASE_URL");
  if (!supabaseServiceKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  console.error(`Missing environment variable(s): ${missing.join(", ")} in backend/.env`);
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});
