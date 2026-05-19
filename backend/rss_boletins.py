#!/usr/bin/env python3
"""
rss_boletins.py — Importa manchetes de feeds RSS de cibersegurança para a
collection Boletins do PocketBase, que aparece no ticker da TV.

Uso:
  python rss_boletins.py

Credenciais (qualquer uma das formas abaixo):
  1. Arquivo .env.rss no mesmo diretório (recomendado)
  2. Variáveis de ambiente: PB_URL, PB_EMAIL, PB_PASSWORD

Agendamento:
  Linux  → crontab -e: 0 * * * * cd /home/bitsafe/tv-corporativa/backend && python3 rss_boletins.py
  Windows → Agendador de Tarefas → rss_boletins.bat
"""

import json
import os
import sys
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

PB_URL       = os.getenv("PB_URL",      "http://127.0.0.1:8090")
PB_EMAIL     = os.getenv("PB_EMAIL",    "")
PB_PASSWORD  = os.getenv("PB_PASSWORD", "")

EXPIRA_HORAS      = int(os.getenv("RSS_EXPIRA_HORAS",   "48"))  # news expira em X horas
MAX_POR_FEED      = int(os.getenv("RSS_MAX_POR_FEED",   "5"))   # máx itens novos por feed por execução
HTTP_TIMEOUT      = 15   # segundos

STATE_FILE = Path(__file__).parent / ".rss_state.json"

FEEDS = [
    {
        "nome": "The Hacker News",
        "url":  "https://feeds.feedburner.com/TheHackersNews",
    },
    {
        "nome": "BleepingComputer",
        "url":  "https://www.bleepingcomputer.com/feed/",
    },
    {
        "nome": "SANS ISC",
        "url":  "https://isc.sans.edu/rssfeed.xml",
    },
    {
        "nome": "CISA Alerts",
        "url":  "https://www.cisa.gov/uscert/ncas/alerts.xml",
    },
]

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
    # mantém apenas os últimos 2000 GUIDs para não crescer indefinidamente
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
        title = (item.findtext("title") or "").strip()
        link  = (item.findtext("link")  or "").strip()
        guid  = (item.findtext("guid")  or link or title).strip()
        if title:
            items.append({"guid": guid, "title": title})

    # Atom (se RSS não encontrou nada)
    if not items:
        for entry in root.findall(f".//{{{_ATOM_NS}}}entry"):
            title = (entry.findtext(f"{{{_ATOM_NS}}}title") or "").strip()
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
    print(f"[{ts}] Importando RSS de cibersegurança...", flush=True)

    seen = load_state()
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

            try:
                criar_boletim(token, item["title"])
                seen.add(item["guid"])
                novos += 1
                total += 1
                print(f"    + {item['title'][:90]}", flush=True)
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
