# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O que é este projeto

Sistema de **TV Corporativa** Bitsafe — tela fullscreen em kiosk mode exibindo relógio, clima, comunicados e ticker de boletins de segurança. Stack: SvelteKit (frontend) + PocketBase (backend/admin/realtime).

---

## Commands

**IMPORTANTE:** A máquina de dev tem `NODE_ENV=production` globalmente. Usar sempre `dev.bat` ou forçar `set NODE_ENV=development` antes de qualquer `npm` command. Para instalar dependências: `npm install --include=dev`.

```bash
# Rodar localmente (orquestra PocketBase + SvelteKit com sync do banco de produção)
dev.bat                     # na raiz do projeto

# Frontend (dentro de frontend/)
npm run dev                 # dev server (porta fixa em vite.config.ts, hoje 5174)
npm run build               # build estático → .svelte-kit/output/
npm run check               # TypeScript + Svelte validation
npm run preview             # preview do build local

# Backend
backend/start.bat           # PocketBase em http://127.0.0.1:8090 (admin em /_/)

# RSS de cibersegurança (Python)
backend/rss_boletins.bat    # importa feeds → coleção Boletins (pode agendar via Task Scheduler)
```

O dev server do Vite tem porta fixa em `frontend/vite.config.ts` (`strictPort: true`) — confira ali antes de assumir 5173.

O frontend usa `@sveltejs/adapter-static` (SPA com fallback em `index.html`); `npm run build` gera `frontend/build/`, não `.svelte-kit/output/`.

---

## Arquitetura

### Rotas SvelteKit

| Rota | Propósito |
|------|-----------|
| `/` | Login (email + senha; superusers também exigem TOTP 6 dígitos + reCAPTCHA v3) |
| `/tv` | Exibição fullscreen só da `Campanha` (banners/vídeos rotativos) + overlay de manutenção — não mostra relógio, clima, posts ou ticker |
| `/tela/[slug]` | Dashboard completo: relógio, clima, feed de posts (ou `MediaPlaylist` quando vazio), sidebar de Google Calendar e ticker — filtrado pela collection `telas` (`filtro_tipo`) |
| `/admin` | Painel admin SPA — seções: Dashboard, Campanhas, Boletins RSS, Usuários (superuser), Configurações (superuser, inclui SMTP) |

`/tv` e `/tela/[slug]` divergiram: features como `ComunicadosSidebar.svelte` e `DestaquesSidebar.svelte` existem no código mas não estão referenciadas em nenhuma rota — são componentes em progresso, ainda não integrados.

### Stores (`frontend/src/lib/stores/`)

Cada store conecta ao PocketBase com subscribe SSE (tempo real) + polling de fallback quando necessário.

| Store | Atualização | Dado |
|-------|-------------|------|
| `clock.ts` | 1s | Hora atual |
| `weather.ts` | 10min | Clima atual + previsão horária (OpenWeatherMap) |
| `posts.ts` | Realtime | Feed principal separado por tipo |
| `config.ts` | Realtime | Config global (nome empresa, modo manutenção, etc.) |
| `boletim.ts` | Realtime | Itens do ticker inferior |
| `campanha.ts` | Realtime + 1min poll | Imagens de campanha/banner |
| `destaques.ts` | Realtime + 1min poll | Posts em destaque |
| `datas.ts` | 60s | Datas comemorativas (7 dias à frente) |
| `midia.ts` | Realtime | Playlist de mídia (fallback quando não há posts) |
| `gcal.ts` | 30min | Eventos Google Calendar (próximos 30 dias) |

### Collections PocketBase

