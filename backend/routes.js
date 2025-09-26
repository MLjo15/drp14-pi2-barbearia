// routes.js
import { google } from 'googleapis';
import { supabase } from './supabaseClient.js';

export function setupRoutes(app) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  app.get("/auth/google/callback", async (req, res) => { /* ... */ });
  app.post("/agendamento", async (req, res) => { /* ... */ });
}
