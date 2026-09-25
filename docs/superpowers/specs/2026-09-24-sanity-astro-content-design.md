# Sanity + Astro Content Design

## Status

Draft for review.

## Goal

Add Sanity as an additive headless CMS for blog posts and commonplace entries while preserving the existing Markdown-based archive and static Cloudflare deployment.

Sanity Studio will run locally inside this repository at `/studio`. Sanity content will be queried during the Astro build and merged with local content. Existing Markdown content remains valid and continues to render without migration.

## Decisions

- Sanity Studio is embedded in this Astro repository.
- The first Sanity-managed document types are `post` and `commonplaceEntry`.
- Sanity documents are additive; they do not replace or overwrite local collections.
- Content is fetched at build time with `useCdn: false` so Cloudflare builds use current published content.
- The site remains static. Studio uses hash routing so it can be prerendered without an Astro server adapter.
- Presentation Tool, draft preview, Stega encoding, and live visual editing are out of scope for the first implementation. They require server rendering and a viewer token, which would change the deployment model.
- Sanity-hosted image assets use Sanity's image CDN. Existing local and `public/blog-media` assets remain unchanged.

## Existing System Constraints

- Blog Markdown is loaded from `src/content/blog` through Astro Content Layer.
- Commonplace Markdown is loaded from `src/content/commonplace`.
- Blog routes currently use `src/pages/blog/[...slug].astro` and filter English, non-draft entries.
- Commonplace is rendered as a paginated archive rather than individual detail routes.
- Cloudflare deploys the generated `dist` directory as a static site.
- Existing media URLs use `/blog-media/...`; Sanity media must not collide with the `/blog` route namespace.

## Sanity Integration

Add the official `@sanity/astro` integration and the Sanity packages required by the guide:

- `@sanity/astro`
- `sanity`
- `@sanity/image-url`
- `@portabletext/types`
- `astro-portabletext`

Configure the integration in `astro.config.mjs` with:

- `projectId: PUBLIC_SANITY_PROJECT_ID`
- `dataset: PUBLIC_SANITY_DATASET`
- `apiVersion` pinned to the implementation date
- `useCdn: false`
- `studioBasePath: '/studio'`
- hash-based Studio routing for static output

Add public, non-secret environment variables to `.env.example` and Astro's environment schema where appropriate. The actual `.env` file remains untracked.

Create `sanity.config.ts` at the repository root using `structureTool()` and the local schema definitions. The Studio is intended for local use and does not need a separate deployment in this phase.

## Sanity Schemas

### `post`

Fields:

- `title`: string, required
- `slug`: slug, generated from title, required and unique by convention
- `description`: text, optional
- `publishedAt`: datetime, required
- `author`: string, optional initially
- `tags`: array of strings
- `image`: Sanity image with hotspot and alt text
- `body`: shared Portable Text field
- `draft`: boolean, default false
- `locale`: string, default `en`

The schema should support the existing blog presentation without requiring authors, categories, or other relational documents in the first pass.

### `commonplaceEntry`

Fields:

- `title`: string, optional
- `type`: enum: `text`, `photo`, `video`, or `audio`
- `publishedAt`: datetime, required
- `tags`: array of strings
- `content`: shared Portable Text field, optional
- `image`: Sanity image with alt text, optional
- `videoUrl`: URL, optional
- `audioUrl`: URL, optional
- `source`: string or URL, optional
- `draft`: boolean, default false
- `locale`: string, default `en`

The document should match the current commonplace archive's display model rather than introduce individual commonplace routes.

### Shared Portable Text

Define a reusable `blockContent` type with:

- normal text
- headings through `h4`
- block quotes
- bullet and numbered lists
- strong, emphasis, code, and links
- inline images with alt text

Custom marks and blocks should remain deliberately small in the first phase. YouTube, Vimeo, Spotify, and legacy shortcode behavior remain concerns for existing Markdown content; Sanity-specific embeds can be added after the basic integration is stable.

## Astro Data Layer

