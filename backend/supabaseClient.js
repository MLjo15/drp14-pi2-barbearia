/**
 * @file backend/supabaseClient.js
 * @description Configura e exporta o cliente Supabase para ser utilizado em todo o backend.
 * Este arquivo é responsável por:
 * - Carregar as variáveis de ambiente necessárias.
 * - Inicializar o cliente Supabase com as credenciais de URL e Service Role Key.
 * - Realizar uma verificação de segurança para garantir que as variáveis de ambiente estejam presentes.
 */

// --- IMPORTAÇÕES DE MÓDULOS ---
import dotenv from "dotenv"; // Módulo para carregar variáveis de ambiente de um arquivo .env.
import { createClient } from "@supabase/supabase-js"; // Função para criar o cliente Supabase.

// --- CARREGAMENTO DE VARIÁVEIS DE AMBIENTE ---
// Carrega as variáveis de ambiente do arquivo .env o mais cedo possível.
// Isso garante que SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estejam disponíveis.
dotenv.config();

// --- OBTENÇÃO DE CREDENCIAIS DO SUPABASE ---
// As credenciais são obtidas das variáveis de ambiente.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// --- VERIFICAÇÃO DE SEGURANÇA E ERRO ---
// Verifica se as variáveis de ambiente essenciais foram carregadas.
// Se alguma estiver faltando, um erro é logado e o processo é encerrado para evitar falhas em tempo de execução.
if (!supabaseUrl || !supabaseServiceKey) {
  const missing = [];
  if (!supabaseUrl) missing.push("SUPABASE_URL");
  if (!supabaseServiceKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  console.error(`Missing environment variable(s): ${missing.join(", ")} in backend/.env`);
  process.exit(1); // Encerra o processo com código de erro.
}

// --- INICIALIZAÇÃO DO CLIENTE SUPABASE ---
// Cria e exporta o cliente Supabase.
// A `supabaseServiceKey` é usada para operações de backend que exigem privilégios elevados.
// `auth: { persistSession: false }` é importante para o backend, pois não há sessão de usuário a ser persistida.
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

console.log("[Supabase] Cliente Supabase inicializado com sucesso.");
