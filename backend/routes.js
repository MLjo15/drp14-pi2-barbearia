import { google } from "googleapis";
import { Router } from 'express';
import { supabase } from "./supabaseClient.js";

const router = Router();

// Loga a variável de ambiente GOOGLE_REDIRECT_URI no console do Render (para debug)
console.log('DEBUG: GOOGLE_REDIRECT_URI sendo usado:', process.env.GOOGLE_REDIRECT_URI);

// Cria um cliente OAuth2 fora das rotas para ser reutilizado
// Ele depende das variáveis de ambiente GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e GOOGLE_REDIRECT_URI
// ESTE É O ENDEREÇO QUE PRECISA BATER EXATAMENTE COM O CONFIGURADO NO GOOGLE CLOUD CONSOLE
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Middleware para log simples de requisições /api
router.use((req, res, next) => {
  try {
    console.log(`[API] ${req.method} ${req.originalUrl}`);
    if (req.method === 'POST' && req.body) {
      // Limita o log do corpo da requisição para evitar logs muito longos
      console.log('[API] body:', JSON.stringify(req.body).slice(0, 1000));
    }
  } catch (err) {
    // Ignora erros de log
  }
  next();
});

// 🔹 ROTA DE AUTENTICAÇÃO GOOGLE 1/2: Início da autenticação (redireciona para consentimento)
router.get("/auth/google", (req, res) => {
  const { shop_id } = req.query;
  if (!shop_id) return res.status(400).send("Faltando shop_id");

  // Gera o URL de autorização do Google Calendar
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    // Escopo necessário para criar eventos no calendário
    scope: ["https://www.googleapis.com/auth/calendar.events"],
    prompt: "consent", // Força o consentimento para garantir o refresh_token
    state: shop_id // Armazena o shop_id para recuperar no callback
  });

  res.redirect(url);
});

// 🔹 ROTA DE AUTENTICAÇÃO GOOGLE 2/2: Callback (salva tokens no Supabase)
router.get("/auth/google/callback", async (req, res) => {
  const { code, state } = req.query;
  const shop_id = state;

  if (!code || !shop_id) {
    return res.status(400).send("Código ou ShopID ausente.");
  }

  try {
    // Troca o código de autorização por tokens de acesso e refresh
    // Esta chamada usa o GOOGLE_REDIRECT_URI configurado no objeto oauth2Client
    const { tokens } = await oauth2Client.getToken(code);

    // Insere ou atualiza (UPSERT) na tabela shop_google_tokens
    const { error } = await supabase
      .from("shop_google_tokens")
      .upsert({
        shop_id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token, // O refresh token é vital para renovar o acesso
        scope: tokens.scope,
        token_type: tokens.token_type,
        expiry_date: tokens.expiry_date,
        updated_at: new Date()
      }, { onConflict: 'shop_id' }); // Garante que atualiza se o shop_id já existir

    if (error) throw error;

    // Redireciona para o frontend com uma mensagem de sucesso (ou apenas envia uma mensagem)
    res.send("✅ Conta Google conectada com sucesso! Você pode fechar esta janela.");

  } catch (err) {
    console.error("Erro no callback Google:", err);
    res.status(500).send("Erro ao conectar conta Google. Verifique os logs do servidor.");
  }
});

// Rota 3: Criar agendamento (mantendo a lógica que você havia me mostrado para a funcionalidade)
router.post("/agendamento", async (req, res) => {
  const { shop_id, cliente_nome, cliente_email, cliente_telefone, servico, data_hora_inicio, data_hora_fim } = req.body;
  console.log('[agendamento] recebendo:', { shop_id, cliente_email, data_hora_inicio, data_hora_fim });

  try {
    // 1. Verifica/Cria cliente
    let { data: cliente } = await supabase
      .from("clientes")
      .select("id")
      .eq("email", cliente_email)
      .single();

    if (!cliente) {
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

    if (error) {
      console.error('[agendamento] erro insert:', error);
      throw error;
    }

    console.log('[agendamento] criado id:', agendamento?.id);

    // 3. Busca e renova tokens do Google
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

        // Atualiza access token no banco
        await supabase
          .from('shop_google_tokens')
          .upsert({ shop_id, access_token: newAccessToken, updated_at: new Date() }, { onConflict: 'shop_id' });

        const calendar = google.calendar({ version: 'v3', auth: oauthClient });

        // 4. Cria evento no Calendar
        await calendar.events.insert({
          calendarId: 'primary',
          requestBody: {
            summary: `Agendamento - ${cliente_nome}`,
            description: `Serviço: ${servico}\nCliente: ${cliente_nome}\nEmail: ${cliente_email}\nTelefone: ${cliente_telefone}`,
            start: { dateTime: data_hora_inicio, timeZone: 'America/Sao_Paulo' },
            end: { dateTime: data_hora_fim, timeZone: 'America/Sao_Paulo' },
            // Adiciona o cliente como participante (opcional)
            attendees: [{ email: cliente_email }], 
          }
        });
        console.log('[agendamento] Evento Google Calendar criado com sucesso.');

      } catch (err) {
        console.error('Erro ao renovar access_token ou criar evento no Calendar:', err);
        // Continua sem falhar o agendamento no Supabase
      }
    }

    res.json({ success: true, agendamento });

  } catch (err) {
    console.error("Erro ao criar agendamento:", err);
    const errMsg = err?.message || err?.error || 'Erro no agendamento';
    res.status(500).json({ error: errMsg });
  }
});


