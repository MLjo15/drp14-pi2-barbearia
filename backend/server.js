// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
// CORREÇÃO: Importa a função setupRoutes de routes.js
import { setupRoutes } from "./routes.js"; 
import { supabase } from "./supabaseClient.js"; // Importa o cliente Supabase

// Carrega as variáveis de ambiente (útil para desenvolvimento local)
dotenv.config();

const app = express();

// --- CONFIGURAÇÃO DO CORS (CRUCIAL PARA VERCEL <-> RENDER) ---
// VITE_FRONTEND_URL deve ser definida no seu backend (Render) com o domínio do Vercel
const allowedOrigin = process.env.VITE_FRONTEND_URL || 'http://localhost:5173';
console.log(`CORS configurado para a origem: ${allowedOrigin}`);

app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Serve static files if needed (ajuste o caminho conforme a estrutura do seu projeto)
app.use(express.static(path.join(path.dirname(new URL(import.meta.url).pathname), "..", "public")));

// Monta as rotas API definidas em routes.js
setupRoutes(app);

// Rota de saúde simples (Health Check)
app.get("/api/health", (req, res) => res.json({ ok: true }));

// --- MECANISMOS ANTI-SLEEP E DE MANUTENÇÃO ---

// Rota de PING para manter o Render ativo (chamada a cada ~10 minutos)
app.get('/ping', (req, res) => {
    // Retorna um status 200 OK. Isso é o suficiente para 'acordar' o Render.
    // Esta rota deve ser chamada pelo seu serviço de Cron Job externo (UptimeRobot).
    res.status(200).send('Serviço ativo.');
});

// Rota de Manutenção Semanal (chamada diariamente pelo UptimeRobot, mas executa a cada 6 dias)
// ATENÇÃO: É necessário ter a tabela 'manutencao_log' criada no Supabase
app.get('/api/manutencao-semanal', async (req, res) => {
    const SIX_DAYS_MS = 6 * 24 * 60 * 60 * 1000;
    const now = new Date();

    try {
        // --- 1. Verificar Última Execução ---
        const { data: lastExecution, error: fetchError } = await supabase
            .from('manutencao_log')
            .select('data_execucao')
            .eq('tarefa', 'Limpeza de Dados (A cada 6 dias)')
            .order('data_execucao', { ascending: false })
            .limit(1)
            .single();
        
        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: No rows found
             console.error('Erro ao buscar log:', fetchError);
             throw fetchError;
        }

        if (lastExecution && (now.getTime() - new Date(lastExecution.data_execucao).getTime()) < SIX_DAYS_MS) {
            console.log('Manutenção já rodou nos últimos 6 dias. Pulando.');
            res.status(200).send('Manutenção pulada (executada recentemente).');
            return;
        }

        console.log('Iniciando rotina de manutenção a cada 6 dias...');

        // --- 2. Deletar Dados Antigos (Exemplo de 6 dias) ---
        const SIX_DAYS_AGO = new Date(Date.now() - SIX_DAYS_MS).toISOString();
        
        const { error: deleteError } = await supabase
            .from('manutencao_log')
            .delete()
            .lt('created_at', SIX_DAYS_AGO);

        if (deleteError) {
             console.error('Erro ao deletar:', deleteError);
             throw deleteError;
        }
        
        // --- 3. Criar Novo Registro (Log da Execução) ---
        const { error: insertError } = await supabase
            .from('manutencao_log')
            .insert([
                { tarefa: 'Limpeza de Dados (A cada 6 dias)', status: 'concluida', data_execucao: now.toISOString() }
            ]);

        if (insertError) {
            console.error('Erro ao inserir:', insertError);
            throw insertError;
        }

        console.log('Manutenção a cada 6 dias concluída com sucesso.');
        res.status(200).send('Manutenção a cada 6 dias concluída com sucesso (Supabase).');

    } catch (e) {
        console.error('Erro geral na Manutenção Semanal:', e.message);
        res.status(500).json({ error: 'Erro na Manutenção Semanal: ' + e.message });
    }
});


// Rota Catch-all 404 (para rotas que não são /api/...)
app.use((req, res) => {
    console.log(`[404] Rota não encontrada: ${req.originalUrl}`);
    res.status(404).json({ error: 'Endpoint não encontrado. Verifique se o prefixo /api/ está correto.' });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
