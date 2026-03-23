# TV Corporativa Bitsafe — Contexto do Projeto

## O que é este projeto

Sistema de **TV Corporativa** para exibição interna da Bitsafe. Substitui uma instalação WordPress/Elementor por uma stack moderna.

A tela fica aberta em fullscreen num navegador (modo kiosk) numa TV da empresa e exibe:
- Relógio em tempo real com fuso horário
- Data completa em português
- Clima (temperatura, descrição, umidade, vento)
- Feed rotativo de comunicados/avisos postados pelo time

---

## Stack

| Camada | Tecnologia | Motivo |
|--------|-----------|--------|
| Frontend (TV) | SvelteKit + Tailwind CSS | Leve, reativo, perfeito para displays 24/7 |
| Backend + Admin | PocketBase | Painel admin embutido, tempo real nativo, SQLite |
| Banco de dados | SQLite (via PocketBase) | Simples, histórico completo, zero config |
| Clima | OpenWeatherMap API (gratuita) | Integração direta no frontend |
| Tempo real | PocketBase Realtime (SSE) | TV atualiza sozinha sem F5 |

---

## Estrutura de Diretórios

```
tv-corporativa/
├── CLAUDE.md                   ← este arquivo
├── README.md                   ← instruções de setup
├── frontend/                   ← SvelteKit (tela da TV)
│   ├── dev.bat                 ← script para rodar em dev no Windows
│   ├── .env                    ← variáveis de ambiente (API key clima, URL PocketBase)
│   ├── .env.example            ← template do .env
│   ├── package.json
│   ├── svelte.config.js
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   ├── static/
│   └── src/
│       ├── app.html            ← HTML base (fontes Google, meta tags)
│       ├── app.css             ← Tailwind + utilitários globais (glass, text-shadow)
│       ├── routes/
│       │   ├── +layout.svelte  ← importa app.css
│       │   └── +page.svelte    ← tela principal da TV (layout completo)
│       └── lib/
│           ├── pocketbase.ts   ← client PocketBase + tipos Post, Configuracao
│           ├── components/
│           │   ├── Clock.svelte        ← relógio HH:MM:SS reativo
│           │   ├── DateDisplay.svelte  ← data em pt-BR
│           │   ├── Weather.svelte      ← clima com ícones emoji
│           │   └── PostsFeed.svelte    ← feed rotativo de posts (8s por post)
│           └── stores/
│               ├── clock.ts    ← store readable que atualiza a cada 1s
│               ├── weather.ts  ← fetch clima a cada 10min, store writable
│               └── posts.ts    ← carrega posts do PocketBase + subscribe realtime
└── backend/
    ├── start.bat               ← inicia o PocketBase no Windows
    ├── pocketbase.exe          ← binário (baixar em pocketbase.io/docs)
    └── pb_migrations/
        └── 001_initial_schema.js ← schema da coleção posts
```

---

## Coleção PocketBase: `posts`

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `titulo` | Text | Sim | Título do comunicado (max 200 chars) |
| `conteudo` | Editor | Sim | Corpo do texto |
| `tipo` | Select | Sim | `aviso`, `comunicado`, `evento`, `urgente` |
| `imagem` | File | Não | Imagem anexada (jpg, png, webp, gif) |
| `ativo` | Bool | Não | Se aparece na TV (padrão: true) |
| `destaque` | Bool | Não | Posts em destaque aparecem primeiro |
| `expira_em` | Date | Não | Data/hora de expiração automática |

Regras de acesso: leitura pública, escrita apenas para admins autenticados.

---

## Como Rodar Localmente

### Backend (PocketBase)
```bash
# Baixar pocketbase.exe em https://pocketbase.io/docs e colocar em backend/
cd backend
./start.bat
# Painel admin: http://127.0.0.1:8090/_/
```

### Frontend (SvelteKit)
```bash
cd frontend
./dev.bat
# Ou manualmente:
# set NODE_ENV=development && npm run dev
# Acesse: http://localhost:5173
```

> **Atenção:** A máquina de desenvolvimento tem `NODE_ENV=production` definido globalmente.
> Sempre usar `dev.bat` ou setar `NODE_ENV=development` antes de rodar npm commands.
> Para instalar dependências: `npm install --include=dev`

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

## Decisões de Design

- **Layout fullscreen 16:9** com fundo `slate-950` e gradiente sutil azul
- **Glassmorphism** (`.glass`, `.glass-dark`) nos cards para visual moderno
- **Relógio** em fonte mono tamanho 8xl, segundos menores e mais opacos
- **Feed de posts** rotaciona automaticamente a cada 8 segundos com animação `slide-up`
- **Indicador de posts** (bolinhas) no canto superior direito do feed
- **Badge colorido** por tipo: amarelo (aviso), azul (comunicado), verde (evento), vermelho (urgente)
- **Indicador "Ao vivo"** no rodapé com bolinha verde pulsante
- Posts com `expira_em` no passado são filtrados automaticamente na query do PocketBase

---

## Funcionalidades Implementadas

- [x] Relógio em tempo real (atualiza a cada 1 segundo)
- [x] Data completa em pt-BR com dia da semana
- [x] Clima com ícones emoji, temperatura, umidade e vento
- [x] Feed rotativo de comunicados (8s por post)
- [x] 4 tipos de post com cores distintas
- [x] Posts em destaque (aparecem primeiro)
- [x] Expiração automática de posts
- [x] Upload de imagem por post
- [x] Atualização em tempo real via PocketBase Realtime (sem F5)
- [x] Histórico completo (posts inativos ficam salvos no banco)
- [x] Painel admin para usuários não-técnicos (PocketBase built-in)
- [x] Configurações da empresa editáveis pelo painel (collection `configuracoes`)
- [x] Agendamento de posts (`publica_em` — só aparece a partir da data definida)
- [x] Modo de manutenção (ativa via painel, exibe tela `Maintenance.svelte`)
- [x] Ticker/marquee de notícias na parte inferior (configurável pelo painel)
- [x] Suporte a múltiplas telas/locais (rota `/tela/[slug]`, collection `telas` com filtro por tipo)
- [x] Integração com Google Calendar (eventos públicos via API, requer `google_api_key` + `google_calendar_id` na config)
- [x] Playlist de vídeos/imagens em loop (collection `midia`, exibe quando não há posts ativos)

---

## Histórico de Desenvolvimento

### 2026-03-20 — Criação do projeto
- Migração do WordPress + Elementor para SvelteKit + PocketBase
- Decisão tomada pelo Guilherme (Bitsafe)
- Motivo: modernização da stack, eliminação da dependência do WordPress
- Rodando local por enquanto, com planos de subir para hospedagem no futuro
- Projeto localizado em `D:\Repos\BITSAFE\SITES\tv-corporativa\`

### 2026-03-20 — Implementação completa do backlog
- Configurações da empresa via PocketBase (`configuracoes` collection)
- Agendamento de posts com campo `publica_em`
- Modo de manutenção com overlay fullscreen
- Ticker/marquee configurável via painel
- Múltiplas telas via rota `/tela/[slug]` com filtros por tipo de post
- Google Calendar: eventos de calendário público na sidebar
- Playlist de mídia (imagens/vídeos) exibida quando não há posts ativos
- Posts filtrados por tela via campo `somente_telas`
