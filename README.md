# TV Corporativa Bitsafe

Sistema de TV corporativa moderno construído com **SvelteKit** + **PocketBase**.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend (TV Display) | SvelteKit + Tailwind CSS |
| Backend + Admin | PocketBase |
| Banco de dados | SQLite (embutido no PocketBase) |
| Clima | OpenWeatherMap API |
| Tempo real | PocketBase Realtime (SSE) |

---

## Estrutura do Projeto

```
tv-corporativa/
├── frontend/          → SvelteKit (tela da TV + painel admin)
└── backend/           → PocketBase (API + Admin + DB)
    ├── pocketbase.exe → Baixar em pocketbase.io/docs
    ├── pb_hooks/      → Hooks JS (TOTP, SMTP, sync calendário)
    └── pb_migrations/ → Migrations do schema
```

---

## Como Rodar Localmente

### 1. Backend (PocketBase)

1. Baixe o PocketBase em: https://pocketbase.io/docs
   Escolha a versão Windows → extraia o `pocketbase.exe` na pasta `backend/`

2. Inicie o backend:
   ```
   backend/start.bat
   ```
   Ou via terminal:
   ```bash
   cd backend
   ./pocketbase.exe serve
   ```

3. Acesse o painel admin: **http://127.0.0.1:8090/_/**
   Na primeira vez, crie seu usuário administrador.

### 2. Frontend (TV Display)

```bash
cd frontend
npm install --include=dev
cp .env.example .env   # edite com sua chave do clima
npm run dev
```

Acesse: **http://localhost:5173**

> **Atenção:** Se a máquina tiver `NODE_ENV=production` definido globalmente, use `dev.bat` ou
> `set NODE_ENV=development && npm run dev`. Para instalar dependências: `npm install --include=dev`

---

## Variáveis de Ambiente (`frontend/.env`)

```env
PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
PUBLIC_WEATHER_API_KEY=sua_chave_aqui
PUBLIC_WEATHER_CITY=São Paulo
PUBLIC_WEATHER_COUNTRY=BR
```

Chave gratuita da OpenWeatherMap: https://openweathermap.org/api

---

## Configuração do Clima

1. Crie conta gratuita em: https://openweathermap.org/api
2. Copie sua API Key
3. Edite o arquivo `frontend/.env`

---

## Como Gerenciar Conteúdo

Acesse o painel admin customizado: **http://localhost:5173/admin**

- **Posts:** criar, editar, ativar/desativar comunicados
- **Boletins:** ticker rotativo na base da tela
- **Campanha:** banner/destaque na tela de TV
- **Calendário:** datas comemorativas e eventos
- **Configurações:** SMTP, logo, modo manutenção, integrações
- **Usuários / Superadmins:** gerenciamento de acesso

---

## Segurança

- **Login de operadores** (`Usuarios`) via e-mail + senha
- **Login de superadmins** via TOTP (autenticação em dois fatores com app autenticador) + reCAPTCHA v3
- **SMTP** configurado via hook (`pb_hooks/smtp_config.pb.js`) — Skymail por padrão
- **Templates de e-mail** editáveis diretamente pelo painel admin
- Regras de acesso nas collections: leitura pública onde necessário, escrita restrita a admins

---

## Deploy em Hospedagem

### Frontend (SvelteKit)
```bash
cd frontend
npm run build
```
O resultado fica em `frontend/.svelte-kit/output/` — deployar em qualquer hospedagem Node.js (Railway, Render, VPS).

### Backend (PocketBase)
Fazer upload do binário `pocketbase` e da pasta `pb_data/` para o servidor.

---

## Funcionalidades

- [x] Relógio em tempo real (HH:MM:SS)
- [x] Data completa em português
- [x] Clima (temperatura, descrição, umidade, vento)
- [x] Feed de comunicados com rotação automática (8s)
- [x] Tipos: Aviso, Comunicado, Evento, Urgente
- [x] Posts em destaque
- [x] Expiração automática de posts
- [x] Agendamento de posts (`publica_em`)
- [x] Atualização em tempo real (sem F5)
- [x] Histórico completo de tudo que foi postado
- [x] Upload de imagens nos posts
- [x] Painel admin customizado (SvelteKit)
- [x] Múltiplas telas via `/tela/[slug]`
- [x] Ticker/marquee de boletins configurável
- [x] Campanha/banner configurável
- [x] Modo de manutenção
- [x] Integração com Google Calendar
- [x] Calendário de datas comemorativas
- [x] Playlist de mídia (imagens/vídeos) em loop
- [x] TOTP (2FA) para superadmins
- [x] reCAPTCHA v3 no login
- [x] SMTP configurável via painel (templates de e-mail editáveis)
- [x] Sync automático de campanhas/destaques → calendário
