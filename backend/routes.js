/**
 * @file backend/routes.js
 * @description Define todas as rotas da API para a aplicação.
 * Este arquivo centraliza a lógica para:
 * - Autenticação com a API do Google Calendar (OAuth2).
 * - CRUD (Create, Read) para Barbearias e Agendamentos.
 * - Cálculo de horários de disponibilidade.
 */

import { google } from "googleapis";
import express from "express";
import { supabase } from "./supabaseClient.js";

/**
 * Configura e anexa todas as rotas da API à instância do aplicativo Express.
 * @param {express.Application} app - A instância do aplicativo Express.
 */
export function setupRoutes(app) {
  // Middleware de log simples para todas as requisições /api, auxiliando na depuração.
  app.use('/api', (req, res, next) => {
    try {
      console.log(`[API] ${req.method} ${req.originalUrl}`);
      // Loga o corpo da requisição para POST, útil para depurar payloads.
      if (req.method === 'POST' && req.body) {
        console.log('[API] body:', JSON.stringify(req.body).slice(0, 1000));
      }
    } catch (err) {
      // Ignora erros de logging para não quebrar a aplicação.
    }
    next();
  });

  // --- CONFIGURAÇÃO DO CLIENTE OAUTH2 DO GOOGLE ---
  // Inicializa o cliente OAuth2 com as credenciais do ambiente.
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  /**
   * @route GET /api/auth/google
   * @description Inicia o fluxo de autenticação OAuth2 com o Google.
   * Redireciona o usuário para a tela de consentimento do Google.
   * O `shop_id` é passado no parâmetro 'state' para ser recuperado no callback.
   */
  app.get("/api/auth/google", (req, res) => {
    const { shop_id } = req.query;
    if (!shop_id) return res.status(400).send("Faltando shop_id");

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/calendar.events"],
      prompt: "consent",
      state: shop_id // Passa o ID da barbearia através do fluxo OAuth.
    });

    res.redirect(url);
  });

  /**
   * @route GET /api/auth/google/callback
   * @description Rota de callback chamada pelo Google após o consentimento do usuário.
   * Recebe o código de autorização, troca-o por tokens de acesso e de atualização,
   * e salva esses tokens de forma segura no Supabase, associados ao `shop_id`.
   * Redireciona o usuário de volta para o frontend com um status de sucesso ou erro.
   */
  app.get("/api/auth/google/callback", async (req, res) => {
    const { code, state } = req.query;
    const shop_id = state;

    if (!code || !shop_id) {
      return res.status(400).send("Código ou ShopID ausente.");
    }

    try {
      // Troca o código de autorização por tokens.
      const { tokens } = await oauth2Client.getToken(code);

      // Salva os tokens no Supabase. `upsert` cria ou atualiza o registro para o shop_id.
      const { error } = await supabase
        .from("shop_google_tokens")
        .upsert({
          shop_id,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          scope: tokens.scope,
          token_type: tokens.token_type,
          expiry_date: tokens.expiry_date,
          updated_at: new Date()
        });

      if (error) throw error;

      // Redireciona de volta para o frontend com um parâmetro de status.
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}?google_auth_status=success`);

    } catch (err) {
      console.error("Erro no callback Google:", err);
      // Em caso de erro, redireciona para o frontend com status de erro.
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}?google_auth_status=error`);
    }
  });

  /**
   * @route POST /api/agendamento
   * @description Cria um novo agendamento.
   * 1. Verifica se o cliente já existe pelo email; se não, cria um novo.
   * 2. Insere o agendamento na tabela `appointments`.
   * 3. Busca os tokens do Google da barbearia.
   * 4. Usa o refresh_token para obter um novo access_token.
   * 5. Cria um evento correspondente no Google Calendar do proprietário da barbearia.
   */
  app.post("/api/agendamento", async (req, res) => {
    const { shop_id, cliente_nome, cliente_email, cliente_telefone, servico, data_hora_inicio, data_hora_fim } = req.body;
    console.log('[agendamento] recebendo:', { shop_id, cliente_email, data_hora_inicio, data_hora_fim });

    try {
      // 1. Verifica se o cliente já existe pelo e-mail.
      let { data: cliente } = await supabase
        .from("clientes")
        .select("id")
        .eq("email", cliente_email)
        .single();

      if (!cliente) {
        // Se não existir, cria um novo cliente.
        const { data: novoCliente, error: clienteErro } = await supabase
          .from("clientes")
          .insert([{ nome: cliente_nome, email: cliente_email, telefone: cliente_telefone }])
          .select()
          .single();
        if (clienteErro) throw clienteErro;
        cliente = novoCliente;
      }

      // 2. Insere o novo agendamento no banco de dados.
      const { data: agendamento, error } = await supabase
        .from("appointments")
        .insert([{
          shop_id,
          cliente_id: cliente.id,
          servico,
          data_hora_inicio,
          data_hora_fim
        }])
        .select()
        .single();

      if (error) {
        console.error('[agendamento] erro insert:', error);
        throw error;
      }

      console.log('[agendamento] criado id:', agendamento?.id);

      // 3. Busca os tokens do Google associados à barbearia.
      const { data: tokens } = await supabase
        .from("shop_google_tokens")
        .select("access_token, refresh_token")
        .eq("shop_id", shop_id)
        .single();

      if (tokens && tokens.refresh_token) {
        // Cria um novo cliente OAuth2 para esta requisição específica.
        const oauthClient = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI
        );

        // Usa o refresh_token para obter um novo access_token, garantindo que a sessão não expirou.
        oauthClient.setCredentials({ refresh_token: tokens.refresh_token });
        try {
          const accessResponse = await oauthClient.getAccessToken();
          const newAccessToken = accessResponse && accessResponse.token ? accessResponse.token : tokens.access_token;

          // Atualiza o access_token no banco de dados para uso futuro.
          await supabase
            .from('shop_google_tokens')
            .upsert({ shop_id, access_token: newAccessToken, updated_at: new Date() }, { onConflict: 'shop_id' });

          // Inicializa o cliente do Google Calendar com a autenticação.
          const calendar = google.calendar({ version: 'v3', auth: oauthClient });

          // 4. Cria o evento no Google Calendar do proprietário.
          await calendar.events.insert({
            calendarId: 'primary',
            requestBody: {
              summary: `Agendamento - ${cliente_nome}`,
              description: `Serviço: ${servico}\nCliente: ${cliente_nome}\nEmail: ${cliente_email}`,
              start: { dateTime: data_hora_inicio, timeZone: 'America/Sao_Paulo' },
              end: { dateTime: data_hora_fim, timeZone: 'America/Sao_Paulo' }
            }
          });
        } catch (err) {
          console.error('Erro ao criar evento no Google Calendar (token pode ter sido revogado):', err.message);
          // Continua sem falhar a criação do agendamento. O agendamento ainda está salvo no sistema,
          // apenas a sincronização com o Google Calendar falhou.
        }
      }

      res.json({ success: true, agendamento });
    } catch (err) {
      console.error("Erro ao criar agendamento:", err);
      res.status(500).json({ error: "Erro no agendamento" });
    }
  });

  /**
   * @route GET /api/barbearias
   * @description Lista todas as barbearias cadastradas.
   * Usado pelo frontend para popular o seletor de barbearias no formulário de agendamento.
   */
  app.get("/api/barbearias", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("barbearias")
        .select("id, nome, intervalo, fuso_horario")
        .order("nome", { ascending: true });

      if (error) throw error;

      res.json({ success: true, barbearias: data });
    } catch (err) {
      console.error("Erro ao listar barbearias:", err);
      res.status(500).json({ success: false, error: "Erro ao listar barbearias" });
    }
  });

  /**
   * @route GET /api/barbearias/:id
   * @description Obtém os dados detalhados de uma barbearia específica, incluindo seus horários de funcionamento.
   * Usado para determinar os dias de funcionamento no calendário do frontend.
   */
  app.get('/api/barbearias/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const { data: barbearia, error: bErr } = await supabase
        .from('barbearias')
        .select('id, nome, intervalo, fuso_horario')
        .eq('id', id)
        .single();

      if (bErr) throw bErr;

      const { data: horarios, error: hErr } = await supabase
        .from('barbearia_horarios')
        .select('dia_semana, hora_abertura, hora_fechamento, intervalo_minutos')
        .eq('shop_id', id);

      if (hErr) throw hErr;

      res.json({ success: true, barbearia, horarios });
    } catch (err) {
      console.error('/api/barbearias/:id erro', err);
      res.status(500).json({ success: false, error: err?.message || 'Erro ao buscar barbearia' });
    }
  });

  /**
   * @route GET /api/barbearias/:id/availability
   * @description Calcula e retorna os horários (slots) disponíveis para uma barbearia em uma data específica.
   * @param {string} req.params.id - O ID da barbearia.
   * @param {string} req.query.date - A data no formato 'YYYY-MM-DD'.
   */
  app.get('/api/barbearias/:id/availability', async (req, res) => {
    const { id } = req.params;
    const { date } = req.query; // Espera o formato 'YYYY-MM-DD'

    if (!date) return res.status(400).json({ success: false, error: 'Parâmetro date é obrigatório (YYYY-MM-DD)' });

    try {
      // 1. Busca os detalhes da barbearia e seus horários de funcionamento.
      const { data: barbearia } = await supabase.from('barbearias').select('id, intervalo, fuso_horario').eq('id', id).single();
      const { data: horarios } = await supabase.from('barbearia_horarios').select('dia_semana, hora_abertura, hora_fechamento, intervalo_minutos').eq('shop_id', id);

      // 2. Determina o dia da semana (0=Domingo, 1=Segunda, ...) para a data fornecida.
      const day = new Date(date + 'T00:00:00').getDay();

      // 3. Encontra os períodos de funcionamento para esse dia da semana.
      const todays = (horarios || []).filter(h => Number(h.dia_semana) === Number(day));

      // Se não houver horários específicos, usa um bloco padrão (ex: 09:00-17:00).
      const periods = todays.length ? todays : [{ hora_abertura: '09:00:00', hora_fechamento: '17:00:00', intervalo_minutos: barbearia?.intervalo || 30 }];

      // 4. Busca todos os agendamentos já existentes para essa barbearia nesse dia.
      const dayStart = `${date}T00:00:00`;
      const dayEnd = `${date}T23:59:59`;
      const { data: appointments } = await supabase.from('appointments').select('data_hora_inicio, data_hora_fim').eq('shop_id', id).gte('data_hora_inicio', dayStart).lte('data_hora_inicio', dayEnd);
      console.log(`/api/barbearias/${id}/availability for ${date} - found appointments:`, (appointments || []).length);

      // Função auxiliar para criar um objeto Date a partir da data e de uma string de hora 'HH:MM:SS'.
      const makeDateTime = (d, timeStr) => new Date(`${d}T${timeStr}`);

      const slots = [];

      // 5. Itera sobre cada período de funcionamento do dia.
      for (const p of periods) {
        const intervalo = p.intervalo_minutos || barbearia?.intervalo || 30;
        let current = makeDateTime(date, p.hora_abertura);
        const end = makeDateTime(date, p.hora_fechamento);

        // 6. Gera slots de horário do início ao fim do período, com base no intervalo.
        while (current.getTime() + intervalo * 60000 <= end.getTime()) {
          const slotStart = new Date(current);
          const slotEnd = new Date(current.getTime() + intervalo * 60000);

          // 7. Verifica se o slot gerado se sobrepõe a algum agendamento existente.
          const overlap = (appointments || []).some(ap => {
            try {
              const apStart = new Date(ap.data_hora_inicio);
              const apEnd = new Date(ap.data_hora_fim);
              return apStart < slotEnd && apEnd > slotStart;
            } catch (e) {
              return false;
            }
          });

          // 8. Se não houver sobreposição, o slot está disponível e é adicionado à lista.
          if (!overlap) {
            slots.push({ start: slotStart.toISOString(), end: slotEnd.toISOString() });
          }

          current = new Date(current.getTime() + intervalo * 60000);
        }
      }

      res.json({ success: true, slots });
    } catch (err) {
      console.error('/api/barbearias/:id/availability erro', err);
      res.status(500).json({ success: false, error: err?.message || 'Erro ao calcular disponibilidade' });
    }
  });

  /**
   * @route POST /api/barbearias
   * @description Cadastra uma nova barbearia e seus horários de funcionamento.
   * Retorna os dados da barbearia criada.
   */
  app.post("/api/barbearias", async (req, res) => {
    const { nome, proprietario, email, telefone, endereco, intervalo, fuso_horario, horarios } = req.body;

    console.log('[API] POST /api/barbearias - Recebido:', { nome, email });

    try {
      // 1. Insere a barbearia
      const { data: barbeariaData, error: barbeariaError } = await supabase
        .from("barbearias")
        .insert([{ nome, proprietario, email, telefone, endereco, intervalo, fuso_horario }])
        .select()
        .single();

      if (barbeariaError) {
        console.error('[API] Erro ao inserir barbearia no Supabase:', barbeariaError);
        // Trata o erro de violação de chave única (ex: email duplicado).
        if (barbeariaError.code === '23505') {
          return res.status(409).json({ success: false, error: 'Este email já está em uso.' });
        }
        throw barbeariaError;
      }

      console.log('[API] Barbearia cadastrada com sucesso:', { id: barbeariaData?.id, nome: barbeariaData?.nome });

      // 2. Se horários foram fornecidos, insere-os na tabela `barbearia_horarios`.
      if (Array.isArray(horarios) && horarios.length > 0) {
        const horariosParaInserir = horarios.map(h => ({
          shop_id: barbeariaData.id,
          ...h
        }));
        const { error: horariosError } = await supabase.from('barbearia_horarios').insert(horariosParaInserir);
        if (horariosError) {
          console.error('[API] Erro ao inserir horários, mas a barbearia foi criada:', horariosError);
        }
      }

      res.status(201).json({ success: true, barbearia: barbeariaData });
    } catch (err) {
      console.error("[API] Erro GERAL ao cadastrar barbearia:", err);
      res.status(500).json({ success: false, error: err.message || 'Erro ao cadastrar barbearia' });
    }
  });
}
