#!/usr/bin/env python3
import http.client
import os
import socket
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

BUILD_DIR = Path(os.getenv("TV_FRONTEND_BUILD_DIR", "/home/bitsafe/tv-corporativa/frontend/build")).resolve()
HOST = os.getenv("TV_FRONTEND_HOST", "0.0.0.0")
PORT = int(os.getenv("TV_FRONTEND_PORT", "8081"))
PB_HOST = os.getenv("TV_POCKETBASE_HOST", "127.0.0.1")
PB_PORT = int(os.getenv("TV_POCKETBASE_PORT", "8090"))

PROXY_PREFIXES = ("/api/", "/_/", "/pb_public/")
HOP_BY_HOP_HEADERS = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
}


class SPAStaticHandler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "application/javascript",
        ".mjs": "application/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".svg": "image/svg+xml",
        ".webp": "image/webp",
        ".ico": "image/x-icon",
        ".woff2": "font/woff2",
    }

    def translate_path(self, path):
        raw_path = unquote(urlsplit(path).path)
        candidate = (BUILD_DIR / raw_path.lstrip("/")).resolve()
        try:
            candidate.relative_to(BUILD_DIR)
        except ValueError:
            return str(BUILD_DIR / "index.html")

        if candidate.is_file() or candidate.is_dir():
            return str(candidate)

        return str(BUILD_DIR / "index.html")

    def end_headers(self):
        if self.path.startswith("/_app/"):
            self.send_header("Cache-Control", "public, max-age=31536000, immutable")
        elif not self._is_proxy_path():
            self.send_header("Cache-Control", "no-cache")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def do_GET(self):
        if self._is_proxy_path():
            self._proxy_to_pocketbase()
            return
        super().do_GET()

    def do_HEAD(self):
        if self._is_proxy_path():
            self._proxy_to_pocketbase()
            return
        super().do_HEAD()

    def do_POST(self):
        self._proxy_to_pocketbase()

    def do_PUT(self):
        self._proxy_to_pocketbase()

    def do_PATCH(self):
        self._proxy_to_pocketbase()

    def do_DELETE(self):
        self._proxy_to_pocketbase()

    def do_OPTIONS(self):
        self._proxy_to_pocketbase()

    def _is_proxy_path(self):
        return urlsplit(self.path).path.startswith(PROXY_PREFIXES)

    def _proxy_to_pocketbase(self):
        if not self._is_proxy_path():
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        body = None
        content_length = int(self.headers.get("Content-Length") or 0)
        if content_length:
            body = self.rfile.read(content_length)

        headers = {}
        for key, value in self.headers.items():
            if key.lower() in HOP_BY_HOP_HEADERS:
                continue
            headers[key] = value

        headers["Host"] = self.headers.get("Host", "")
        headers["X-Real-IP"] = self.client_address[0]
        forwarded_for = self.headers.get("X-Forwarded-For")
        headers["X-Forwarded-For"] = f"{forwarded_for}, {self.client_address[0]}" if forwarded_for else self.client_address[0]
        headers["X-Forwarded-Proto"] = self.headers.get("X-Forwarded-Proto", "https")

        conn = http.client.HTTPConnection(PB_HOST, PB_PORT, timeout=86400)
        try:
            conn.request(self.command, self.path, body=body, headers=headers)
            response = conn.getresponse()
            self.send_response(response.status, response.reason)
            for key, value in response.getheaders():
                if key.lower() in HOP_BY_HOP_HEADERS:
                    continue
                self.send_header(key, value)
            self.end_headers()

            if self.command == "HEAD":
                return

            while True:
                chunk = response.read(64 * 1024)
                if not chunk:
                    break
                self.wfile.write(chunk)
                self.wfile.flush()
        except (ConnectionError, TimeoutError, socket.timeout, OSError) as exc:
            self.send_error(HTTPStatus.BAD_GATEWAY, f"PocketBase proxy failed: {exc}")
        finally:
            conn.close()

    def log_message(self, fmt, *args):
        print("%s - - [%s] %s" % (self.client_address[0], self.log_date_time_string(), fmt % args), flush=True)


if __name__ == "__main__":
    if not (BUILD_DIR / "index.html").is_file():
        raise SystemExit(f"Missing frontend build index.html in {BUILD_DIR}")
    os.chdir(BUILD_DIR)
    server = ThreadingHTTPServer((HOST, PORT), SPAStaticHandler)
    print(f"TV frontend serving {BUILD_DIR} on http://{HOST}:{PORT}", flush=True)
    print(f"Proxying {', '.join(PROXY_PREFIXES)} to http://{PB_HOST}:{PB_PORT}", flush=True)
    server.serve_forever()
