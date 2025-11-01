import { google } from "googleapis";
import { Router } from "express";
import { supabase } from "./supabaseClient.js";

const router = Router();

// Loga a variável de ambiente GOOGLE_REDIRECT_URI no console do Render (para debug)
console.log("DEBUG: GOOGLE_REDIRECT_URI sendo usado:", process.env.GOOGLE_REDIRECT_URI);

// Cria um cliente OAuth2 fora das rotas para ser reutilizado
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Middleware para log simples de requisições /api
router.use((req, res, next) => {
  try {
    console.log(`[API] ${req.method} ${req.originalUrl}`);
    if (req.method === "POST" && req.body) {
      console.log("[API] body:", JSON.stringify(req.body).slice(0, 1000));
    }
  } catch (err) {}
  next();
});

// 🔹 ROTA DE AUTENTICAÇÃO GOOGLE 1/2: Redireciona para o Google
router.get("/auth/google", (req, res) => {
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

// 🔹 ROTA DE AUTENTICAÇÃO GOOGLE 2/2: Callback (fecha popup e envia resultado)
router.get("/auth/google/callback", async (req, res) => {
  const { code, state } = req.query;
  const shop_id = state;
  const expectedUri = process.env.GOOGLE_REDIRECT_URI;
  const FRONTEND_URL =
    process.env.VITE_FRONTEND_URL ||
    process.env.FRONTEND_URL ||
    "http://localhost:5173";

  if (!code || !shop_id) {
    console.error("Erro no callback Google: Código ou ShopID ausente.");
    return res.send(`
      <html>
        <head>
          <script>
            if (window.opener) {
              window.opener.postMessage(
                { type: "google-auth", success: false },
                "${FRONTEND_URL}"
              );
              window.close();
            } else {
              window.location.href = "${FRONTEND_URL}?google=error";
            }
          </script>
        </head>
        <body>❌ Erro ao conectar com o Google. Pode fechar esta janela.</body>
      </html>
    `);
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    const { error } = await supabase
      .from("shop_google_tokens")
      .upsert(
        {
          shop_id,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          scope: tokens.scope,
          token_type: tokens.token_type,
          expiry_date: tokens.expiry_date,
          updated_at: new Date()
        },
        { onConflict: "shop_id" }
      );

    if (error) throw error;

    // ✅ Sucesso → fecha o popup e notifica o frontend
    res.send(`
      <html>
        <head>
          <script>
            if (window.opener) {
              window.opener.postMessage(
                { type: "google-auth", success: true },
                "${FRONTEND_URL}"
              );
              window.close();
            } else {
              window.location.href = "${FRONTEND_URL}?google=success";
            }
          </script>
        </head>
        <body>✅ Conta Google conectada com sucesso! Pode fechar esta janela.</body>
      </html>
    `);
  } catch (err) {
    console.error("Erro no callback Google:", err);
    res.send(`
      <html>
        <head>
          <script>
            if (window.opener) {
              window.opener.postMessage(
                { type: "google-auth", success: false, error: "${err.message}" },
                "${FRONTEND_URL}"
              );
              window.close();
            } else {
              window.location.href = "${FRONTEND_URL}?google=error";
            }
          </script>
        </head>
        <body>❌ Falha ao conectar com o Google. Pode fechar esta janela.</body>
      </html>
    `);
  }
});

// 🔹 ROTA DE AGENDAMENTO
router.post("/agendamento", async (req, res) => {
  const {
    shop_id,
    cliente_nome,
    cliente_email,
    cliente_telefone,
    servico,
    data_hora_inicio,
    data_hora_fim
  } = req.body;
  console.log("[agendamento] recebendo:", {
    shop_id,
    cliente_email,
    data_hora_inicio,
    data_hora_fim
  });

  try {
    let { data: cliente } = await supabase
      .from("clientes")
      .select("id")
      .eq("email", cliente_email)
      .single();

    if (!cliente) {
      const { data: novoCliente, error: clienteErro } = await supabase
        .from("clientes")
        .insert([
          { nome: cliente_nome, email: cliente_email, telefone: cliente_telefone }
        ])
        .select()
        .single();
      if (clienteErro) throw clienteErro;
      cliente = novoCliente;
    }

    const { data: agendamento, error } = await supabase
      .from("appointments")
      .insert([
        {
          shop_id,
          cliente_id: cliente.id,
          servico,
          data_hora_inicio,
          data_hora_fim
        }
      ])
      .select()
      .single();

    if (error) throw error;

    console.log("[agendamento] criado id:", agendamento?.id);

    const { data: tokens } = await supabase
      .from("shop_google_tokens")
      .select("access_token, refresh_token")
      .eq("shop_id", shop_id)
      .single();

    if (tokens && tokens.refresh_token) {
      const oauthClient = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      oauthClient.setCredentials({ refresh_token: tokens.refresh_token });

      try {
        const accessResponse = await oauthClient.getAccessToken();
        const newAccessToken = accessResponse?.token || tokens.access_token;

        await supabase
          .from("shop_google_tokens")
          .upsert(
            { shop_id, access_token: newAccessToken, updated_at: new Date() },
            { onConflict: "shop_id" }
          );

        const calendar = google.calendar({ version: "v3", auth: oauthClient });

        await calendar.events.insert({
          calendarId: "primary",
          requestBody: {
            summary: `Agendamento - ${cliente_nome}`,
            description: `Serviço: ${servico}\nCliente: ${cliente_email}\nTelefone: ${cliente_telefone}`,
            start: { dateTime: data_hora_inicio, timeZone: "America/Sao_Paulo" },
            end: { dateTime: data_hora_fim, timeZone: "America/Sao_Paulo" },
            attendees: [{ email: cliente_email }]
          }
        });
        console.log("[agendamento] Evento Google Calendar criado com sucesso.");
      } catch (err) {
        console.error(
          "Erro ao renovar access_token ou criar evento no Calendar:",
          err
        );
      }
    }

    res.json({ success: true, agendamento });
  } catch (err) {
    console.error("Erro ao criar agendamento:", err);
    res.status(500).json({ error: err?.message || "Erro no agendamento" });
  }
});

// (demais rotas de barbearias e disponibilidade continuam iguais)
router.get("/barbearias", async (req, res) => {
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

// Exporta função de setup
export function setupRoutes(app) {
  app.use("/api", router);
}
