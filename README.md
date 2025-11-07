
# 💈 DRP14-PI2-BARBEARIA

> **Projeto Integrador II – UNIVESP**
> **Eixo de Computação
> --- Barbearia Corte Certo ---**
> Sistema Web para Cadastramento de Barbearias e Agendamento de Clientes

---

![Node](https://img.shields.io/badge/Node.js-v22.19.0-brightgreen?logo=node.js)
![NPM](https://img.shields.io/badge/npm-v11.6.2-red?logo=npm)
![React](https://img.shields.io/badge/React-v18-blue?logo=react)
![Express](https://img.shields.io/badge/Express.js-Backend-black?logo=express)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)
![Google OAuth](https://img.shields.io/badge/Google-Calendar_API-blue?logo=google)
![Status](https://img.shields.io/badge/Status-Em_Teste-yellow)

---

## 🧭 **Sumário**

- [🎯 Objetivo](#-objetivo)
- [🧩 Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [⚙️ Arquitetura do Sistema](#️-arquitetura-do-sistema)
- [🧠 Fluxo de Autenticação Google OAuth](#-fluxo-de-autenticação-google-oauth)
- [📡 Rotas Principais da API](#-rotas-principais-da-api)
- [🧰 Manutenção e Monitoramento](#-manutenção-e-monitoramento)
- [👨‍💻 Equipe](#-equipe)
- [📜 Licença](#-licença)

---

## 🎯 **Objetivo**

Este projeto tem como finalidade o desenvolvimento de uma aplicação web para **cadastro de barbearias** e **agendamento de clientes**, com integração direta ao **Google Calendar** para sincronização automática dos horários disponíveis e compromissos marcados.

A solução permite:

- Cadastro de barbearias e seus horários de funcionamento;
- Agendamento de serviços pelos clientes;
- Integração via **Google OAuth 2.0** para autenticação e vinculação de calendários para as barbearias cadastradas;
- Visualização dos horários livres com base nas reservas existentes.

---

## 🧩 **Tecnologias Utilizadas**

| Área                                   | Ferramentas                                 |
| --------------------------------------- | ------------------------------------------- |
| **Frontend**                      | React.js · Vite · Mantine UI · Axios     |
| **Backend**                       | Node.js · Express.js                       |
| **Banco de Dados**                | Supabase (PostgreSQL)                       |
| **Autenticação e Integração** | Google Workspace API · Google Calendar API |
| **Hospedagem**                    | Render (Backend) + Vercel (Frontend)        |
| **Monitoramento**                 | UpTimeRobot (anti-sleep e health check)     |

🟢 **Versões recomendadas**

Node.js v22.19.0

npm v11.6.2

## 🧠 **Fluxo de Autenticação Google OAuth**

<pre class="overflow-visible!" data-start="4718" data-end="5008"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-text"><span><span>[Usuário] → clica em "Vincular Google Calendar"
    ↓
[Backend] → /api/auth/google
    ↓
[Google OAuth] → login e permissão
    ↓
[Backend] → /api/auth/google/callback → salva tokens no Supabase
    ↓
[Frontend] → /oauth-callback → redireciona para "/" com popup de sucesso/erro</span></span></code></div></div></pre>

## 📡 **Rotas Principais da API**

| Método  | Rota                                                 | Descrição                              |
| -------- | ---------------------------------------------------- | ---------------------------------------- |
| `GET`  | `/api/barbearias`                                  | Lista todas as barbearias cadastradas    |
| `POST` | `/api/barbearias`                                  | Cadastra uma nova barbearia              |
| `GET`  | `/api/barbearias/:id/availability?date=YYYY-MM-DD` | Retorna horários disponíveis           |
| `POST` | `/api/appointments`                                | Cria um novo agendamento                 |
| `GET`  | `/api/ping`                                        | Health check e anti-sleep do Render      |
| `GET`  | `/api/maintenance`                                 | Executa rotina de anti-sleep do Supabase |

## 🧰 **Manutenção e Monitoramento**

> O sistema utiliza **UpTimeRobot** para manter o backend ativo e o Supabase acordado no plano gratuito da Render.

### 🔍 URLs monitoradas:

| Endpoint             | Função                  | Intervalo         |
| -------------------- | ------------------------- | ----------------- |
| `/api/ping`        | Mantém o backend ativo   | 14 minutos        |
| `/api/maintenance` | Executa manutenção leve | 24 horas / 6 dias |

### 🔧 Configuração recomendada no UpTimeRobot:

* Tipo: **HTTP(s)**
* Método: **HEAD** ou **GET**
* Espera código: **200 OK**

💡 *Com isso, o backend não hiberna e o banco Supabase mantém as conexões vivas.*

## 👨‍💻 **Equipe**

| Nome                                             | RA       | Função                                       |
| ------------------------------------------------ | -------- | ---------------------------------------------- |
| **Ambrósio Helton Lucas de Barros**       | 23219858 | Levantamentos de dados de Campo                |
| **Anderson Santos da Silva**               | 23201231 | Fullstack / Arquitetura da aplicação         |
| **Gabriel Costa de Souza**                 | 23206378 | Testes integrados e documentação            |
| **Magda Moschiel**                         | 23225760 | UI/UX e controle de qualidade                  |
| **Marcilio Antonio Correia de Lima Filho** | 2215854  | Testes integrados e documentação            |
| **Rodrigo Carvalho**                       | 23202360 | Integração com Google APIs e autenticação |
| **Roger Aparecido**                        | 23226376 | Banco de dados / Supabase                      |

## 📜 **Licença**

Este projeto é de uso **acadêmico** e faz parte da disciplina **Projeto Integrador II** do curso de  **Engenharia de Computação – UNIVESP** .

O código pode ser reutilizado para fins educacionais, mediante citação da autoria do grupo original.

📅 **Última atualização:** Novembro/2025

🚀 **Status:** Em fase de testes e integração com Google Calendar

💡 *Projeto hospedado em:*

🌐 **Frontend:** [https://drp14-pi2-barbearia.vercel.app]()

🖥 **Backend:** [https://drp14-pi2-barbearia.onrender.com](https://drp14-pi2-barbearia.onrender.com)
