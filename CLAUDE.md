# Read It Later

A personal read-it-later repository for saving web articles as markdown files.

## Structure

- `articles/<date>/` — Markdown articles organized by date
- `blog/` — Blog posts and short-form writing
- `.claude/skills/` — Claude Code skills for article capture and reading
- `.github/workflows/` — Auto-generates ARTICLES.md and BLOG.md indexes on push

## Dependencies

- Claude Code plugin: `playwright@claude-plugins-official` (required by markdown skills for web scraping)
