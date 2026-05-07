# Support Board — Painel de Tarefas do Suporte | Tríade Fibra

Painel de gerenciamento de tarefas em tempo real projetado para operações de suporte em ISP. Exibe tarefas ativas numa TV (1920×1080) para que a equipe de suporte acompanhe prioridades, prazos e cronômetros de relance — sem necessidade de interação. O supervisor gerencia tudo a partir de um painel administrativo separado.

Desenvolvido para a **Tríade Fibra**, provedora de internet FTTH/GPON na região do Vale do Aço, MG — Brasil.

---

## Como Funciona

O sistema possui três interfaces:

| Interface | URL | Finalidade |
|-----------|-----|------------|
| **Display da TV** | `/display` | Painel somente leitura exibido na TV. Atualiza automaticamente a cada 10 segundos. |
| **Painel Admin** | `/admin` | Supervisor cria, edita e gerencia tarefas. Layout de lista + painel lateral. |
| **Login** | `/login` | Acesso protegido por senha — protege o display e o admin. |

As tarefas fluem do painel admin para o display da TV automaticamente. Sem refresh manual, sem interação no lado da TV.

### Propriedades da Tarefa

- **Título** (máx. 120 caracteres) — o que precisa ser feito
- **Descrição** (máx. 300 caracteres, opcional) — contexto adicional
- **Prioridade** — `critical`, `high`, `normal` ou `low` (codificadas por cor no display)
- **Status** — `pending` → `in_progress` → `done`
- **Prazo** (opcional) — contagem regressiva exibida na TV
- **Cronômetro** (opcional) — contagem regressiva independente com duração configurável em minutos

Tarefas marcadas como `done` desaparecem do display da TV após 30 minutos. O display exibe no máximo 12 tarefas por vez, ordenadas por prioridade e urgência do prazo.

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Backend | Python — FastAPI |
| Banco de Dados | PostgreSQL (asyncpg, pool de conexões) |
| Frontend | HTML/CSS/JS puro (sem framework) |
| Autenticação | Cookie baseado em senha (hash SHA-256, expiração de 30 dias) |
| Hospedagem | Render (Web Service) |

---

## Estrutura do Projeto

```
├── main.py                 # App FastAPI — serve páginas, gerencia auth
├── api/
│   └── index.py            # Rotas da API (CRUD /api/tasks)
├── database.py             # Pool PostgreSQL + queries (asyncpg)
├── public/
│   ├── display.html        # Página do display da TV
│   ├── admin.html          # Página do painel admin
│   ├── login.html          # Página de login
│   └── static/
│       ├── display.css
│       ├── display.js
│       ├── admin.css
│       ├── admin.js
│       └── assets/
│           └── logo-triade-vermelho.png
├── render.yaml             # Configuração de deploy no Render
├── requirements.txt
└── .gitignore
```

---

## Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/auth` | Autenticar com senha, receber cookie de sessão |
| `GET` | `/api/tasks` | Listar todas as tarefas (ordenadas por prioridade + prazo) |
| `POST` | `/api/tasks` | Criar nova tarefa |
| `PUT` | `/api/tasks/{id}` | Atualizar tarefa existente |
| `DELETE` | `/api/tasks/{id}` | Deletar tarefa |

---

## Instalação

### Pré-requisitos

- Python 3.10+
- Banco de dados PostgreSQL (local ou hospedado — Render Postgres, Supabase, Neon, etc.)

### 1. Clonar o repositório

```bash
git clone https://github.com/cleberlucasdev/Support-Board.git
cd Support-Board
```

### 2. Instalar dependências

```bash
pip install -r requirements.txt
```

### 3. Configurar variáveis de ambiente

```bash
export DATABASE_URL="postgresql://user:password@host:5432/dbname"
export ACCESS_PASSWORD="sua-senha-admin"
```

A tabela `tasks` é criada automaticamente na primeira execução via `CREATE TABLE IF NOT EXISTS`.

### 4. Executar

```bash
python main.py
```

Ou diretamente com uvicorn:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 5. Acessar

- **Painel admin:** `http://localhost:8000/admin`
- **Display da TV:** `http://localhost:8000/display`
- Ambos exigem a senha definida em `ACCESS_PASSWORD`.

---

## Deploy no Render

O projeto inclui um `render.yaml` para deploy direto:

