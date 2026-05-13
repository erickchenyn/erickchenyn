---
name: markdown-article
description: Use when user provides a web article URL to convert into a local markdown file.
---

Convert a web article page into a well-formatted markdown file.

## Input

A valid article URL, e.g. `https://example.com/blog/some-article`

## Steps

1. Fetch the page content (prefer Playwright MCP if available, otherwise use `curl` + Python `markdownify` / `BeautifulSoup` as fallback)
2. Extract the article body from `<article>`, `<main>`, or the most relevant content container
3. Convert the extracted HTML into well-formatted markdown:
   - Identify section headings and set proper `##` / `###` levels
   - Wrap code snippets in fenced code blocks with language hints (`bash, `json, ```yaml, etc.)
   - Format lists, blockquotes, tables, bold/italic correctly
   - Preserve images at their original positions using `![caption](url)` syntax
   - Remove UI noise (navigation, sidebar, footer, ads, share buttons, comment sections, etc.)
4. If Playwright was used, close the browser tab

## Output

A single `.md` file with the following structure:

```markdown
# <article title>

> <original URL>

<markdown body>
```

### File location

The file MUST be saved to `<project_root>/articles/<date>/<slug>.md`, where `<project_root>` is the current working directory (the project root where Claude Code is running):

- `<date>`: the date when this skill is executed, formatted as `YYYY-MM-DD` (e.g. `2026-03-14`)
- `<slug>`: a Unix timestamp in milliseconds at the time of execution (e.g. `1742280000000`)

Create the date directory if it does not exist.

### Translation

If the article is in a non-Chinese language (English, Japanese, etc.), save an additional Chinese translation alongside the original. The translated file:

- Uses the same output structure (`# <translated title>`, `> <original URL>`, translated body)
- Filename is the original filename with a `-cn` suffix, e.g. `x-2018385296610746403-cn.md` or `ai-coding-2025-cn.md`
- Saved in the same date directory as the original

## Long articles

When an article is very long (e.g. full podcast transcripts, lengthy interviews), writing the entire file at once can time out or stall. In such cases:

1. First create the `.md` file with only the front matter (title, metadata, `---` separator) and an empty body
2. Then append content **section by section** (one heading + its paragraphs per edit) using the Edit tool
3. Never attempt to write the full article body in a single Write or Edit operation

## Stop condition

The task is done when the markdown file (and translation if applicable) is written and its path is reported to the user.
