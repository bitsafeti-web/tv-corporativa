#!/usr/bin/env python3
"""
rss_boletins.py — Importa manchetes de feeds RSS de cibersegurança para a
collection Boletins do PocketBase, traduzindo automaticamente para pt-BR.

Uso:
  python rss_boletins.py

Credenciais (qualquer uma das formas abaixo):
  1. Arquivo .env.rss no mesmo diretório (recomendado)
  2. Variáveis de ambiente: PB_URL, PB_EMAIL, PB_PASSWORD

Agendamento:
  Linux  → crontab -e: 0 * * * * cd /home/bitsafe/tv-corporativa/backend && python3 rss_boletins.py
  Windows → Agendador de Tarefas → rss_boletins.bat
"""

import html
import json
import os
import sys
import time
import urllib.parse
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Garante que o console do Windows não quebre com caracteres UTF-8
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# ── Configuração ──────────────────────────────────────────────────────────────

def _load_dotenv():
    env_file = Path(__file__).parent / ".env.rss"
    if not env_file.exists():
        return
    for line in env_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))

_load_dotenv()

PB_URL          = os.getenv("PB_URL",          "http://127.0.0.1:8090")
PB_EMAIL        = os.getenv("PB_EMAIL",        "")
PB_PASSWORD     = os.getenv("PB_PASSWORD",     "")
MYMEMORY_EMAIL  = os.getenv("MYMEMORY_EMAIL",  "")  # opcional: aumenta limite para 10k palavras/dia

EXPIRA_HORAS    = int(os.getenv("RSS_EXPIRA_HORAS", "48"))  # notícia expira em X horas
MAX_POR_FEED    = int(os.getenv("RSS_MAX_POR_FEED",  "5"))  # máx itens novos por feed por execução
HTTP_TIMEOUT    = 15  # segundos

STATE_FILE = Path(__file__).parent / ".rss_state.json"

# lang="en" → traduz para pt-BR; lang="pt" → salva como está
FEEDS = [
    # ── Brasil (pt) ──────────────────────────────────────────────────
    {
        "nome": "CISO Advisor",
        "url":  "https://cisoadvisor.com.br/feed/",
        "lang": "pt",
    },
    {
        "nome": "TI Inside",
        "url":  "https://tiinside.com.br/feed/",
        "lang": "pt",
    },
    # ── Internacional (en → traduzido para pt-BR) ────────────────────
    {
        "nome": "The Hacker News",
        "url":  "https://feeds.feedburner.com/TheHackersNews",
        "lang": "en",
    },
    {
        "nome": "BleepingComputer",
        "url":  "https://www.bleepingcomputer.com/feed/",
        "lang": "en",
    },
    {
        "nome": "Dark Reading",
        "url":  "https://www.darkreading.com/rss.xml",
        "lang": "en",
    },
    {
        "nome": "Krebs on Security",
        "url":  "https://krebsonsecurity.com/feed/",
        "lang": "en",
    },
    {
        "nome": "SecurityWeek",
        "url":  "https://feeds.feedburner.com/securityweek",
        "lang": "en",
    },
    {
        "nome": "SANS ISC",
        "url":  "https://isc.sans.edu/rssfeed.xml",
        "lang": "en",
    },
    {
        "nome": "CISA Alerts",
        "url":  "https://www.cisa.gov/uscert/ncas/alerts.xml",
        "lang": "en",
    },
]

# ── Tradução (MyMemory — gratuito, sem chave) ────────────────────────────────

def traduzir(texto: str) -> str:
    """Traduz de inglês para pt-BR via MyMemory. Retorna original se falhar."""
    texto = texto.strip()
    if not texto:
        return texto

    params = {"q": texto, "langpair": "en|pt-BR"}
    if MYMEMORY_EMAIL:
        params["de"] = MYMEMORY_EMAIL

    url = "https://api.mymemory.translated.net/get?" + urllib.parse.urlencode(params)
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "TV-Corporativa-RSS/1.0"})
        with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT) as resp:
            data = json.loads(resp.read())
        if data.get("responseStatus") == 200:
            traduzido = data["responseData"]["translatedText"].strip()
            # MyMemory às vezes retorna o texto em maiúsculas quando não tem confiança
            if traduzido and traduzido != texto.upper():
                return traduzido
    except Exception as e:
        print(f"    [tradução] erro: {e}", flush=True)

    return texto  # fallback: original

# ── Estado de deduplicação ───────────────────────────────────────────────────

def load_state() -> set:
    if STATE_FILE.exists():
        try:
            data = json.loads(STATE_FILE.read_text(encoding="utf-8"))
            return set(data.get("seen", []))
        except Exception:
            pass
    return set()

