import { google } from "googleapis";
import express from "express";
import { supabase } from "./supabaseClient.js";

export function setupRoutes(app) {
  // Simple request logger for /api routes to aid debugging
  app.use('/api', (req, res, next) => {
    try {
      console.log(`[API] ${req.method} ${req.originalUrl}`);
      if (req.method === 'POST' && req.body) {
        console.log('[API] body:', JSON.stringify(req.body).slice(0, 1000));
      }
    } catch (err) {
      // ignore logging errors
    }
    next();
  });
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // 🔹 1) Login Google (redireciona para consentimento)
  app.get("/api/auth/google", (req, res) => {
    const { shop_id } = req.query;
    if (!shop_id) return res.status(400).send("Faltando shop_id");

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/calendar.events"],
      prompt: "consent",
      state: shop_id
    });

    res.redirect(url);
  });

  // 🔹 2) Callback Google (salva tokens no Supabase)
  app.get("/api/auth/google/callback", async (req, res) => {
    const { code, state } = req.query;
    const shop_id = state;

    if (!code || !shop_id) {
      return res.status(400).send("Código ou ShopID ausente.");
    }

    try {

      const { tokens } = await oauth2Client.getToken(code);

      // Insere ou atualiza na tabela shop_google_tokens
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

      res.send("✅ Conta Google conectada com sucesso!");
    } catch (err) {
      console.error("Erro no callback Google:", err);
      res.status(500).send("Erro ao conectar conta Google.");
    }
  });

  // 🔹 3) Criar agendamento
  app.post("/api/agendamento", async (req, res) => {
    const { shop_id, cliente_nome, cliente_email, cliente_telefone, servico, data_hora_inicio, data_hora_fim } = req.body;

    try {
      // 1. Verifica se cliente já existe
      let { data: cliente } = await supabase
        .from("clientes")
        .select("id")
        .eq("email", cliente_email)
        .single();

      if (!cliente) {
        // Cria cliente
        const { data: novoCliente, error: clienteErro } = await supabase
          .from("clientes")
          .insert([{ nome: cliente_nome, email: cliente_email, telefone: cliente_telefone }])
          .select()
          .single();
        if (clienteErro) throw clienteErro;
        cliente = novoCliente;
      }

      // 2. Cria agendamento
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

      if (error) throw error;

      // 3. Busca tokens do Google
      const { data: tokens } = await supabase
        .from("shop_google_tokens")
        .select("access_token, refresh_token")
        .eq("shop_id", shop_id)
        .single();

      if (tokens && tokens.refresh_token) {
        // Create a fresh OAuth2 client for this request
        const oauthClient = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI
        );

        // Use the refresh token to obtain a valid access token
        oauthClient.setCredentials({ refresh_token: tokens.refresh_token });
        try {
          const accessResponse = await oauthClient.getAccessToken();
          const newAccessToken = accessResponse && accessResponse.token ? accessResponse.token : tokens.access_token;

          // update stored access token (do not overwrite refresh_token unless provided)
          await supabase
            .from('shop_google_tokens')
            .upsert({ shop_id, access_token: newAccessToken, updated_at: new Date() }, { onConflict: 'shop_id' });

          const calendar = google.calendar({ version: 'v3', auth: oauthClient });

          // 4. Cria evento no Calendar
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
          console.error('Erro ao renovar access_token:', err);
          // continue without failing appointment creation — backend still saved appointment
        }
      }

      res.json({ success: true, agendamento });
    } catch (err) {
      console.error("Erro ao criar agendamento:", err);
      res.status(500).json({ error: "Erro no agendamento" });
    }
  });

  // 🔹 4) Listar barbearias (para frontend preencher select)
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

    // 🔹 4) Cadastro de Barbearia
  app.post("/api/barbearias", async (req, res) => {
    const { nome, proprietario, email, telefone, endereco, intervalo, fuso_horario } = req.body;

    try {
      const { data, error } = await supabase
        .from("barbearias")
        .insert([{ nome, proprietario, email, telefone, endereco, intervalo, fuso_horario }])
        .select()
        .single();

      if (error) throw error;

      res.json({ success: true, barbearia: data });
    } catch (err) {
      console.error("Erro ao cadastrar barbearia:", err);
      res.status(500).json({ success: false, error: "Erro ao cadastrar barbearia" });
    }
  });

}
