// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { setupRoutes } from "./routes.js";
import { supabase } from "./supabaseClient.js"; // Importa o cliente Supabase

// Carrega as variáveis de ambiente (útil para desenvolvimento local)
dotenv.config();

const app = express();

// Configuração do CORS (importante para comunicação Frontend/Backend)
app.use(cors({
  // O Render e o Vercel definem a URL de origem.
  // VITE_FRONTEND_URL deve ser definido no seu backend (Render) com o domínio do Vercel
  // Ex: https://drp14-pi2-barbearia.vercel.app
  origin: process.env.VITE_FRONTEND_URL || 'http://localhost:5173', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Serve static files if needed (ajuste o caminho conforme a estrutura do seu projeto)
// Esta linha pode ser removida se não houver arquivos estáticos no backend
app.use(express.static(path.join(path.dirname(new URL(import.meta.url).pathname), "..", "public")));

// Monta as rotas API definidas em routes.js
setupRoutes(app);

// Rota de saúde simples (Health Check)
app.get("/api/health", (req, res) => res.json({ ok: true }));

// --- MECANISMOS ANTI-SLEEP E DE MANUTENÇÃO (Adaptados para o Render) ---

// Rota de PING para manter o Render ativo (chamada por serviço de monitoramento)
app.get('/ping', (req, res) => {
    // Retorna um status 200 OK. Isso é o suficiente para 'acordar' o Render.
    res.status(200).send('Serviço ativo.');
});

// Rota de Manutenção (Exemplo: para deletar logs antigos do Supabase)
// ATENÇÃO: Esta é uma rota de exemplo e DEVE SER protegida ou chamada por um cron job seguro.
// O código abaixo simula a lógica de manutenção. Você pode adaptar ou remover.
const SIX_DAYS_MS = 6 * 24 * 60 * 60 * 1000;

app.get('/manutencao-semanal', async (req, res) => {
    const now = new Date();
    
    try {
        // --- 1. Verifica Última Execução ---
        const { data: lastLog, error: logError } = await supabase
            .from('manutencao_log')
            .select('data_execucao')
            .eq('tarefa', 'Limpeza de Dados (A cada 6 dias)')
            .order('data_execucao', { ascending: false })
            .limit(1)
            .single();

        if (logError && logError.code !== 'PGRST116') { // PGRST116 = No rows found
            console.error('Erro ao buscar último log:', logError);
            throw logError;
        }

        if (lastLog && (now.getTime() - new Date(lastLog.data_execucao).getTime() < SIX_DAYS_MS)) {
            console.log('Manutenção pulada: executada recentemente.');
            res.status(200).send('Manutenção pulada: executada recentemente.');
            return;
        }

        console.log('Iniciando rotina de manutenção a cada 6 dias...');

        // --- 2. Deletar Dados Antigos (Exemplo de 6 dias) ---
        const SIX_DAYS_AGO = new Date(Date.now() - SIX_DAYS_MS).toISOString();
        
        // Exemplo: Deletar dados de log antigos (ajuste a tabela conforme a necessidade)
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


// 💡 O Render (e plataformas cloud) fornece a porta via variável de ambiente PORT.
const PORT = process.env.PORT || 3001; 

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Backend rodando na porta ${PORT}`);
  console.log(`URL do Backend (Render): ${process.env.BASE_URL}`);
});
