#!/usr/bin/env python3
"""Simple HTTP server for reader with multi-source support and notes API."""

import json
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

PORT = int(os.environ.get("PORT", 8080))

ALLOWED_DIRS = {"articles", "scratch", "reader"}

SOURCES = [
    {"id": "articles", "name": "Articles", "type": "grouped"},
    {"id": "scratch", "name": "Scratch", "type": "flat"},
]


class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        if path == "/" or path == "":
            return os.path.join(os.getcwd(), "reader", "index.html")
        result = super().translate_path(path)
        rel = os.path.relpath(result, os.getcwd())
        top = rel.split(os.sep)[0]
        if top not in ALLOWED_DIRS:
            return os.path.join(os.getcwd(), "__blocked__")
        return result

    def do_GET(self):
        parsed = urlparse(self.path)

        if parsed.path == "/api/sources":
            available = [s for s in SOURCES if os.path.isdir(s["id"])]
            self._json_response(available)

        elif parsed.path in ("/api/files", "/api/articles"):
            params = parse_qs(parsed.query)
            source = params.get("source", ["articles"])[0]

            if source == "articles":
                result = {}
                if os.path.isdir("articles"):
                    for entry in sorted(os.listdir("articles"), reverse=True):
                        full = os.path.join("articles", entry)
                        if os.path.isdir(full) and not entry.startswith("."):
                            files = sorted(
                                f for f in os.listdir(full) if f.endswith(".md")
                            )
                            if files:
                                result[entry] = files
                self._json_response({"type": "grouped", "data": result})

            elif source == "scratch":
                files = []
                if os.path.isdir("scratch"):
                    files = sorted(
                        f
                        for f in os.listdir("scratch")
                        if os.path.isfile(os.path.join("scratch", f))
                        and not f.startswith(".")
                    )
                self._json_response({"type": "flat", "data": files})

            else:
                self.send_response(400)
                self.end_headers()

        else:
            super().do_GET()

    def do_POST(self):
        if self.path == "/api/notes":
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            file_path = body.get("file")
            notes = body.get("notes")

            if not file_path or notes is None:
                self.send_response(400)
                self.end_headers()
                return

            notes_path = os.path.normpath(file_path.replace(".md", ".notes.json"))
            if notes_path.startswith("..") or os.path.isabs(notes_path):
                self.send_response(403)
                self.end_headers()
                return

            top = notes_path.split(os.sep)[0]
            if top not in ("articles", "scratch"):
                self.send_response(403)
                self.end_headers()
                return

            os.makedirs(os.path.dirname(notes_path), exist_ok=True)

            if len(notes) == 0:
                if os.path.exists(notes_path):
                    os.remove(notes_path)
            else:
                with open(notes_path, "w", encoding="utf-8") as f:
                    json.dump(notes, f, ensure_ascii=False, indent=2)

            self._json_response({"ok": True})
        else:
            self.send_response(404)
            self.end_headers()

    def _json_response(self, data):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())


if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    print(f"Serving at http://localhost:{PORT}")
    HTTPServer(("", PORT), Handler).serve_forever()
