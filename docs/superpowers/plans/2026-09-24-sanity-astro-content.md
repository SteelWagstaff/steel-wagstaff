# Sanity + Astro Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local Sanity Studio and merge build-time Sanity blog/commonplace content with the existing Markdown archive while preserving the static Cloudflare deployment.

**Architecture:** Use `@sanity/astro` with hash-based Studio routing at `/studio` and `useCdn: false`. Query published Sanity documents during the Astro build, normalize them into shared blog/commonplace view models, and merge them with the existing Astro content collections. Keep Presentation Tool, draft preview, webhooks, and content migration out of this first delivery.

**Tech Stack:** Astro 7, `@sanity/astro`, Sanity Studio, GROQ, Portable Text, TypeScript, Zod, Vitest, Cloudflare static assets.

**Spec:** `docs/superpowers/specs/2026-09-24-sanity-astro-content-design.md`

## Global Constraints

- Sanity content is additive; existing Markdown entries remain the source for the current archive.
- The site remains a static Cloudflare build; do not add a server adapter.
- Studio uses hash routing and is available locally at `/studio`.
- Published Sanity content uses `useCdn: false` during builds.
- Draft Sanity documents must not appear in the static build.
- Sanity CDN assets must not be copied into or processed by the local Sharp media pipeline.
- Do not enable Presentation Tool, Stega, viewer tokens, webhooks, or automatic content migration in this phase.
- Do not commit generated `.env` secrets or Sanity project credentials.

## Review Focus

- Missing Sanity environment variables must produce a clear build-time configuration error, not an opaque GROQ failure; test in the Sanity client/config task.
- A Sanity post slug colliding with a local Markdown slug must leave the local route authoritative and emit a deterministic warning; test in the merge task.
- Draft and non-English Sanity documents must be excluded exactly like local draft/non-English entries; test in query/normalization task.
- Sanity posts with missing optional image, description, author, or tags must still render valid blog output; test in normalization task.
- Commonplace entries with each of the four media types and absent optional fields must sort, filter, and preview without throwing; test in commonplace merge task.

---

### Task 1: Add Sanity dependencies and static Studio configuration

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `astro.config.mjs`
- Modify: `src/env.d.ts`
- Modify: `src/content.config.ts` only if the environment schema needs the public Sanity fields
- Create: `sanity.config.ts`
- Create: `src/sanity/schemaTypes/index.ts`
- Create: `src/sanity/schemaTypes/post.ts`
- Create: `src/sanity/schemaTypes/commonplaceEntry.ts`
- Create: `src/sanity/schemaTypes/blockContent.ts`
- Create: `.env.example` entries if the repository provides that file

**Interfaces:**
- Produces `PUBLIC_SANITY_PROJECT_ID` and `PUBLIC_SANITY_DATASET` configuration.
- Produces a local Sanity Studio at `/studio` using hash routing.
- Produces an exported schema containing `post`, `commonplaceEntry`, and `blockContent`.

- [ ] **Step 1: Add the official dependencies**

Run:

```bash
pnpm add @sanity/astro sanity @sanity/image-url astro-portabletext @portabletext/types
```

Keep the existing React integration; the embedded Studio requires it.

- [ ] **Step 2: Add Sanity environment declarations**

Add the Sanity Astro module reference to `src/env.d.ts` and add the two public variables to the repository’s environment documentation/schema without placing actual credentials in git:

```ts
/// <reference types="@sanity/astro/module" />
```

- [ ] **Step 3: Configure the integration**

Add the Sanity integration to `astro.config.mjs` with the project ID and dataset read from the public build environment, `useCdn: false`, the current API version, `studioBasePath: '/studio'`, and static-safe hash routing.

- [ ] **Step 4: Create the Studio config and schema exports**

Create `sanity.config.ts` using `defineConfig` and `structureTool()`. Import the schema from `src/sanity/schemaTypes/index.ts`.

- [ ] **Step 5: Run the focused configuration check**

Run:

```bash
pnpm check
```

Expected: the existing Astro project type-checks, and missing Sanity values are reported with a targeted configuration message rather than a missing-module error.

---

### Task 2: Define Sanity schemas and Portable Text support

**Files:**
- Create: `src/sanity/schemaTypes/blockContent.ts`
- Create: `src/sanity/schemaTypes/post.ts`
- Create: `src/sanity/schemaTypes/commonplaceEntry.ts`
- Modify: `src/sanity/schemaTypes/index.ts`
- Test: `src/__tests__/sanity-schema.test.ts`

**Interfaces:**
- `post` contains title, slug, description, publishedAt, author, tags, image, imageAlt, body, draft, and locale.
- `commonplaceEntry` contains title, type, publishedAt, tags, content, image, imageAlt, videoUrl, audioUrl, source, draft, and locale.
- `blockContent` supports normal text, headings through h4, block quotes, bullet/numbered lists, emphasis, strong, code, links, and inline images.