Create `src/sanity/lib/load-query.ts` as a typed wrapper around `sanity:client`. It should expose build-time GROQ queries and return typed data with predictable error behavior.

Create query modules for:

- published English Sanity posts
- a Sanity post by slug
- published English commonplace entries

All queries must exclude drafts unless a future preview mode explicitly opts into drafts.

Create normalization functions that map Sanity documents into view models used by the existing layouts. The normalization boundary should handle:

- Sanity image URL construction
- missing optional metadata
- Sanity Portable Text body values
- slug and route generation
- date conversion
- type-specific commonplace media fields

Local Markdown collection entries should be normalized into the same view-model shapes where practical. The merge should use a source discriminator such as `source: 'local' | 'sanity'` and stable IDs to avoid accidental collisions.

## Routing and Rendering

### Blog

Extend the existing blog route's static paths to include:

- local Markdown blog entries
- published Sanity `post` documents

Sanity posts use their Sanity slug at `/blog/{slug}/`. If a Sanity slug matches a local Markdown slug, local content wins and the build emits a clear collision warning; Sanity content is skipped for that route until the collision is resolved.

Render Sanity posts through the existing `BlogLayout`, using a shared body renderer that chooses Markdown `Content` for local entries and Portable Text for Sanity entries.

### Commonplace

Extend the existing archive queries to merge local commonplace entries with published Sanity `commonplaceEntry` documents before sorting, filtering, and pagination. Sanity entries should use a stable synthetic ID and must not require a new detail route.

Use the existing `CommonplaceArchive` display rules:

- `photo` uses the Sanity image CDN URL
- `video` uses the existing iframe path
- `audio` uses the existing audio control
- `text` and all optional body content use Portable Text rendering or a plain-text preview derived from it

### Images

Create `src/sanity/lib/url-for-image.ts` using `@sanity/image-url`. Sanity images should request responsive dimensions and modern formats where the component supports them. Do not copy Sanity assets into `public/blog-media`.

Create or extend an Astro Portable Text component with an image renderer that uses the Sanity image builder and preserves alt text.

## Build and Deployment

The build remains static:

1. Astro loads local collections.
2. Sanity queries fetch published documents.
3. Routes and archives merge both sources.
4. Astro emits the static site to `dist`.
5. Cloudflare serves `dist` as before.

The existing local blog media sync and optimization scripts remain independent of Sanity assets. Sanity CDN images must not enter the local Sharp optimization pipeline.

Required environment variables:

- `PUBLIC_SANITY_PROJECT_ID`
- `PUBLIC_SANITY_DATASET`

No Sanity read token is required while draft preview and Presentation Tool are disabled.

## Testing and Validation

Add focused tests for:

- Sanity-to-view-model normalization
- published/draft filtering
- local/Sanity blog slug collision handling
- merging and sorting commonplace entries
- Sanity image URL construction

Validation commands:

- `pnpm check`
- `pnpm test`
- `pnpm build`

Build acceptance criteria:

- Existing local blog routes remain unchanged.
- Existing commonplace pagination and type filters remain functional.
- A published Sanity post renders at `/blog/{slug}/`.
- A published Sanity commonplace entry appears in the correct archive/type filter.
- Draft Sanity documents do not appear in the static build.
- `/studio` is available during local development and does not require an Astro server adapter.
- Cloudflare remains able to deploy the static `dist` output.

## Explicitly Out Of Scope

- Migrating the existing Markdown archive into Sanity
- Importing all historical content automatically
- Deploying the Studio separately
- Presentation Tool, live preview, draft mode, or Stega visual editing
- Sanity webhooks and automatic Cloudflare rebuild triggers
- Replacing the existing local media pipeline
- Building custom Sanity plugins or editorial workflows

## Follow-up Options

After the additive integration is stable:

1. Add a migration script for selected Markdown posts.
2. Add Sanity webhooks to trigger Cloudflare builds after publishing.
3. Add a preview deployment and Presentation Tool if server rendering becomes worthwhile.
4. Add richer Portable Text blocks for YouTube, audio, and legacy media embeds.
