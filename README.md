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
├── frontend/          → SvelteKit (tela da TV)
└── backend/           → PocketBase (API + Admin + DB)
    └── pocketbase.exe → Baixar em pocketbase.io/docs
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

4. Crie a coleção `posts` com os campos:
   - `titulo` → Text (obrigatório)
   - `conteudo` → Editor
   - `tipo` → Select: `aviso, comunicado, evento, urgente`
   - `imagem` → File (opcional)
   - `ativo` → Bool (padrão: true)
   - `destaque` → Bool (padrão: false)
   - `expira_em` → Date (opcional)

### 2. Frontend (TV Display)

```bash
cd frontend
npm install
cp .env.example .env   # edite com sua chave do clima
npm run dev
```

Acesse: **http://localhost:5173**

---

## Configuração do Clima

1. Crie conta gratuita em: https://openweathermap.org/api
2. Copie sua API Key
3. Edite o arquivo `frontend/.env`:
   ```
   PUBLIC_WEATHER_API_KEY=sua_chave_aqui
   PUBLIC_WEATHER_CITY=São Paulo
   PUBLIC_WEATHER_COUNTRY=BR
   ```

---

## Como Gerenciar Conteúdo

Acesse o painel admin do PocketBase: **http://127.0.0.1:8090/_/**

- **Criar post:** Collections → posts → New record
- **Tipos disponíveis:** `aviso`, `comunicado`, `evento`, `urgente`
- **Destaque:** Posts com destaque aparecem primeiro
- **Expiração:** Defina `expira_em` para remover automaticamente da TV
- **Histórico:** Todos os posts ficam salvos, mesmo desativados

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
- [x] Atualização em tempo real (sem F5)
- [x] Histórico completo de tudo que foi postado
- [x] Upload de imagens nos posts
- [x] Painel admin para usuários não-técnicos