def save_state(seen: set):
    seen_list = list(seen)[-2000:]
    STATE_FILE.write_text(
        json.dumps({"seen": seen_list, "updated": datetime.now().isoformat()}, indent=2),
        encoding="utf-8",
    )

# ── Parser RSS/Atom ──────────────────────────────────────────────────────────

_ATOM_NS = "http://www.w3.org/2005/Atom"

def parse_feed(xml_bytes: bytes) -> list[dict]:
    """Retorna lista de {guid, title} a partir de RSS 2.0 ou Atom."""
    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError as e:
        print(f"    [erro XML] {e}", flush=True)
        return []

    items = []

    # RSS 2.0
    for item in root.findall(".//item"):
        title = html.unescape((item.findtext("title") or "").strip())
        link  = (item.findtext("link")  or "").strip()
        guid  = (item.findtext("guid")  or link or title).strip()
        if title:
            items.append({"guid": guid, "title": title})

    # Atom (se RSS não encontrou nada)
    if not items:
        for entry in root.findall(f".//{{{_ATOM_NS}}}entry"):
            title = html.unescape((entry.findtext(f"{{{_ATOM_NS}}}title") or "").strip())
            link_el = entry.find(f"{{{_ATOM_NS}}}link")
            link = (link_el.get("href", "") if link_el is not None else "").strip()
            guid = (entry.findtext(f"{{{_ATOM_NS}}}id") or link or title).strip()
            if title:
                items.append({"guid": guid, "title": title})

    return items

# ── PocketBase REST API ──────────────────────────────────────────────────────

def _pb(method: str, path: str, body=None, token: str = "") -> dict:
    url  = PB_URL.rstrip("/") + path
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = token
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body_text = e.read().decode(errors="replace")
        raise RuntimeError(f"HTTP {e.code}: {body_text}") from e

def authenticate() -> str:
    resp = _pb("POST", "/api/collections/_superusers/auth-with-password", {
        "identity": PB_EMAIL,
        "password": PB_PASSWORD,
    })
    return resp["token"]

def criar_boletim(token: str, titulo: str):
    expira = (
        datetime.now(timezone.utc) + timedelta(hours=EXPIRA_HORAS)
    ).strftime("%Y-%m-%d %H:%M:%S.000Z")

    _pb("POST", "/api/collections/Boletins/records", {
        "titulo":    titulo[:200],
        "ativo":     True,
        "ordem":     0,
        "expira_em": expira,
    }, token=token)

# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    if not PB_EMAIL or not PB_PASSWORD:
        print(
            "Erro: credenciais não configuradas.\n"
            "Crie o arquivo backend/.env.rss com:\n"
            "  PB_EMAIL=seu-email@bitsafe.com.br\n"
            "  PB_PASSWORD=sua-senha",
            flush=True,
        )
        sys.exit(1)

    ts = datetime.now().strftime("%Y-%m-%d %H:%M")
    print(f"[{ts}] Importando RSS de cibersegurança (com tradução pt-BR)...", flush=True)

    seen  = load_state()
    total = 0

    try:
        token = authenticate()
        print("  PocketBase: autenticado.", flush=True)
    except Exception as e:
        print(f"  Falha na autenticação: {e}", flush=True)
        sys.exit(1)

    for feed in FEEDS:
        print(f"\n  > {feed['nome']}", flush=True)
        try:
            req = urllib.request.Request(
                feed["url"],
                headers={"User-Agent": "TV-Corporativa-RSS/1.0"},
            )
            with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT) as resp:
                xml_bytes = resp.read()
        except Exception as e:
            print(f"    Falha ao buscar feed: {e}", flush=True)
            continue

        items = parse_feed(xml_bytes)
        novos = 0

        for item in items:
            if novos >= MAX_POR_FEED:
                break
            if item["guid"] in seen:
                continue

            titulo_original = item["title"]

            # Traduz apenas feeds em inglês
            if feed.get("lang", "en") == "en":
                titulo = traduzir(titulo_original)
                time.sleep(0.5)  # respeita rate limit da API de tradução
            else:
                titulo = titulo_original

            try:
                criar_boletim(token, titulo)
                seen.add(item["guid"])
                novos += 1
                total += 1
                if titulo != titulo_original:
                    print(f"    + {titulo[:80]}", flush=True)
                    print(f"      (orig: {titulo_original[:70]})", flush=True)
                else:
                    print(f"    + {titulo[:80]}", flush=True)
            except Exception as e:
                print(f"    Erro ao criar boletim: {e}", flush=True)

        if novos == 0:
            print("    Nenhum item novo.", flush=True)
        else:
            print(f"    {novos} item(s) importado(s).", flush=True)

    save_state(seen)
    print(f"\n  Total: {total} boletim(s) criado(s).", flush=True)


if __name__ == "__main__":
    main()
