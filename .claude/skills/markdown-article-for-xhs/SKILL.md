---
name: markdown-article-for-xhs
description: Use when user provides a Xiaohongshu (小红书) note URL to convert into a local markdown file.
---

Convert a Xiaohongshu note page into a well-formatted markdown file. Inherits all rules from [@markdown-article](../markdown-article/SKILL.md), with the following Xiaohongshu-specific additions and overrides.

## Important: Accepted URL formats

The input URL can be in any of these formats:

- Short link: `http://xhslink.com/o/<id>`
- Full link: `https://www.xiaohongshu.com/explore/<note_id>` or `https://www.xiaohongshu.com/discovery/item/<note_id>`

## Important: Use xiaohongshu.day for content extraction

Xiaohongshu pages require login and have aggressive anti-scraping measures. Direct access via `curl`, `WebFetch`, or even Playwright will be blocked by login walls.

**You must use the third-party tool [xiaohongshu.day](https://xiaohongshu.day) via Playwright MCP** to extract note content:

1. Navigate to `https://xiaohongshu.day`
2. Type the user-provided URL into the input box (the textbox with placeholder "输入小红书笔记链接") and press Enter
3. Wait for the content to load (wait for "处理中..." text to disappear, timeout ~15s)
4. Extract from the loaded result:
   - **Author name**: from the author info section
   - **Publish date**: from the date display
   - **Title**: from the `<h1>` heading
   - **Body text**: from the note description area
   - **Tags**: from the tag list (e.g. `#applewatch`, `#苹果手表`)
   - **Images**: use `page.evaluate` to query all `img` elements whose `src` contains `ci.xiaohongshu.com/spectrum/` — these are the note's content images (skip avatar images from `sns-avatar`)

## Extracting the note ID

The note ID is needed for the filename and the canonical URL:

- From short link `http://xhslink.com/o/8Z2fmYgDoWW`: after submitting to xiaohongshu.day, the result page will show the resolved note. Extract the note ID from the page's heading link or the resolved URL (format: `690afc280000000003021ea2`)
- From full link `https://www.xiaohongshu.com/explore/690afc280000000003021ea2`: the note ID is the last path segment

## File location override

The filename uses an `xhs-` prefix followed by the note ID:

```
<project_root>/articles/2026-03-19/xhs-690afc280000000003021ea2.md
```

## Output structure

```markdown
# <note title>

> - 来源：<author name>（小红书）
> - 日期：<publish date>
> - 原文链接：https://www.xiaohongshu.com/explore/<note_id>
> - 标签：#tag1 #tag2 #tag3

---

<note body text>

![](image_1_url)

![](image_2_url)

...
```

## Image handling

- Include all content images from the note using `![](url)` syntax
- Image URLs are from `ci.xiaohongshu.com/spectrum/` domain, keep the full URL including query parameters
- Skip the author avatar image (from `sns-avatar-qc.xhscdn.com`)

## Before reporting done

Re-read [@markdown-article](../markdown-article/SKILL.md) and verify **every** rule defined there has been followed (translation, long-article handling, etc.). The base skill is the source of truth — do not skip this step.

## Example

Source URL: `http://xhslink.com/o/8Z2fmYgDoWW`
Output path: `<project_root>/articles/2026-03-19/xhs-690afc280000000003021ea2.md`
