---
name: markdown-article-for-x
description: Use when user provides an X (Twitter) Article URL to convert into a local markdown file.
---

Convert an X Article page into a well-formatted markdown file. Inherits all rules from [@markdown-article](../markdown-article/SKILL.md), with the following X-specific additions and overrides.

## Important: Playwright MCP required

X pages are fully JavaScript-rendered. `curl`, `WebFetch`, and other static fetching methods **cannot** retrieve any article content. You **must** use Playwright MCP to load and extract the page.

## X-specific steps

After navigating to the page:

1. Extract metadata before entering Focus mode:
   - **Author display name**: from the page title (format `<name> on X: "..."`) or from the link text pointing to the author's profile
   - **Username**: from the URL path (e.g. `HiTw93` from `x.com/HiTw93/status/...`)
   - **Publish date**: from the `<time>` element's `datetime` attribute
2. If the page has a "Focus mode" link (`/article/` path), navigate to it for a cleaner layout
3. When extracting images, query `img` elements whose `src` contains `pbs.twimg.com/media/`, and replace `name=small` with `name=large` for high resolution
4. Remove X-specific UI noise: follower counts, "Sign up", "Log in", engagement metrics, "Want to publish your own Article?", etc.

## File location override

The filename uses an `x-` prefix followed by the article ID:

- `x-<id>`: the `<id>` is extracted from the URL path (the last segment), e.g. for `https://x.com/HiTw93/status/2032091246588518683` the ID is `2032091246588518683`

```
<project_root>/articles/2026-03-14/x-2032091246588518683.md
```

## Output structure

```markdown
# <article title>

> - 作者：<author display name>（X @username）
> - 日期：<publish date>
> - 原文链接：<original URL>

---

<markdown body>
```

## Before reporting done

Re-read [@markdown-article](../markdown-article/SKILL.md) and verify **every** rule defined there has been followed (translation, long-article handling, etc.). The base skill is the source of truth — do not skip this step.

## Example

Source URL: `https://x.com/HiTw93/status/2032091246588518683`
Output path: `<project_root>/articles/2026-03-14/x-2032091246588518683.md`