// Rota 4: Listar barbearias (para frontend preencher select)
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

// Rota 4b: Obter dados de uma barbearia e seus horários
router.get('/barbearias/:id', async (req, res) => {
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

// Rota 4c: Disponibilidade: retorna slots disponíveis para uma barbearia em uma data (YYYY-MM-DD)
router.get('/barbearias/:id/availability', async (req, res) => {
  const { id } = req.params;
  const { date } = req.query; // esperado YYYY-MM-DD

  if (!date) return res.status(400).json({ success: false, error: 'Parâmetro date é obrigatório (YYYY-MM-DD)' });

  try {
    // fetch barbearia and horarios
    const { data: barbearia } = await supabase.from('barbearias').select('id, intervalo, fuso_horario').eq('id', id).single();
    const { data: horarios } = await supabase.from('barbearia_horarios').select('dia_semana, hora_abertura, hora_fechamento, intervalo_minutos').eq('shop_id', id);

    // determine weekday (0 Sunday .. 6 Saturday) from date
    const day = new Date(date + 'T00:00:00').getDay();

    // find horarios for that weekday
    const todays = (horarios || []).filter(h => Number(h.dia_semana) === Number(day));

    // if none, fallback to single block 09:00-17:00 with barbearia.intervalo
    const periods = todays.length ? todays : [{ hora_abertura: '09:00:00', hora_fechamento: '17:00:00', intervalo_minutos: barbearia?.intervalo || 30 }];

    // fetch existing appointments for that date
    // Use local datetime range (no trailing Z) to match server timezone handling
    const dayStart = `${date}T00:00:00`;
    const dayEnd = `${date}T23:59:59`;
    const { data: appointments } = await supabase.from('appointments').select('data_hora_inicio, data_hora_fim').eq('shop_id', id).gte('data_hora_inicio', dayStart).lte('data_hora_inicio', dayEnd);
    console.log(`/api/barbearias/${id}/availability for ${date} - found appointments:`, (appointments || []).length);

    // helper to parse time 'HH:MM:SS' and produce Date for the given date
    const makeDateTime = (d, timeStr) => new Date(`${d}T${timeStr}`);

    const slots = [];

    for (const p of periods) {
      const intervalo = p.intervalo_minutos || barbearia?.intervalo || 30;
      let current = makeDateTime(date, p.hora_abertura);
      const end = makeDateTime(date, p.hora_fechamento);

      while (current.getTime() + intervalo * 60000 <= end.getTime()) {
        const slotStart = new Date(current);
        const slotEnd = new Date(current.getTime() + intervalo * 60000);

        // check overlap with any appointment
        const overlap = (appointments || []).some(ap => {
          try {
            const apStart = new Date(ap.data_hora_inicio);
            const apEnd = new Date(ap.data_hora_fim);
            return apStart < slotEnd && apEnd > slotStart;
          } catch (e) {
            return false;
          }
        });

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

// Rota 4d: Cadastro de Barbearia (POST)
router.post("/barbearias", async (req, res) => {
  const { nome, proprietario, email, telefone, endereco, intervalo, fuso_horario } = req.body;

  try {
    const { data, error } = await supabase
      .from("barbearias")
      .insert([{ nome, proprietario, email, telefone, endereco, intervalo, fuso_horario }])
      .select()
      .single();

    if (error) {
      console.error('Erro insert barbearia:', error);
      throw error;
    }

    console.log('Barbearia cadastrada:', { id: data?.id, nome: data?.nome });

    // Se houver horários, insere-os
    const horariosPayload = req.body.horarios;
    let createdHorarios = [];
    if (Array.isArray(horariosPayload) && horariosPayload.length) {
      const invalid = horariosPayload.find(h => h.dia_semana == null || !h.hora_abertura || !h.hora_fechamento);
      if (invalid) {
        console.error('Payload horarios inválido', invalid);
        return res.status(400).json({ success: false, error: 'Horarios inválidos. Cada item precisa ter dia_semana, hora_abertura e hora_fechamento.' });
      }
      try {
        const toInsert = horariosPayload.map(h => ({
          shop_id: data.id,
          dia_semana: h.dia_semana,
          hora_abertura: h.hora_abertura,
          hora_fechamento: h.hora_fechamento,
          intervalo_minutos: h.intervalo_minutos ?? h.intervalo_minutos
        }));
        const { data: inserted, error: insertHorError } = await supabase
          .from('barbearia_horarios')
          .insert(toInsert)
          .select();
        if (insertHorError) {
          console.error('Erro insert horarios:', insertHorError);
        } else {
          createdHorarios = inserted;
          console.log('Horarios criados:', createdHorarios.length);
        }
      } catch (hErr) {
        console.error('Erro ao inserir horarios:', hErr);
      }
    }

    res.json({ success: true, barbearia: data, horarios: createdHorarios });
  } catch (err) {
    console.error("Erro ao cadastrar barbearia:", err);
    const errMsg = err?.message || err?.error || 'Erro ao cadastrar barbearia';
    res.status(500).json({ success: false, error: errMsg });
  }
});


// Exporta a função que aplica todas as rotas ao app
export function setupRoutes(app) {
  // Todas as rotas acima definidas no 'router' serão prefixadas com /api
  app.use('/api', router);
}
