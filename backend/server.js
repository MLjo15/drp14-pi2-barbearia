// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
// Importa a função setupRoutes de routes.js
import { setupRoutes } from "./routes.js";
import { supabase } from "./supabaseClient.js"; // Importa o cliente Supabase

// Carrega as variáveis de ambiente (útil para desenvolvimento local)
dotenv.config();

const app = express();

// --- CONFIGURAÇÃO DO CORS (CRUCIAL PARA VERCEL <-> RENDER) ---
const allowedOrigin = process.env.VITE_FRONTEND_URL || 'http://localhost:5173';
console.log(`CORS configurado para a origem: ${allowedOrigin}`);

app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Serve arquivos estáticos (ajuste conforme necessário)
app.use(express.static(path.join(path.dirname(new URL(import.meta.url).pathname), "..", "public")));

// Monta as rotas API definidas em routes.js
setupRoutes(app);

// Rota de saúde simples (Health Check)
app.get("/api/health", (req, res) => res.json({ ok: true }));

// --- MECANISMOS ANTI-SLEEP E DE MANUTENÇÃO ---
app.get('/ping', (req, res) => {
  res.status(200).send('Serviço ativo.');
});

// Rota de manutenção semanal (exemplo com Supabase)
app.get('/api/manutencao-semanal', async (req, res) => {
  const SIX_DAYS_MS = 6 * 24 * 60 * 60 * 1000;
  const now = new Date();
  try {
    const { data: lastExecution, error: fetchError } = await supabase
      .from('manutencao_log')
      .select('data_execucao')
      .eq('tarefa', 'Limpeza de Dados (A cada 6 dias)')
      .order('data_execucao', { ascending: false })
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Erro ao buscar log:', fetchError);
      throw fetchError;
    }

    if (lastExecution && (now.getTime() - new Date(lastExecution.data_execucao).getTime()) < SIX_DAYS_MS) {
      console.log('Manutenção já rodou nos últimos 6 dias. Pulando.');
      res.status(200).send('Manutenção pulada (executada recentemente).');
      return;
    }

    console.log('Iniciando rotina de manutenção a cada 6 dias...');
    const SIX_DAYS_AGO = new Date(Date.now() - SIX_DAYS_MS).toISOString();

    const { error: deleteError } = await supabase
      .from('manutencao_log')
      .delete()
      .lt('created_at', SIX_DAYS_AGO);

    if (deleteError) throw deleteError;

    const { error: insertError } = await supabase
      .from('manutencao_log')
      .insert([{ tarefa: 'Limpeza de Dados (A cada 6 dias)', status: 'concluida', data_execucao: now.toISOString() }]);

    if (insertError) throw insertError;

    console.log('Manutenção concluída com sucesso.');
    res.status(200).send('Manutenção concluída com sucesso (Supabase).');
  } catch (e) {
    console.error('Erro geral na Manutenção Semanal:', e.message);
    res.status(500).json({ error: 'Erro na Manutenção Semanal: ' + e.message });
  }
});

// Rota Catch-all 404
app.use((req, res) => {
  console.log(`[404] Rota não encontrada: ${req.originalUrl}`);
  res.status(404).json({ error: 'Endpoint não encontrado. Verifique se o prefixo /api/ está correto.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});