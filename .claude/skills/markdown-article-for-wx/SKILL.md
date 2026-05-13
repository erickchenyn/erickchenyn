---
name: markdown-article-for-wx
description: Use when user provides a WeChat Official Account (微信公众号) article URL to convert into a local markdown file.
---

Convert a WeChat Official Account article page into a well-formatted markdown file. Inherits all rules from [@markdown-article](../markdown-article/SKILL.md), with the following WeChat-specific additions and overrides.

## Important: URL must be a static short link

The input URL **must** be in the static short link format:

```
https://mp.weixin.qq.com/s/<sn_hash>
```

e.g. `https://mp.weixin.qq.com/s/7FcavO7t_2zBhVZEWlfaxg`

If the user provides a long URL with query parameters (e.g. `__biz`, `mid`, `sn`, `chksm`), ask the user to provide the short link instead. Long URLs with dynamic parameters may expire or fail to load.

## Important: Playwright MCP required

WeChat article pages have aggressive anti-scraping measures (captcha verification). `curl`, `WebFetch`, and other static fetching methods **cannot** retrieve article content. You **must** use Playwright MCP to load and extract the page.

If a verification page ("环境异常") appears, click the "去验证" button and wait for the redirect to complete.

## WeChat-specific steps

After navigating to the page:

1. Wait for the article content to fully load (check for the article title heading)
2. Extract metadata from the page: article title, author, official account name (`nickname`), publish date
3. Remove WeChat-specific UI noise: share buttons, QR codes, "今日好文推荐" sections, "会议推荐" sections, ad banners, comment sections, voting widgets, etc.
4. For dialog/interview articles, format speaker names in bold (e.g. `**Jeremy Howard：**`)

## File location override

The filename uses a `wx-` prefix followed by the `sn_hash` from the short link URL:

- `wx-<sn_hash>`: the `<sn_hash>` is extracted from the URL path, e.g. for `https://mp.weixin.qq.com/s/7FcavO7t_2zBhVZEWlfaxg` the hash is `7FcavO7t_2zBhVZEWlfaxg`

```
<project_root>/articles/2026-03-16/wx-7FcavO7t_2zBhVZEWlfaxg.md
```

## Output structure

```markdown
# <article title>

> - 来源：<official account name>（微信公众号）
> - 作者：<author>
> - 日期：<publish date>
> - 原文链接：<short link URL>

---

<markdown body>
```

## Before reporting done

Re-read [@markdown-article](../markdown-article/SKILL.md) and verify **every** rule defined there has been followed (translation, long-article handling, etc.). The base skill is the source of truth — do not skip this step.

## Example

Source URL: `https://mp.weixin.qq.com/s/7FcavO7t_2zBhVZEWlfaxg`
Output path: `<project_root>/articles/2026-03-16/wx-7FcavO7t_2zBhVZEWlfaxg.md`
