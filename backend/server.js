// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { setupRoutes } from "./routes.js";
import { supabase } from "./supabaseClient.js"; // Importa o cliente Supabase

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files if needed (adjust path as your project)
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
// ATENÇÃO: Esta rota usa a SUPABASE_SERVICE_ROLE_KEY.
app.get('/weekly-maintenance', async (req, res) => {
    try {
        // 1. VERIFICAÇÃO DE TEMPO: Garante que só executa a cada 6 dias
        const SIX_DAYS_MS = 6 * 24 * 60 * 60 * 1000; // 6 dias em milissegundos
        
        // Busca o último registro de manutenção
        const { data: lastMaintenance, error: fetchError } = await supabase
            .from('manutencao_log')
            .select('data_execucao')
            .order('data_execucao', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (fetchError) throw fetchError;

        const now = new Date();
        let shouldRun = true;

        if (lastMaintenance && lastMaintenance.data_execucao) {
            const lastRun = new Date(lastMaintenance.data_execucao);
            const timeDifference = now.getTime() - lastRun.getTime();
            
            if (timeDifference < SIX_DAYS_MS) {
                // A manutenção já rodou nos últimos 6 dias. Retorna OK sem fazer nada.
                console.log(`Manutenção pulada. Última execução foi em ${lastRun.toISOString()}.`);
                shouldRun = false;
                return res.status(200).send('Manutenção pulada (rodou recentemente).');
            }
        }
        
        if (!shouldRun) return;

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
        res.status(500).send('Erro na Manutenção Semanal.');
    }
});

const PORT = process.env.PORT || 3001; // Usando 3001, consistente com as configs do Render
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
