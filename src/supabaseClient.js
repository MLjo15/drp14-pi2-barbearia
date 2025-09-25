// src/supabaseClient.js

import { createClient } from '@supabase/supabase-js';

// As variáveis são lidas do arquivo .env graças ao Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);