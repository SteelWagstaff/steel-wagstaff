# WordPress Blog Re-Migration Design

**Date:** 2026-05-16  
**Status:** Approved  
**Scope:** `steelwagstaff.WordPress.2026-04-24.xml` → `src/content/blog/en/`

---

## Problem

The existing WordPress-to-Markdown migration was low quality:
- Links were lost during HTML conversion
- Section headings were left as ALL CAPS plain text instead of `##` markdown headings
- Featured images and WordPress categories/tags were not preserved in frontmatter
- `[caption]` and `[gallery]` shortcodes were left as raw text
- Bare Spotify/YouTube/SoundCloud URLs were left as plain lines in post bodies
- `description` fields were empty or duplicated from `title`
- `tags` arrays were all empty

The WordPress XML export contains the original HTML and full metadata — re-migrating from source produces significantly higher quality output.

---

## Approach

**Re-migrate from XML directly.** A Node.js script (`scripts/migrate-wordpress-blog.mjs`) parses the WordPress XML export, transforms each post, and writes clean Markdown files to `src/content/blog/en/`, overwriting existing files.

The script does **not** touch `src/content/podcasts/`, `src/content/music/`, or `src/content/commonplace/`.

---

## Section 1: Script Architecture

**File:** `scripts/migrate-wordpress-blog.mjs`  
**Runtime:** Node.js  
**Dependencies:** `turndown` (HTML→Markdown, install via pnpm)

### Phases

1. **Parse XML** — load `steelwagstaff.WordPress.2026-04-24.xml`, build two lookup maps:
   - `attachmentById`: `post_id → { url, filename }` — for resolving featured images via `_thumbnail_id`
   - `attachmentByFilename`: `basename → local path in media-exports/` — for resolving inline images

2. **Filter posts** — keep only items where:
   - `wp:post_type = post`
   - `wp:status = publish`
   - Categories do NOT include any of: `Mix Tapes`, `Radio Shows`, `Spotify Playlists`, `from tumblr`, `What I'm Listening To`

3. **Transform each post** — generate frontmatter + transform HTML content → write `.md` file

4. **Report** — write `scripts/missing-media-report.json` (posts with unresolved images), print summary to stdout

---

## Section 2: Frontmatter Generation

```yaml
---
title: "Post Title"
description: "First sentence of content, truncated to ~160 chars."
publishedAt: 2017-01-20
author: steel
tags: ["wedding-planning", "photography", "madison"]
draft: false
locale: en
image: "../../../assets/blog/filename.jpg"     # only if _thumbnail_id resolves
imageAlt: "Post Title"                          # fallback to title
spotifyPlaylist: "https://open.spotify.com/..." # only if bare Spotify URL found in content
---
```

### Tag mapping rules

- WordPress `category` domain entries → tags (slugified: `Wedding Planning` → `wedding-planning`)
- WordPress `post_tag` domain entries → tags (slugified)
- Excluded from tags: `Blog`, `Mix Tapes`, `Radio Shows`, `Spotify Playlists`, `from tumblr`, `What I'm Listening To`
- All remaining categories map to `blog` collection (no separate collection routing)

### Featured image resolution

`_thumbnail_id` → `attachmentById[id].url` → extract URL basename → fuzzy-search `media-exports/` for matching filename (case-insensitive, stripping size suffixes like `-300x200`) → if found, copy to `src/assets/blog/` and write relative path. If not found, omit `image` field and add to missing media report.

---

## Section 3: Content Transformation Rules

Applied in this order:

### Pre-processing (before HTML→Markdown)

1. **`[caption]` shortcodes** — two variants exist in the WordPress XML:
   - `[caption caption="text"]<img .../>[/caption]` — caption in attribute
   - `[caption]<img .../>caption text[/caption]` — caption in body
   - Both converted to: `<figure class="align-{left|right|center}"><img .../><figcaption>caption text</figcaption></figure>`

2. **Inline image URL rewriting** — all `src="https://steelwagstaff.files.wordpress.com/..."` and `src="https://steelwagstaff.info/wordpress/..."` URLs:
   - Extract basename, strip size suffixes (`-300x200`, `-e1499456265181`, etc.)
   - Search `media-exports/` for a matching local file
   - If found: copy to `src/assets/blog/`, rewrite `src` to local path
   - If not found: leave original URL, add to missing media report

