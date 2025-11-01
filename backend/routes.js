import { google } from "googleapis";
import { Router } from "express";
import { supabase } from "./supabaseClient.js";

const router = Router();

// Loga a variável de ambiente GOOGLE_REDIRECT_URI no console do Render (para debug)
console.log("DEBUG: GOOGLE_REDIRECT_URI sendo usado:", process.env.GOOGLE_REDIRECT_URI);

// Cria o cliente OAuth2 (usando variáveis de ambiente)
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Middleware simples de log
router.use((req, res, next) => {
  try {
    console.log(`[API] ${req.method} ${req.originalUrl}`);
    if (req.method === "POST" && req.body) {
      console.log("[API] body:", JSON.stringify(req.body).slice(0, 1000));
    }
  } catch (err) {}
  next();
});

// 🔹 ROTA 1/2 - Inicia o fluxo de autenticação Google
router.get("/auth/google", (req, res) => {
  const { shop_id } = req.query;
  if (!shop_id) return res.status(400).send("Faltando shop_id");

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar.events"],
    prompt: "consent",
    state: shop_id,
  });

  res.redirect(url);
});

// ✅ ROTA 2/2 - Callback do Google OAuth
router.get("/auth/google/callback", async (req, res) => {
  const { code, state } = req.query;
  const shop_id = state;
  const FRONTEND_URL = (process.env.FRONTEND_URL ||
    process.env.VITE_FRONTEND_URL ||
    "https://drp14-pi2-barbearia.vercel.app").replace(/\/$/, "");

  if (!code || !shop_id) {
    console.error("Erro no callback Google: Código ou ShopID ausente.");
    return res.send(`
      <script>
        window.opener.postMessage({ type: 'google-auth', success: false, error: 'Código ou ShopID ausente' }, '${FRONTEND_URL}');
        window.close();
      </script>
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
          updated_at: new Date(),
        },
        { onConflict: "shop_id" }
      );

    if (error) throw error;

    return res.send(`
      <script>
        window.opener.postMessage({ type: 'google-auth', success: true }, '${FRONTEND_URL}');
        window.close();
      </script>
    `);
  } catch (err) {
    console.error("Erro no callback Google:", err);
    return res.send(`
      <script>
        window.opener.postMessage({ type: 'google-auth', success: false, error: '${String(err.message).replace(/'/g, "\\'")}' }, '${FRONTEND_URL}');
        window.close();
      </script>
    `);
  }
});

// 🔹 Outras rotas (agendamento, barbearias) permanecem iguais...

export function setupRoutes(app) {
  app.use("/api", router);
}
``