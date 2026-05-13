---
name: markdown-articles-reader
description: Use when user wants to start/open the articles reader. Triggers on phrases like "启动文章阅读器", "打开阅读器", "start articles reader", etc.
---

Start the articles reader — a local web app for browsing and annotating saved markdown articles.

## Architecture

- **Server**: `<project_root>/articles/local.py` — Python HTTP server, serves static files, provides a notes API (`POST /api/notes`) and an articles listing API (`GET /api/articles`)
- **Frontend**: `<project_root>/articles/index.html` — SPA with sidebar file tree (grouped by date), markdown rendering, CN/EN bilingual dual-pane view, text highlighting, and note annotations
- **Articles**: stored as `.md` files under `<project_root>/articles/<YYYY-MM-DD>/`, with optional `.notes.json` sidecar files for highlights
- **Article index**: dynamically fetched from the server via `GET /api/articles` — no manual index update needed

## Steps

### Starting the reader

1. Start the server in background on port 4321:
   ```bash
   cd <project_root>/articles && PORT=4321 python3 local.py
   ```
2. Open the browser:
   ```bash
   open http://localhost:4321
   ```
3. Report to the user that the reader is running at `http://localhost:4321`.

### Stopping the reader

If the user asks to stop/close the reader, find and kill the Python server process on the port it was started on:

```bash
lsof -ti:4321 | xargs kill
```

## Notes

- The server must be started from the `<project_root>/articles/` directory (it does `os.chdir` to its own directory)
- Default port is 4321, can be overridden via `PORT` env var
