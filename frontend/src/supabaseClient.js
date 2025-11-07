/**
 * @file frontend/src/supabaseClient.js
 * @description Configura e exporta o cliente Supabase para ser utilizado em todo o frontend da aplicação.
 * Este arquivo é responsável por:
 * - Obter as variáveis de ambiente do Supabase específicas para o frontend (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
 * - Inicializar o cliente Supabase com essas credenciais.
 */

import { createClient } from "@supabase/supabase-js";

// --- OBTENÇÃO DE CREDENCIAIS DO SUPABASE PARA O FRONTEND ---
// As variáveis de ambiente são acessadas através de `import.meta.env` no Vite.
// `VITE_SUPABASE_URL`: A URL do seu projeto Supabase.
// `VITE_SUPABASE_ANON_KEY`: A chave pública (anon key) do seu projeto Supabase.
// É crucial que estas variáveis sejam prefixadas com VITE_ para serem expostas ao código do cliente.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// --- INICIALIZAÇÃO DO CLIENTE SUPABASE ---
// Cria e exporta o cliente Supabase.
// Este cliente será usado para interagir com o banco de dados e autenticação a partir do frontend.
// A chave anônima é segura para ser usada no cliente, pois possui permissões limitadas.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
