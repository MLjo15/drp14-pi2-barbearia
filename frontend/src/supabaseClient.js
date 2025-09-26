// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// As variáveis de ambiente devem estar no arquivo frontend/.env
// e começar com VITE_ para serem expostas ao frontend
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
