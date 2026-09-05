# Section-Local Taxonomy Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make blog tags and radio/podcast tags and named groupings link to statically generated, section-local topic pages rendered with the existing listing-grid visual language.

**Architecture:** Add a pure taxonomy utility module for slugging, descriptors, and collection-entry matching. Extract the repeated radio/podcast card into a reusable `MediaCard`, use it from the main radio page and a new radio topic route, and reuse the existing blog listing filter through stable `?tag=` links. Link existing badges, tags, series labels, and grouping headings to the appropriate section-local destination.

**Tech Stack:** Astro 7 content collections, TypeScript, Astro components, Vitest, ESLint, Tailwind utility classes.

**Spec:** `docs/superpowers/specs/2026-09-05-taxonomy-pages-design.md`

## Global Constraints

- Taxonomy pages remain section-local: blog results never include radio/music/podcast entries, and radio results never include blog posts.
- Only published English entries participate in generated topic pages.
- Explicit tag matching is case-insensitive after the shared slug normalization function.
- Named radio/podcast grouping rules must match the existing `radio-podcasts.astro` filters.
- Topic pages must reuse `BlogCard` or the shared media-card component rather than duplicating card markup.
- Do not add new dependencies or commit changes.

---

### Task 1: Add taxonomy utility contracts and tests

**Files:**
- Create: `src/lib/taxonomy.ts`
- Create: `src/__tests__/taxonomy.test.ts`

**Interfaces:**
- `slugifyTaxonomyLabel(label: string): string`
- `type TaxonomyDescriptor = { slug: string; label: string; description: string; section: 'blog' | 'radio'; kind: 'tag' | 'grouping' }`
- `getRadioTaxonomies(music, podcasts): TaxonomyDescriptor[]`
- `matchesRadioTaxonomy(entry, taxonomy): boolean`

- [ ] **Step 1: Write failing unit tests**

Cover:

```ts
expect(slugifyTaxonomyLabel("What's New?")).toBe('whats-new');
expect(slugifyTaxonomyLabel("Steel's Magnolias")).toBe('steels-magnolias');
```

Add tests that radio tag descriptors are deduplicated by slug while preserving their first display label, matching ignores case and punctuation differences through slugs, `mixtapes` matches music entries with the `mixtape` tag, `playlists` excludes shows and mixtapes, and each podcast series grouping matches only its named series.

Use small object fixtures with only the `id` and `data` fields consumed by the predicates; do not mock Astro.

- [ ] **Step 2: Run the focused test and confirm failure**

Run:

```bash
pnpm test src/__tests__/taxonomy.test.ts --run
```

Expected: failure because `src/lib/taxonomy.ts` does not exist yet.

- [ ] **Step 3: Implement the pure utility module**

Implement slug normalization by lowercasing, replacing runs of non-alphanumeric characters with one dash, trimming dashes, and returning an empty string for an empty label. Build radio descriptors from published-entry data supplied by callers; keep collection loading and Astro rendering out of this module. Add fixed grouping descriptors with labels and descriptions, and use collection-aware predicates for music versus podcast entries.

- [ ] **Step 4: Run focused tests to verify the utility contract**

Run the same Vitest command and expect all taxonomy tests to pass.

---

### Task 2: Extract the shared radio/podcast media card

**Files:**
- Create: `src/components/radio/MediaCard.astro`
- Modify: `src/pages/radio-podcasts.astro`
- Modify: `src/components/ui/data-display/DateMeta.astro` only if the extracted card needs an existing date-prop adjustment

**Interfaces:**
- `MediaCard` props: `title: string`, `href: string`, `publishedAt: Date`, `description?: string`, `image?: string`, `imageAlt?: string`, `tags?: string[]`, `groupLabel?: string`, `groupSlug?: string`, `episode?: number`
- Produces the existing responsive card markup with image handling, title, optional description, date metadata, episode number, optional clickable grouping label, and clickable radio/podcast tags.

- [ ] **Step 1: Extract the existing card markup without changing output**

Move the repeated card structure from the five map blocks in `radio-podcasts.astro` into `MediaCard`. Keep `resolveMusicImage` inside the component so both music and podcast entries can pass their source image string. Preserve the current classes, image behavior, href conventions, episode text, and tag badge styling.

- [ ] **Step 2: Replace all five inline card maps with `MediaCard` calls**

Pass the correct destination for playlists/mixtapes/Steel's Magnolias and podcast series, plus the matching named grouping slug. Keep the existing six-item limits and “See All” links unchanged.

- [ ] **Step 3: Add visible grouping links and tag links**

Turn each radio section heading into a link to its topic slug. Render card tags as links to `/radio-podcasts/topics/[slug]`; render podcast series labels as links when present. Ensure nested links are not introduced inside a card anchor: the card should either remain a single anchor with non-nested metadata links removed, or use a non-anchor card shell with separate title/image and metadata anchors.

Use a non-anchor `<article>` card shell with separate anchors for the image/title, grouping label, and tags. This keeps every taxonomy link valid and keyboard accessible.