3. **`[gallery]` shortcodes** → replace with `<!-- gallery: ids=... (not migrated) -->`

4. **Bare Spotify URLs** (line containing only `https://open.spotify.com/...`) → extract to `spotifyPlaylist` frontmatter field, remove line from body

5. **Bare YouTube URLs** (line containing only `https://youtu.be/...` or `https://www.youtube.com/...`) → replace with `<YouTubeEmbed url="..." />`

6. **Bare SoundCloud URLs** (line containing only `https://soundcloud.com/...`) → replace with `<SoundCloudEmbed url="..." />`

### HTML → Markdown

Use `turndown` with these configuration rules:
- `headingStyle: 'atx'` — produces `#`/`##`/`###` headings
- `bulletListMarker: '-'`
- `codeBlockStyle: 'fenced'`
- Add custom rule: `<figure>` elements → pass through as raw HTML (not converted)
- Links preserved as `[text](url)` — this is the primary fix for lost links

### Post-processing (after HTML→Markdown)

7. **ALL CAPS headings** — lines matching `/^[A-Z][A-Z\s]{3,}$/` on their own → convert to `## Heading` (title-cased)
8. **Strip leading/trailing blank lines** from body content

---

## Section 4: Output & Post-Migration

### Output files

| Path | Description |
|------|-------------|
| `src/content/blog/en/{slug}.md` | One file per post, overwrites existing |
| `src/assets/blog/{filename}` | Resolved images copied here |
| `scripts/missing-media-report.json` | Array of `{ slug, title, originalUrl }` for unresolved images |

### New components needed

Two Astro components need to be created (modeled on existing `SpotifyEmbed.astro`):
- `src/components/ui/content/YouTubeEmbed/YouTubeEmbed.astro`
- `src/components/ui/content/SoundCloudEmbed/SoundCloudEmbed.astro`

Both use privacy-enhanced / lite embeds and accept a single `url` prop.

### Collections not touched

- `src/content/podcasts/` — Theme Songs episodes stay as-is
- `src/content/music/` — Mixtapes stay as-is
- `src/content/commonplace/` — Tumblr content stays as-is

### Post-migration manual steps

1. **Pressbooks post** — 9 PNGs already in `src/assets/blog/` are safe; script may regenerate the Markdown but the image copy step is idempotent. Verify the post renders correctly after migration.
2. **Missing media report** — work through `scripts/missing-media-report.json` to manually source unresolved featured images.
3. **Verify build** — run `pnpm build` and check for errors.

---

## Category → Collection Mapping

| WordPress Category | Target | Notes |
|---|---|---|
| Blog | `blog` | tag omitted (too generic) |
| Education Technology | `blog` | tag: `education-technology` |
| Favorite People | `blog` | tag: `favorite-people` |
| Lessons from Oppen's Letters | `blog` | tag: `lessons-from-oppens-letters` |
| Memory Collector Project | `blog` | tag: `memory-collector-project` |
| Mission Stories | `blog` | tag: `mission-stories` |
| The Objectivists | `blog` | tag: `the-objectivists` |
| Visualizing Data | `blog` | tag: `visualizing-data` |
| What I'm Reading | `blog` | tag: `reading` |
| Reading Notes | `blog` | tag: `reading-notes` |
| Wedding Planning | `blog` | tag: `wedding-planning` |
| Mix Tapes | **excluded** | handled in music collection |
| Radio Shows | **excluded** | handled in music/podcasts |
| Spotify Playlists | **excluded** | handled in music collection |
| from tumblr | **excluded** | handled in commonplace collection |
| What I'm Listening To | **excluded** | handled elsewhere |

---

## Missing Media Report Format

```json
[
  {
    "slug": "on-earth-day",
    "title": "On Earth Day",
    "type": "featured-image",
    "originalUrl": "https://steelwagstaff.files.wordpress.com/2011/04/gaylord_nelson.jpg"
  },
  {
    "slug": "some-post",
    "title": "Some Post",
    "type": "inline-image",
    "originalUrl": "https://steelwagstaff.files.wordpress.com/2013/06/photo.jpg"
  }
]
```
