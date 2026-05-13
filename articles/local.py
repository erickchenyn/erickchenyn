#!/usr/bin/env python3
"""Simple HTTP server for articles reader with notes API."""

import json
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = int(os.environ.get("PORT", 8080))

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/api/articles":
            articles = {}
            for entry in sorted(os.listdir("."), reverse=True):
                if os.path.isdir(entry) and not entry.startswith("."):
                    files = sorted(f for f in os.listdir(entry) if f.endswith(".md"))
                    if files:
                        articles[entry] = files
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(articles).encode())
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

            # Sanitize: only allow paths under current directory
            notes_path = os.path.normpath(file_path.replace(".md", ".notes.json"))
            if notes_path.startswith("..") or os.path.isabs(notes_path):
                self.send_response(403)
                self.end_headers()
                return

            os.makedirs(os.path.dirname(notes_path), exist_ok=True)

            if len(notes) == 0:
                # Remove empty notes file
                if os.path.exists(notes_path):
                    os.remove(notes_path)
            else:
                with open(notes_path, "w", encoding="utf-8") as f:
                    json.dump(notes, f, ensure_ascii=False, indent=2)

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"ok":true}')
        else:
            self.send_response(404)
            self.end_headers()


if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    print(f"Serving at http://localhost:{PORT}")
    HTTPServer(("", PORT), Handler).serve_forever()