- [ ] **Step 1: Write schema contract tests**

Test that the exported schema contains exactly the required document type names and that the commonplace type enum includes `text`, `photo`, `video`, and `audio`.

- [ ] **Step 2: Run the schema tests and confirm the initial failure**

Run:

```bash
pnpm vitest run src/__tests__/sanity-schema.test.ts
```

Expected: failure until the schema exports are present.

- [ ] **Step 3: Implement the schemas**

Use Sanity `defineType`, `defineField`, and `defineArrayMember`. Keep the first schema deliberately compatible with the existing view models rather than introducing author/category reference documents.

- [ ] **Step 4: Run the schema tests**

Run the same Vitest command. Expected: PASS.

---

### Task 3: Add typed Sanity queries, image URLs, and normalization

**Files:**
- Create: `src/sanity/lib/load-query.ts`
- Create: `src/sanity/lib/queries.ts`
- Create: `src/sanity/lib/url-for-image.ts`
- Create: `src/sanity/lib/types.ts`
- Create: `src/sanity/lib/normalize.ts`
- Test: `src/__tests__/sanity-normalize.test.ts`

**Interfaces:**

```ts
export type SanityPost = {
  _id: string;
  title: string;
  slug: { current: string };
  description?: string;
  publishedAt: string;
  author?: string;
  tags?: string[];
  image?: SanityImage;
  imageAlt?: string;
  body?: PortableTextBlock[];
  locale?: string;
  draft?: boolean;
};

export type SanityCommonplaceEntry = {
  _id: string;
  title?: string;
  type: 'text' | 'photo' | 'video' | 'audio';
  publishedAt: string;
  tags?: string[];
  content?: PortableTextBlock[];
  image?: SanityImage;
  imageAlt?: string;
  videoUrl?: string;
  audioUrl?: string;
  source?: string;
  locale?: string;
  draft?: boolean;
};

export function normalizeSanityPost(post: SanityPost): NormalizedBlogEntry;
export function normalizeSanityCommonplace(entry: SanityCommonplaceEntry): NormalizedCommonplaceEntry;
```

- [ ] **Step 1: Write normalization tests**

Cover complete posts, missing optional post fields, non-English/draft filtering inputs, each commonplace media type, and Sanity image URL construction.

- [ ] **Step 2: Run the tests and confirm the expected failure**

Run:

```bash
pnpm vitest run src/__tests__/sanity-normalize.test.ts
```

- [ ] **Step 3: Implement the typed query wrapper and GROQ queries**

Use the guide’s `sanity:client` import. Queries must explicitly filter `!coalesce(draft, false)` and `locale == 'en'`, and return stable fields needed by the normalizers.

- [ ] **Step 4: Implement Sanity image URL construction**

Use `createImageUrlBuilder(sanityClient)` and expose `urlForImage(source)`. Return a URL suitable for the existing Astro image display components without copying the asset locally.

- [ ] **Step 5: Implement the normalizers**

Normalize dates to `Date`, default optional arrays, preserve stable Sanity IDs, and map image references to Sanity CDN URLs. Do not render Portable Text in this task; retain the body/content value for the rendering task.

- [ ] **Step 6: Run the normalization tests**

Expected: PASS.

---

### Task 4: Merge Sanity posts into blog routing

**Files:**
- Modify: `src/pages/blog/[...slug].astro`
- Modify: `src/pages/blog/index.astro`
- Modify: `src/components/blog/RelatedPosts.astro`
- Create or modify: `src/lib/blog-content.ts`
- Test: `src/__tests__/blog-content.test.ts`

**Interfaces:**

```ts
export async function getMergedBlogEntries(): Promise<NormalizedBlogEntry[]>;
export function mergeBlogEntries(local: NormalizedBlogEntry[], sanity: NormalizedBlogEntry[]): NormalizedBlogEntry[];
```

- [ ] **Step 1: Write merge tests**

Test local entries plus Sanity entries, local-wins slug collisions, draft/non-English exclusion, descending publication order, and stable IDs.

- [ ] **Step 2: Run the merge tests and confirm failure**

Run:

```bash
pnpm vitest run src/__tests__/blog-content.test.ts
```

- [ ] **Step 3: Implement the merged blog data module**

Load the local blog collection and Sanity post query, normalize both sources, and merge them. Emit `console.warn` with both source IDs when a Sanity slug collides with a local slug.

- [ ] **Step 4: Update blog index and related-post queries**

Use the merged data module for archive cards and related posts while preserving existing filters, tags, dates, and layout props.

- [ ] **Step 5: Update the blog route**

