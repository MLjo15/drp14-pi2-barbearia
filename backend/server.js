// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { google } from "googleapis";
import { supabase } from "./supabaseClient.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// OAuth2 Client used to generate auth URL for shops and to create calendar events.
const oauth2ClientTemplate = (redirectUri) =>
  new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

// -----------------------------
// OAuth flow for shop (barbearia) to connect Google Calendar
// -----------------------------
// Step 1: redirect shop to Google consent screen
app.get("/auth/google/shop", (req, res) => {
  const { shop_id } = req.query;
  if (!shop_id) return res.status(400).send("shop_id is required");

  const oauth2Client = oauth2ClientTemplate(`${process.env.BASE_URL}/auth/google/callback`);
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar"],
    state: shop_id
  });
  res.redirect(url);
});

// Step 2: callback to capture tokens
app.get("/auth/google/callback", async (req, res) => {
  const { code, state: shop_id } = req.query;
  if (!code || !shop_id) return res.status(400).send("Missing code or shop_id");

  try {
    const oauth2Client = oauth2ClientTemplate(`${process.env.BASE_URL}/auth/google/callback`);
    const { tokens } = await oauth2Client.getToken(code);

    // Save tokens to supabase table shop_google_tokens
    const { error } = await supabase
      .from("shop_google_tokens")
      .upsert({
        shop_id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        scope: tokens.scope ?? null,
        token_type: tokens.token_type ?? null,
        expiry_date: tokens.expiry_date ?? null
      }, { onConflict: "shop_id" });

    if (error) throw error;

    res.send("<h3>Google Calendar conectado com sucesso! Pode fechar essa aba.</h3>");
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.status(500).send("Erro ao conectar Google Calendar");
  }
});

// -----------------------------
// Endpoint: disponibilidade - chama a function gerar_slots_disponiveis
// -----------------------------
app.get("/disponibilidade/:shop_id/:data", async (req, res) => {
  const { shop_id, data } = req.params; // data no formato YYYY-MM-DD
  try {
    // Usa RPC (function) do supabase
    const { data: slots, error } = await supabase
      .rpc("gerar_slots_disponiveis", { p_shop_id: shop_id, p_data: data });

    if (error) throw error;

    // slots é array de timestamptz
    res.json(slots || []);
  } catch (err) {
    console.error("Erro disponibilidade:", err);
    res.status(500).json({ error: err.message || "Erro interno" });
  }
});

// -----------------------------
// Helper: get oauth client for a shop (from stored tokens)
// -----------------------------
async function getOauthClientForShop(shop_id) {
  const { data, error } = await supabase
    .from("shop_google_tokens")
    .select("*")
    .eq("shop_id", shop_id)
    .single();

  if (error || !data) throw new Error("Shop não conectado ao Google.");

  const oauth2Client = oauth2ClientTemplate(`${process.env.BASE_URL}/auth/google/callback`);
  oauth2Client.setCredentials({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    scope: data.scope,
    token_type: data.token_type,
    expiry_date: data.expiry_date,
  });
  return oauth2Client;
}

// -----------------------------
// Endpoint: criar appointment (insere no banco e cria evento no Calendar do shop)
// Body expected:
// {
//   shop_id,
//   cliente_email,
//   cliente_nome,
//   servico,
//   data_hora_inicio,  // ISO string
//   data_hora_fim      // ISO string
// }
// -----------------------------
app.post("/appointments", async (req, res) => {
  const { shop_id, cliente_email, cliente_nome, servico, data_hora_inicio, data_hora_fim } = req.body;
  if (!shop_id || !cliente_email || !servico || !data_hora_inicio) {
    return res.status(400).json({ error: "Dados incompletos" });
  }

  try {
    // 1) Inserir appointment no banco
    const { data: inserted, error: insertError } = await supabase
      .from("appointments")
      .insert([
        {
          shop_id,
          cliente_id: null,
          servico,
          data_hora_inicio,
          data_hora_fim
        }
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    // 2) Criar evento no Google Calendar da barbearia (se estiver conectada)
    try {
      const oauth2Client = await getOauthClientForShop(shop_id);
      const calendar = google.calendar({ version: "v3", auth: oauth2Client });

      const event = {
        summary: `Agendamento - ${servico}`,
        description: `Cliente: ${cliente_nome} (${cliente_email})\nServiço: ${servico}`,
        start: { dateTime: new Date(data_hora_inicio).toISOString() },
        end: { dateTime: new Date(data_hora_fim).toISOString() },
        attendees: [{ email: cliente_email }],
      };

      const created = await calendar.events.insert({
        calendarId: "primary",
        requestBody: event,
        sendUpdates: "all", // envia convites
      });

      // opcional: salvar event id no appointment (requer coluna event_id no schema)
      // await supabase.from("appointments").update({ event_id: created.data.id }).eq("id", inserted.id);
    } catch (calErr) {
      console.warn("Não foi possível criar evento no Google Calendar da barbearia:", calErr.message);
      // Não falha a requisição do appointment por causa disso
    }

    res.json({ ok: true, appointment: inserted });
  } catch (err) {
    console.error("Erro criar appointment:", err);
    res.status(500).json({ error: err.message || "Erro interno" });
  }
});

app.get("/", (req, res) => res.send("API Barbearia OK"));

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