| Collection | Propósito |
|------------|-----------|
| `posts` | Comunicados — tipos: `aviso`, `comunicado`, `evento`, `urgente`, `campanha`, `boletim`, `destaque` |
| `Usuarios` | Contas de usuário regulares |
| `Configuracoes` | Config global: nome_empresa, fuso_horario, weather_api_key, google_api_key, google_calendar_id, modo_manutencao, ticker_ativo |
| `Campanha` | Banners/vídeos rotativos (campo de arquivo `imagem_1568x876px` — nome legado; validação de dimensão exige 1920×1080px Full HD; vídeo também exige 1920×1080px e até 200MB; ativo, publica_em, expira_em) |
| `Destaque` | Posts em destaque |
| `Boletins` | Itens do ticker — titulo, ordem, publica_em, expira_em |
| `DatasComemorativas` | Datas comemorativas com cor, antecedencia_dias e origem (RSS ou manual) |
| `midia` | Playlist de fallback: imagens/vídeos com duração e ordem |
| `telas` | Multi-tela — slug, nome, ativa, filtro_tipo (lida por `/tela/[slug]`) |
| `totp_secrets` | Segredos TOTP dos superusers, gerenciados via hooks `totp.pb.js` |

Registros com `expira_em` e `publica_em` são filtrados automaticamente nas queries PocketBase.

### Tipos TypeScript

Definidos em `frontend/src/lib/pocketbase.ts`: `Post`, `Configuracao`, `CampanhaItem`, `DestaqueItem`, `BoletimItem`, `Tela`, `Midia`.

---

## Features Não-Óbvias

**Hooks PocketBase (`backend/pb_hooks/*.pb.js`)**
- `totp.pb.js` — rotas custom `/api/totp/setup`, `/api/totp/confirm`, `/api/totp/remove`, `/api/totp/auth`; guarda segredos na collection `totp_secrets` e é o fluxo de login usado por superusers (a rota `/` do frontend tenta `Usuarios.authWithPassword` primeiro, cai para `/api/totp/auth` se não for operador)
- `calendario_sync.pb.js` — `onRecordAfterCreateSuccess` em Campanha/Destaque/Boletins que espelha registros para `DatasComemorativas` (ver memória de projeto sobre esse sync antes de mexer em qualquer uma dessas 4 collections)
- `smtp_config.pb.js` — expõe `/api/settings` para o admin ler/gravar config de SMTP do PocketBase (usado na aba Configurações, somente superuser)

**Deploy em produção (`frontend/static_server.py`)**
Servidor Python (sem Node) que serve `frontend/build/` como SPA e faz proxy reverso de `/api/`, `/_/` e `/pb_public/` para o PocketBase local — usado para servir o build estático no servidor de produção sem depender de `npm run preview`. Configurável via env vars `TV_FRONTEND_BUILD_DIR`, `TV_FRONTEND_PORT`, `TV_POCKETBASE_HOST/PORT`.

**RSS de Cibersegurança (`backend/rss_boletins.py`)**
Consome feeds (CISO Advisor, TI Inside, The Hacker News, etc.), traduz artigos em inglês via MyMemory API e posta no Boletins com expiração de 48h. Variáveis de ambiente em `backend/.env.rss`:
```env
PB_URL=http://127.0.0.1:8090
PB_EMAIL=...
PB_PASSWORD=...
# RSS_EXPIRA_HORAS=48
# RSS_MAX_POR_FEED=5
# MYMEMORY_EMAIL=...
```

**Multi-tela**
Posts podem ter campo `somente_telas` (slugs separados por vírgula). A rota `/tela/[slug]` filtra o feed por esse campo.

**Autenticação**
Dois níveis: `Usuarios` (email+senha) e `Superusers` (email+senha+TOTP+reCAPTCHA v3). Token PocketBase fica em `localStorage`; stores verificam auth antes de subscrever.

**Modo manutenção**
Ativado via campo `modo_manutencao` na collection `Configuracoes`. Quando ativo, exibe `Maintenance.svelte` sobreposto à tela inteira.

**Design System**
- Fundo `slate-950`, glassmorphism via `.glass` / `.glass-dark` em `app.css`
- Animações CSS customizadas: `float` (ícone clima), `drip` (chuva), `blow` (vento), scroll do ticker
- Layout assume fullscreen 16:9 (kiosk) — não responsivo para mobile

---

## Variáveis de Ambiente

`frontend/.env`:
```env
PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
PUBLIC_WEATHER_API_KEY=...
PUBLIC_WEATHER_CITY=São Paulo
PUBLIC_WEATHER_COUNTRY=BR
```
