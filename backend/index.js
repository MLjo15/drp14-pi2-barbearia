// index.js
import express from 'express';
import bodyParser from 'body-parser';
import { setupRoutes } from './routes.js'; // arquivo com /auth/google/callback e /agendamento

const app = express();
app.use(bodyParser.json());

// configura todas as rotas
setupRoutes(app);

app.listen(5000, () => console.log("Servidor rodando na porta 5000"));
