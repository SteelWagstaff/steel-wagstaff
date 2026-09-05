# Section-Local Taxonomy Pages

## Goal

Make blog tags and radio/podcast metadata clickable, with section-local topic pages that render all matching entries in responsive grids consistent with the existing listing pages.

## Scope

Taxonomy pages remain within their content section:

- Blog taxonomy links reuse the existing blog listing and filter posts with a `tag` query parameter.
- Radio/podcast taxonomy pages contain music and podcast entries only.

The first implementation supports explicit tags and the named radio/podcast groupings already represented by the site navigation and listing page:

- Playlists
- Mixtapes
- Steel's Magnolias
- Off the Chain
- Theme Songs

No cross-section search or unified taxonomy index is included.

## Routes

### Blog

Blog tag links use `/blog?tag=[slug]` rather than a separate route. The existing client-side filter must read the query parameter on page load, select the matching tag, and apply the same grid filtering and result count used by the dropdown. The dropdown options and each card's serialized tag data use the shared slug normalization so links remain stable even when display labels contain spaces or punctuation.

### Radio + Podcasts

`/radio-podcasts/topics/[slug]` is generated for every non-empty explicit tag and every named grouping with at least one published English result across the `music` and `podcasts` collections.

The route resolves one topic descriptor containing:

- `slug`: URL-safe identifier
- `label`: display label
- `description`: concise section-specific topic description
- `matches(entry)`: collection-aware predicate

Explicit tags match `entry.data.tags` case-insensitively after normalization. Named groupings use the existing listing rules:

- `playlists`: music entries without `show-` in the id and without the `mixtape` tag
- `mixtapes`: music entries without `show-` in the id and with the `mixtape` tag
- `steel's-magnolias`: music entries with `show-` in the id
- `off-the-chain`: podcast entries with `data.podcast === 'Off the Chain'`
- `theme-songs`: podcast entries with `data.podcast === 'Theme Songs'`

Results are sorted newest first and rendered in a shared media-card grid. Unknown topic slugs should produce a normal Astro 404 response rather than an empty page.

## Clickable Metadata

- Blog tags in `BlogCard` and `ArticleHero` link to `/blog?tag=[slug]`.
- Music tags link to `/radio-podcasts/topics/[slug]`.
- Podcast tags and podcast-series badges link to `/radio-podcasts/topics/[slug]`.
- Radio page named grouping headings link to their corresponding topic pages.

Links preserve the existing badge styling and remain keyboard accessible. The current card and heading text remains visible; only the interaction target changes.

## Components and Data Boundaries

### Shared taxonomy utilities

Create a utility module responsible for deterministic slug creation and section-specific topic descriptors. It must expose typed functions for:

- converting a taxonomy label to a URL slug
- collecting radio/podcast tag and named-grouping descriptors
- testing whether a radio/podcast content entry matches a descriptor

The utility must not contain Astro rendering concerns.

### Shared media card

Extract the repeated music/podcast card markup from `radio-podcasts.astro` into a reusable Astro component. It accepts the entry title, description, published date, image, image alt text, destination URL, optional tags, and optional grouping label. It renders the existing responsive card visual treatment and uses the shared date metadata component.

Use this component for both the main radio/podcast listing page and the radio/podcast topic page. This prevents the topic grid from developing a separate visual language.

### Topic pages

The radio/podcast topic route loads its section collections, resolves the topic descriptor from `Astro.params.slug`, filters published English entries, and renders a heading plus the shared media-card component. Topic pages should not duplicate collection filtering rules or inline card markup. Blog filtering remains on the existing listing page.

## Accessibility and SEO

- Every taxonomy link has descriptive visible text.
- Date markup keeps semantic `<time datetime>` output.
- Topic pages use unique titles and descriptions based on the resolved label.
- Radio/podcast topic pages are statically generated for known topics.

## Validation

- Unit tests cover slug normalization, case-insensitive matching, named grouping predicates, and topic collection behavior.
- Astro type checking covers the new route props and shared card interfaces.
- Full Vitest suite and lint run after implementation.
- `git diff --check` must pass.
