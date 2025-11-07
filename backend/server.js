/**
 * @file backend/server.js
 * @description Ponto de entrada principal para o servidor backend da aplicação.
 * Este arquivo é responsável por:
 * - Inicializar o servidor Express.
 * - Carregar variáveis de ambiente.
 * - Configurar middlewares (CORS, JSON parser).
 * - Servir arquivos estáticos (se aplicável).
 * - Registrar as rotas da API.
 * - Definir rotas de manutenção ("anti-sleep").
 * - Iniciar o servidor na porta especificada.
 */

// --- IMPORTAÇÕES DE MÓDULOS ---
import express from "express"; // Framework web para Node.js.
import cors from "cors"; // Middleware para habilitar o Cross-Origin Resource Sharing.
import dotenv from "dotenv"; // Módulo para carregar variáveis de ambiente de um arquivo .env.
import path from 'path'; // Módulo nativo do Node.js para lidar com caminhos de arquivos.
import { fileURLToPath } from 'url'; // Utilitário para converter URLs de arquivo para caminhos.
import { setupRoutes } from "./routes.js"; // Função que configura as rotas da aplicação.
import { supabase } from "./supabaseClient.js"; // Cliente Supabase para interação com o banco de dados.

// --- CONFIGURAÇÃO INICIAL E VARIÁVEIS DE AMBIENTE ---
// Carrega as variáveis de ambiente do arquivo .env localizado na raiz do backend.
dotenv.config();

// Inicializa a aplicação Express.
const app = express();

// --- CONFIGURAÇÃO DE MIDDLEWARES ---

// 1. Configuração do CORS (Cross-Origin Resource Sharing)
// Define quais origens (frontends) podem fazer requisições para este backend.
const allowedOrigins = [
  process.env.VITE_FRONTEND_URL, // URL do frontend em produção (ex: https://meu-app.com)
  "http://localhost:5173",       // URL do frontend para desenvolvimento local
].filter(Boolean); // Remove entradas nulas ou vazias caso VITE_FRONTEND_URL não esteja definida.

console.log(`[CORS] Origens permitidas: ${allowedOrigins.join(", ") || "Nenhuma"}`);

app.use(
  cors({
    origin: function (origin, callback) {
      // Permite requisições sem 'origin' (ex: Postman, curl) ou que estejam na lista de permitidas.
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Requisição bloqueada da origem: ${origin}`);
        callback(new Error("Origem não permitida pelo CORS"));
      }
    },
  })
);

// 2. Middleware para parsear o corpo de requisições JSON.
app.use(express.json());

// 3. Middleware para servir arquivos estáticos.
// Útil se o build do seu frontend estiver em uma pasta acessível pelo backend.
const __filename = fileURLToPath(import.meta.url);
app.use(express.static(path.join(path.dirname(__filename), "..", "public")));

// --- REGISTRO DAS ROTAS DA APLICAÇÃO ---
// A função setupRoutes anexa todas as rotas da API (definidas em routes.js) ao app Express.
setupRoutes(app);

// --- ROTAS DE SERVIÇO E MANUTENÇÃO ---

// Rota de "saúde" para verificar se o servidor está no ar.
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Rotas "anti-sleep" para serviços de monitoramento como o UptimeRobot.
// Mantém o serviço ativo em plataformas com planos gratuitos (ex: Render).
app.get("/api/ping", (req, res) => {
  console.log("[API] GET /api/ping - Serviço ativo.");
  return res.status(200).send("Serviço ativo.");
});

app.head("/api/ping", (req, res) => {
  console.log("[API] HEAD /api/ping - Serviço ativo.");
  return res.status(200).end();
});

app.get("/api/maintenance", async (req, res) => {
  // Esta rota também serve para manter o backend ativo, com o bônus
  // de verificar a conexão com o banco de dados Supabase.
  try {
    // Executa uma consulta leve no Supabase para manter a conexão ativa.
    await supabase.from("barbearias").select("id").limit(1);
    console.log("[API] Rotina de manutenção (Supabase) executada com sucesso.");
    res.status(200).send("Manutenção concluída com sucesso (Supabase).");
  } catch (e) {
    console.error("[API] Erro na rotina de manutenção (Supabase):", e.message);
    res.status(500).json({ error: "Erro na Manutenção: " + e.message });
  }
});

// --- TRATAMENTO DE ROTA NÃO ENCONTRADA (404) ---
// Este middleware deve ser o último, pois captura qualquer requisição que não correspondeu a uma rota anterior.
app.use((req, res) => {
  console.log(`[404] Rota não encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: "Endpoint não encontrado. Verifique se o prefixo /api/ está correto.",
  });
});

// --- INICIALIZAÇÃO DO SERVIDOR ---
// Define a porta a partir das variáveis de ambiente, com um fallback para 5000.
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor backend iniciado e ouvindo na porta ${PORT}`));