1. Faça push para o GitHub
2. Conecte o repositório no [Render](https://render.com)
3. Crie um banco PostgreSQL no Render
4. Defina `DATABASE_URL` (do Postgres do Render) e `ACCESS_PASSWORD` como variáveis de ambiente
5. Faça deploy como **Web Service** — o Render lê o `render.yaml` automaticamente

---

## Comportamento do Display

- **Auto-refresh:** busca `/api/tasks` a cada 10 segundos sem recarregar a página
- **Cores por prioridade:** critical (vermelho), high (âmbar), normal (azul), low (cinza)
- **Contagem regressiva do prazo:** mostra tempo restante ou "ATRASADO" com vermelho pulsante
- **Cronômetro:** contagem regressiva opcional por tarefa com barra de progresso visual
- **Tarefas concluídas:** semi-transparentes, removidas automaticamente após 30 minutos
- **Máximo de 12 tarefas visíveis** — ordenadas por urgência

---

## Licença

Ferramenta interna — Tríade Fibra.

---
---

# 🇬🇧 English

# Support Board — Support Task Panel | Tríade Fibra

Real-time task management board designed for ISP support operations. Displays active tasks on a TV screen (1920×1080) so the support team can track priorities, deadlines, and timers at a glance — no interaction required. The supervisor manages everything from a separate admin panel.

Built for **Tríade Fibra**, an FTTH/GPON internet service provider in Vale do Aço, MG — Brazil.

---

## How It Works

The system has three interfaces:

| Interface | URL | Purpose |
|-----------|-----|---------|
| **TV Display** | `/display` | Read-only board shown on a TV. Auto-refreshes every 10 seconds. |
| **Admin Panel** | `/admin` | Supervisor creates, edits, and manages tasks. List + side panel layout. |
| **Login** | `/login` | Password gate — protects both display and admin. |

Tasks flow from the admin panel to the TV display automatically. No manual refresh, no interaction on the TV side.

### Task Properties

- **Title** (max 120 chars) — what needs to be done
- **Description** (max 300 chars, optional) — additional context
- **Priority** — `critical`, `high`, `normal`, or `low` (color-coded on display)
- **Status** — `pending` → `in_progress` → `done`
- **Deadline** (optional) — countdown displayed on TV
- **Timer** (optional) — independent countdown with configurable duration in minutes

Tasks marked as `done` auto-hide from the TV display after 30 minutes. The display shows a maximum of 12 tasks at a time, ordered by priority and deadline urgency.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python — FastAPI |
| Database | PostgreSQL (asyncpg, connection pool) |
| Frontend | Vanilla HTML/CSS/JS (no framework) |
| Auth | Password-based cookie (SHA-256 hash, 30-day expiry) |
| Hosting | Render (Web Service) |

---

## Project Structure

```
├── main.py                 # FastAPI app — serves pages, handles auth
├── api/
│   └── index.py            # API routes (CRUD /api/tasks)
├── database.py             # PostgreSQL pool + queries (asyncpg)
├── public/
│   ├── display.html        # TV display page
│   ├── admin.html          # Admin panel page
│   ├── login.html          # Login page
│   └── static/
│       ├── display.css
│       ├── display.js
│       ├── admin.css
│       ├── admin.js
│       └── assets/
│           └── logo-triade-vermelho.png
├── render.yaml             # Render deployment config
├── requirements.txt
└── .gitignore
```

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/auth` | Authenticate with password, receive session cookie |
| `GET` | `/api/tasks` | List all tasks (ordered by priority + deadline) |
| `POST` | `/api/tasks` | Create a new task |
| `PUT` | `/api/tasks/{id}` | Update an existing task |
| `DELETE` | `/api/tasks/{id}` | Delete a task |

---

## Setup

### Prerequisites

- Python 3.10+
- PostgreSQL database (local or hosted — Render Postgres, Supabase, Neon, etc.)

### 1. Clone the repository

```bash
git clone https://github.com/cleberlucasdev/Support-Board.git
cd Support-Board
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Set environment variables

```bash
export DATABASE_URL="postgresql://user:password@host:5432/dbname"
export ACCESS_PASSWORD="your-admin-password"
```

The `tasks` table is created automatically on first run via `CREATE TABLE IF NOT EXISTS`.

### 4. Run

```bash
python main.py
```

Or with uvicorn directly:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 5. Access

- **Admin panel:** `http://localhost:8000/admin`
- **TV display:** `http://localhost:8000/display`
- Both require the password defined in `ACCESS_PASSWORD`.

---

## Deploy on Render

The project includes a `render.yaml` for one-click deployment:

1. Push to GitHub
2. Connect the repo on [Render](https://render.com)
3. Create a PostgreSQL database on Render
4. Set `DATABASE_URL` (from Render Postgres) and `ACCESS_PASSWORD` as environment variables
5. Deploy as **Web Service** — Render reads `render.yaml` automatically

---

## Display Behavior

- **Auto-refresh:** fetches `/api/tasks` every 10 seconds without page reload
- **Priority colors:** critical (red), high (amber), normal (blue), low (gray)
- **Deadline countdown:** shows remaining time or "OVERDUE" with pulsing red
- **Timer:** optional per-task countdown with visual progress bar
- **Done tasks:** semi-transparent, auto-removed after 30 minutes
- **Max 12 tasks visible** — sorted by urgency

---

## License

Internal tool — Tríade Fibra.
