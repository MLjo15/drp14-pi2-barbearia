import express from 'express';
import bodyParser from 'body-parser';
import { google } from 'googleapis';
import { supabase } from './supabaseClient.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(bodyParser.json());

// Configurar OAuth2Client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// -------------------
// CALLBACK GOOGLE OAUTH
// -------------------
app.get("/auth/google/callback", async (req, res) => {
  const code = req.query.code;
  const barbeariaId = req.query.state;

  try {
    const { tokens } = await oauth2Client.getToken(code);

    // Atualizar tokens no Supabase
    const { data, error } = await supabase
      .from("barbearias")
      .update({
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token || undefined,
        google_token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        gcal_auth_status: "conectado"
      })
      .eq("id", barbeariaId)
      .select();

    if (error) throw error;

    res.json({ success: true, barbearia: data });
  } catch (err) {
    console.error("Erro no callback:", err);
    res.status(500).json({ error: "Erro ao autenticar com Google" });
  }
});

// -------------------
// AGENDAMENTO
// -------------------
app.post("/agendamento", async (req, res) => {
  const { barbearia_id, cliente_nome, cliente_email, cliente_telefone, servico, data_hora_inicio, data_hora_fim } = req.body;

  try {
    // 1️⃣ Buscar tokens da barbearia
    const { data: barbearia, error: barbeariaError } = await supabase
      .from("barbearias")
      .select("google_access_token, google_refresh_token")
      .eq("id", barbearia_id)
      .single();

    if (barbeariaError || !barbearia) {
      return res.status(404).json({ error: "Barbearia não encontrada ou não conectada ao Google." });
    }

    oauth2Client.setCredentials({
      access_token: barbearia.google_access_token,
      refresh_token: barbearia.google_refresh_token,
    });

    oauth2Client.on('tokens', async (tokens) => {
      if (tokens.access_token) {
        await supabase
          .from("barbearias")
          .update({
            google_access_token: tokens.access_token,
            google_refresh_token: tokens.refresh_token || barbearia.google_refresh_token,
            google_token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null
          })
          .eq("id", barbearia_id);
      }
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // 2️⃣ Verificar conflitos
    const { data: conflitos } = await supabase
      .from("agendamentos")
      .select("*")
      .eq("barbearia_id", barbearia_id)
      .or(`and(data_hora_inicio.gte.${data_hora_inicio},data_hora_inicio.lt.${data_hora_fim}),and(data_hora_fim.gt.${data_hora_inicio},data_hora_fim.lte.${data_hora_fim})`);

    if (conflitos.length > 0) {
      return res.status(409).json({ error: "Horário já agendado. Escolha outro horário." });
    }

    // 3️⃣ Criar evento no Google Calendar
    const event = {
      summary: servico || "Agendamento de Cliente",
      description: `Cliente: ${cliente_nome} (${cliente_email}, ${cliente_telefone})`,
      start: { dateTime: data_hora_inicio },
      end: { dateTime: data_hora_fim },
      attendees: [{ email: cliente_email }],
    };

    const gcalEvent = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });

    // 4️⃣ Salvar no Supabase
    const { data: agendamento, error: agendamentoError } = await supabase
      .from("agendamentos")
      .insert([{
        barbearia_id,
        cliente_nome,
        cliente_email,
        cliente_telefone,
        servico,
        data_hora_inicio,
        data_hora_fim,
        google_event_id: gcalEvent.data.id
      }])
      .select();

    if (agendamentoError) throw agendamentoError;

    res.json({ success: true, agendamento });

  } catch (err) {
    console.error("Erro no agendamento:", err);
    res.status(500).json({ error: "Erro ao criar agendamento." });
  }
});

app.listen(5000, () => {
  console.log("Servidor rodando na porta 5000");
});
