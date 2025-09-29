// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { setupRoutes } from "./routes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// serve your frontend static files if needed (adjust path as your project)
app.use(express.static(path.join(path.dirname(new URL(import.meta.url).pathname), "..", "public")));

// mount API
setupRoutes(app);

// a small health route
app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