Generate static paths from merged entries. Render local Markdown bodies with Astro Content `render`; render Sanity bodies through the Portable Text component from Task 6.

- [ ] **Step 6: Run tests and the focused type check**

Run:

```bash
pnpm vitest run src/__tests__/blog-content.test.ts
pnpm check
```

Expected: PASS with no new diagnostics.

---

### Task 5: Merge Sanity commonplace entries into the archive

**Files:**
- Create or modify: `src/lib/commonplace-content.ts`
- Modify: `src/pages/commonplace.astro`
- Modify: `src/pages/commonplace/page/[page].astro`
- Modify: `src/pages/commonplace/type/[type]/[page].astro`
- Modify: `src/components/commonplace/CommonplaceArchive.astro`
- Test: `src/__tests__/commonplace-content.test.ts`

**Interfaces:**

```ts
export async function getMergedCommonplaceEntries(): Promise<NormalizedCommonplaceEntry[]>;
export function mergeCommonplaceEntries(local: NormalizedCommonplaceEntry[], sanity: NormalizedCommonplaceEntry[]): NormalizedCommonplaceEntry[];
```

- [ ] **Step 1: Write archive merge tests**

Test all four types, missing optional fields, descending date order, type filtering, page slicing, and the local/Sanity stable ID distinction.

- [ ] **Step 2: Run the tests and confirm failure**

Run:

```bash
pnpm vitest run src/__tests__/commonplace-content.test.ts
```

- [ ] **Step 3: Implement the merged commonplace data module**

Load and normalize local entries and published Sanity entries, merge them, and sort by `publishedAt` descending before the page/type helpers consume them.

- [ ] **Step 4: Update all commonplace routes**

Replace direct `getCollection('commonplace')` calls with `getMergedCommonplaceEntries()` while preserving pagination and type-filter semantics.

- [ ] **Step 5: Run tests and type checking**

Run:

```bash
pnpm vitest run src/__tests__/commonplace-content.test.ts
pnpm check
```

Expected: PASS.

---

### Task 6: Render Sanity Portable Text and images

**Files:**
- Create: `src/components/sanity/PortableText.astro`
- Create: `src/components/sanity/PortableTextImage.astro`
- Modify: `src/pages/blog/[...slug].astro`
- Modify: `src/components/commonplace/CommonplaceArchive.astro`
- Test: `src/__tests__/portable-text.test.ts`

**Interfaces:**

```astro
<PortableText value={portableText} />
```

- [ ] **Step 1: Write rendering tests**

Test headings, paragraphs, block quotes, ordered/unordered lists, links, and inline Sanity images. Include an empty body case that renders no invalid markup.

- [ ] **Step 2: Run the tests and confirm failure**

Run:

```bash
pnpm vitest run src/__tests__/portable-text.test.ts
```

- [ ] **Step 3: Implement the Portable Text wrapper**

Use `astro-portabletext` and register the custom image component. Keep typography classes consistent with the existing `.prose` surface.

- [ ] **Step 4: Implement Sanity image rendering**

Use `urlForImage` to emit responsive Sanity CDN URLs with alt text and `loading` behavior appropriate to the context.

- [ ] **Step 5: Connect rendering to blog and commonplace views**

Select Markdown Content or Portable Text based on the normalized `source` field. Preserve existing local rendering unchanged.

- [ ] **Step 6: Run rendering tests**

Expected: PASS.

---

### Task 7: End-to-end static Studio and build validation

**Files:**
- Modify: `README.md`
- Modify: `.env.example` if present
- Test: `src/__tests__/e2e/sanity-content.spec.ts` if the existing Playwright setup supports configured Sanity content

- [ ] **Step 1: Document local Sanity setup**

Document the guide-aligned commands:

```bash
pnpm dlx sanity@latest init --env .env
pnpm dev
```

Document the required CORS origin `http://localhost:4321`, local Studio URL `/studio`, and the two public environment variables. Do not document or commit tokens because preview is out of scope.

- [ ] **Step 2: Add one Sanity fixture or test query strategy**

Use a deterministic mocked query response for automated tests; do not make the test suite depend on a live Sanity project.

- [ ] **Step 3: Run the complete validation suite**

Run:

```bash
pnpm test
pnpm check
pnpm build
```

Expected:

- all tests pass
- Astro reports zero errors, warnings, and hints
- static build completes successfully
- existing local blog/commonplace routes remain present
- Sanity routes compile when the public project configuration is provided
- `/studio` is emitted using hash routing

- [ ] **Step 4: Review the generated build artifacts**

Confirm Sanity CDN URLs are present only for Sanity content, local `/blog-media/...` URLs remain intact, and no Sanity assets were copied into the local Sharp output tree.
