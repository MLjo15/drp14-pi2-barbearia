-- WARNING: This schema is for context only and is not meant to be run.
/**
 * @file backend/SupabaseDB.sql
 * @description Definição do esquema do banco de dados para a aplicação de agendamento de barbearias.
 * Este arquivo contém as instruções SQL para criar as tabelas e suas respectivas colunas,
 * tipos de dados, valores padrão e restrições (chaves primárias e estrangeiras).
 *
 * NOTA: Este esquema é fornecido para contexto e documentação. A ordem das tabelas
 * e as restrições podem precisar de ajustes para execução direta em um ambiente de produção,
 * especialmente em relação à criação de chaves estrangeiras antes das tabelas referenciadas.
 */

-- ----------------------------------------------------------------------------------------------------
-- Tabela: public.appointments
-- Armazena os agendamentos de clientes em barbearias específicas.
-- ----------------------------------------------------------------------------------------------------
CREATE TABLE public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid(), -- Chave primária única para cada agendamento.
  shop_id uuid,                               -- ID da barbearia associada ao agendamento.
  cliente_id uuid,                            -- ID do cliente que fez o agendamento.
  servico text NOT NULL,                      -- Descrição do serviço agendado (ex: "Corte de Cabelo", "Barba").
  data_hora_inicio timestamp with time zone NOT NULL, -- Data e hora de início do agendamento, com fuso horário.
  data_hora_fim timestamp with time zone NOT NULL,    -- Data e hora de término do agendamento, com fuso horário.
  created_at timestamp with time zone DEFAULT now(),  -- Timestamp de quando o agendamento foi criado.
  CONSTRAINT appointments_pkey PRIMARY KEY (id),      -- Define 'id' como chave primária.
  CONSTRAINT appointments_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.barbearias(id), -- Chave estrangeira para a tabela 'barbearias'.
  CONSTRAINT appointments_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) -- Chave estrangeira para a tabela 'clientes'.
);

-- ----------------------------------------------------------------------------------------------------
-- Tabela: public.barbearia_horarios
-- Define os horários de funcionamento de cada barbearia por dia da semana.
-- ----------------------------------------------------------------------------------------------------
CREATE TABLE public.barbearia_horarios (
  id uuid NOT NULL DEFAULT gen_random_uuid(), -- Chave primária única para cada registro de horário.
  shop_id uuid,                               -- ID da barbearia a qual este horário pertence.
  dia_semana integer NOT NULL,                -- Dia da semana (0=Domingo, 1=Segunda, ..., 6=Sábado).
  hora_abertura time without time zone NOT NULL, -- Hora de abertura para o dia da semana.
  hora_fechamento time without time zone NOT NULL, -- Hora de fechamento para o dia da semana.
  intervalo_minutos integer NOT NULL DEFAULT 30, -- Duração padrão de um slot de agendamento em minutos.
  CONSTRAINT barbearia_horarios_pkey PRIMARY KEY (id), -- Define 'id' como chave primária.
  CONSTRAINT barbearia_horarios_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.barbearias(id) -- Chave estrangeira para a tabela 'barbearias'.
);

-- ----------------------------------------------------------------------------------------------------
-- Tabela: public.barbearias
-- Armazena informações detalhadas sobre cada barbearia cadastrada.
-- ----------------------------------------------------------------------------------------------------
CREATE TABLE public.barbearias (
  id uuid NOT NULL DEFAULT gen_random_uuid(), -- Chave primária única para cada barbearia.
  nome text NOT NULL,                         -- Nome da barbearia.
  proprietario text NOT NULL,                 -- Nome do proprietário da barbearia.
  email text NOT NULL UNIQUE,                 -- Endereço de e-mail da barbearia (deve ser único).
  telefone text,                              -- Número de telefone da barbearia.
  endereco text,                              -- Endereço físico da barbearia.
  intervalo integer NOT NULL DEFAULT 30,      -- Intervalo padrão de agendamento em minutos (ex: 30, 60).
  created_at timestamp with time zone DEFAULT now(), -- Timestamp de quando a barbearia foi cadastrada.
  fuso_horario text DEFAULT 'America/Sao_Paulo'::text, -- Fuso horário da barbearia para cálculos de agendamento.
  CONSTRAINT barbearias_pkey PRIMARY KEY (id) -- Define 'id' como chave primária.
);

-- ----------------------------------------------------------------------------------------------------
-- Tabela: public.clientes
-- Armazena informações sobre os clientes que realizam agendamentos.
-- ----------------------------------------------------------------------------------------------------
CREATE TABLE public.clientes (
  id uuid NOT NULL DEFAULT gen_random_uuid(), -- Chave primária única para cada cliente.
  nome text NOT NULL,                         -- Nome completo do cliente.
  email text NOT NULL UNIQUE,                 -- Endereço de e-mail do cliente (deve ser único).
  telefone text,                              -- Número de telefone do cliente.
  created_at timestamp with time zone DEFAULT now(), -- Timestamp de quando o cliente foi cadastrado.
  CONSTRAINT clientes_pkey PRIMARY KEY (id)   -- Define 'id' como chave primária.
);

-- ----------------------------------------------------------------------------------------------------
-- Tabela: public.manutencao_log
-- Registra eventos de manutenção ou rotinas "anti-sleep" do sistema.
-- ----------------------------------------------------------------------------------------------------
CREATE TABLE public.manutencao_log (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL, -- Chave primária auto-incrementável.
  tarefa text NOT NULL,                            -- Descrição da tarefa de manutenção (ex: "ping", "supabase_check").
  status text,                                     -- Status da execução da tarefa (ex: "sucesso", "falha").
  data_execucao timestamp with time zone DEFAULT timezone('utc'::text, now()), -- Data e hora da execução da tarefa.
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),    -- Timestamp de criação do registro.
  CONSTRAINT manutencao_log_pkey PRIMARY KEY (id)  -- Define 'id' como chave primária.
);

-- ----------------------------------------------------------------------------------------------------
-- Tabela: public.shop_google_tokens
-- Armazena os tokens de autenticação do Google Calendar para cada barbearia.
-- Permite que a aplicação interaja com o Google Calendar em nome da barbearia.
-- ----------------------------------------------------------------------------------------------------
CREATE TABLE public.shop_google_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(), -- Chave primária única para cada conjunto de tokens.
  shop_id uuid UNIQUE,                        -- ID da barbearia associada aos tokens (deve ser único).
  access_token text NOT NULL,                 -- Token de acesso do Google (curta duração).
  refresh_token text NOT NULL,                -- Token de atualização do Google (longa duração, usado para obter novos access_tokens).
  scope text,                                 -- Escopos de permissão concedidos (ex: "https://www.googleapis.com/auth/calendar.events").
  token_type text,                            -- Tipo do token (ex: "Bearer").
  expiry_date bigint,                         -- Data de expiração do access_token (timestamp Unix).
  created_at timestamp with time zone DEFAULT now(), -- Timestamp de quando os tokens foram criados.
  updated_at timestamp with time zone DEFAULT now(), -- Timestamp da última atualização dos tokens.
  CONSTRAINT shop_google_tokens_pkey PRIMARY KEY (id), -- Define 'id' como chave primária.
  CONSTRAINT shop_google_tokens_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.barbearias(id) -- Chave estrangeira para a tabela 'barbearias'.
);