- [ ] **Step 4: Run Astro diagnostics on the extracted component and page**

Run:

```bash
pnpm exec eslint src/components/radio/MediaCard.astro src/pages/radio-podcasts.astro
```

Also run `get_errors` on both files and correct any prop or Astro template errors before continuing.

---

### Task 3: Make blog taxonomy links drive the existing filter

**Files:**
- Modify: `src/pages/blog/index.astro`
- Modify: `src/components/blog/BlogCard.astro`
- Modify: `src/components/blog/ArticleHero.astro`

**Interfaces:**
- Blog tag links use `/blog?tag=${slugifyTaxonomyLabel(tag)}`.
- The existing dropdown options and each `.post-card` `data-tags` value use normalized slugs.

- [ ] **Step 1: Normalize filter values**

Import `slugifyTaxonomyLabel` into `blog/index.astro`. Build `tagCounts` keyed by normalized slug while retaining the original label for display, render each option with the normalized slug as its value, and serialize normalized tag slugs into each card's `data-tags` attribute.

- [ ] **Step 2: Apply query-parameter filtering on page load**

Read `new URLSearchParams(window.location.search).get('tag')` in `initTagFilter`. Set the select value only when it matches an option, then run the same filtering function used by the `change` event. Keep the existing all-posts behavior when no valid tag is supplied.

- [ ] **Step 3: Link blog tags**

Update `BlogCard` and `ArticleHero` tag rendering to use `/blog?tag=${slugifyTaxonomyLabel(tag)}` while retaining the existing badge appearance. Confirm tag anchors remain keyboard accessible and do not create nested links in `BlogCard`; use the same non-anchor card shell planned for `MediaCard` if needed.

- [ ] **Step 4: Validate the blog route and consumers**

Run:
pnpm exec eslint src/pages/blog/index.astro src/components/blog/BlogCard.astro src/components/blog/ArticleHero.astro
```bash
pnpm exec eslint src/pages/blog/topics/[slug].astro src/pages/blog/index.astro src/components/blog/BlogCard.astro src/components/blog/ArticleHero.astro

Quote the bracketed route path in shells that use zsh glob expansion.

---

### Task 4: Add the radio/podcast topic route

**Files:**
- Create: `src/pages/radio-podcasts/topics/[slug].astro`
- Modify: `src/components/radio/MediaCard.astro` if the topic route needs a display-only variant

**Interfaces:**
- `getStaticPaths()` loads published English `music` and `podcasts` entries, calls `getRadioTaxonomies`, filters each taxonomy’s matching entries, and returns `{ params: { slug }, props: { taxonomy, entries } }`.
- The route renders `PageLayout`, a section-specific topic heading/description, and a responsive `MediaCard` grid.

- [ ] **Step 1: Generate static topic paths**

Combine explicit tag descriptors and named grouping descriptors, deduplicate by slug, and generate only descriptors with at least one matching result. Keep music and podcast entries distinguishable while passing the shared `MediaCard` interface.

- [ ] **Step 2: Resolve and render topic results**

Resolve the slug from `Astro.params`, filter the combined entries using `matchesRadioTaxonomy`, sort by descending `publishedAt`, and render each result with its correct `/music/...` or `/podcasts/...` URL, image, tags, episode number, and grouping label.

- [ ] **Step 3: Add unknown-slug handling and metadata**

Rely on Astro’s normal generated-route 404 for a slug not present in `getStaticPaths()`. Set the page title to the taxonomy label and the description to the taxonomy descriptor description.

- [ ] **Step 4: Validate the route**

Run:

```bash
pnpm exec eslint src/pages/radio-podcasts/topics/[slug].astro src/components/radio/MediaCard.astro
pnpm test src/__tests__/taxonomy.test.ts --run
```

---

### Task 5: Full verification and regression pass

**Files:**
- Test: `src/__tests__/taxonomy.test.ts`
- Test: `src/__tests__/utils.test.ts`
- Verify: all files changed by Tasks 1-4

- [ ] **Step 1: Run all unit tests**

```bash
pnpm test --run
```

Expected: all test files pass, including taxonomy, reading-time, contact, newsletter, and WordPress transform tests.

- [ ] **Step 2: Run lint on the complete changed-file set**

```bash
pnpm exec eslint src/lib/taxonomy.ts src/components/radio/MediaCard.astro src/pages/radio-podcasts.astro src/pages/blog/topics/[slug].astro src/pages/radio-podcasts/topics/[slug].astro src/pages/blog/index.astro src/components/blog/BlogCard.astro src/components/blog/ArticleHero.astro src/__tests__/taxonomy.test.ts
```

Quote dynamic route paths when invoking from zsh.

- [ ] **Step 3: Run Astro type checking**

```bash
pnpm check
```

Record any unrelated existing diagnostics separately; no new errors should appear in the taxonomy utilities, routes, cards, or link consumers.

- [ ] **Step 4: Check diff hygiene**

```bash
git diff --check
```
