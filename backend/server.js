// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';
import { setupRoutes } from "./routes.js";

// Configura o dotenv para encontrar o arquivo .env na pasta raiz do projeto,
// não importa de onde o script seja executado.
const __filename = fileURLToPath(import.meta.url);
dotenv.config({ path: path.resolve(path.dirname(__filename), '..', '.env') });

console.log('Backend: SUPABASE_URL carregado?', !!process.env.SUPABASE_URL);
console.log('Backend: SUPABASE_SERVICE_ROLE_KEY carregado?', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

const app = express();
app.use(cors());
app.use(express.json());

// serve your frontend static files if needed (adjust path as your project)
app.use(express.static(path.join(path.dirname(__filename), "..", "public")));

// mount API
setupRoutes(app);

// a small health route
app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
