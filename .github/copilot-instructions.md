---
name: astro-rocket
description: "Workspace-level instructions for Astro Rocket — a production-ready Astro 6 starter theme with 12 themes, 57+ components, dark mode, and built-in features like contact forms, blog, and SEO."
---

# Copilot Instructions for Astro Rocket

## Project Overview

Astro Rocket is a **production-ready Astro 6 starter theme** designed for web designers, developers, bloggers, and portfolio sites. Every page is pre-built and styled — you change the text and content, and your site is ready to launch.

Key characteristics:
- **57 components** across 7 categories (31 UI, 7 patterns, hero, layout, blog, landing, SEO)
- **12 colour themes** with live switching (no rebuilds needed)
- **3-state colour mode**: System/Light/Dark with OS-preference tracking
- **Perfect Lighthouse scores** (100/100/100/100 on mobile & desktop)
- **Built on Astro 6** with **Tailwind CSS v4** (OKLCH colors)
- **Type-safe** throughout with TypeScript strict mode
- **i18n-ready** with optional full internationalization support
- **Icon system** powered by **Iconify** (Lucide UI + Simple Icons)
- **Zero JavaScript by default** (islands architecture)

---

## Astro Framework & Architecture

### File Structure
- **Public assets**: `public/` (fonts, favicon, static OG images)
- **Pages & routes**: `src/pages/` (`.astro` files for routes, `api/` for endpoints)
- **Layouts**: `src/layouts/` (page structure templates)
- **Components**: `src/components/` organized by category (ui, patterns, layout, blog, landing, seo, hero)
- **Content collections**: `src/content/` (blog, projects, authors, faqs) with Zod validation
- **Styles**: `src/styles/` with design tokens (primitives, semantic, themes) and 12 colour theme files
- **Config**: `src/config/` (site.config.ts, nav.config.ts)
- **Utils**: `src/lib/` (shared utilities, schema validators, icon system)
- **Tests**: `src/__tests__/` (Vitest unit/integration tests, `e2e/` for Playwright E2E tests)

### Component System

#### UI Components (31 components)
Organized by function in `src/components/ui/`:

**Form** (`form/`): Button, Input, Textarea, Select, Checkbox, Radio, Switch — all with variants and state management
**Data Display** (`data-display/`): Card, Badge, Avatar, AvatarGroup, Table, Pagination, Progress, Skeleton
**Feedback** (`feedback/`): Alert, Toast, Tooltip
**Overlay** (`overlay/`): Dialog, Dropdown, Tabs, VerticalTabs, Accordion
**Layout** (`layout/`): Separator
**Primitives** (`primitives/`): Icon (powered by Iconify)
**Content** (`content/`): CodeBlock (syntax-highlighted)
**Marketing** (`marketing/`): Logo (auto-generated), CTA, NpmCopyButton, SocialProof, TerminalDemo (React)

All UI components use **class-variance-authority (CVA)** for type-safe variants and are exported via barrel exports from `@/components/ui`.

#### Pattern Components (7 components)
Pre-composed, reusable patterns in `src/components/patterns/`:
- ContactForm (with validation)
- NewsletterForm (email signup)
- FormField (wrapper)
- SearchInput (with icon)
- PasswordInput (visibility toggle)
- StatCard (statistics display)
- EmptyState (placeholder with action)

#### Other Components (19 components)
- **Hero** (1): Centered/split layouts, grid pattern, typing effect
- **Layout** (6): Header, Footer, ThemeModeDropdown, ThemeSelector, ThemeSelectorDropdown, Analytics
- **Blog** (4): ArticleHero, BlogCard, ShareButtons, RelatedPosts
- **Landing** (5): Credibility, LighthouseScores, TechStack, FeatureTabs, and more
- **SEO** (3): SEO, JsonLd, Breadcrumbs

### Component Patterns & Best Practices
- All components are Astro (`.astro`) with minimal or no client interactivity by default
- Use Astro's `<slot />` for flexible composition
- TypeScript for all prop interfaces and validation
- CSS modules or Tailwind utilities for styling
- Use `client:*` directives only when interactivity is absolutely needed
- Register components in `component-registry.json` for discovery and documentation

---

## Design System & Theming

### 12 Colour Themes
Themes are live-switchable via `ThemeSelectorDropdown` (header) and `ThemeSelector` (mobile menu). No rebuilds required. Themes: Orange, Amber, Lime, Emerald, Teal, Cyan, Sky, Blue (default), Indigo, Violet, Purple, Magenta.

Theme files live in `src/styles/themes/` — one CSS file per theme defining ~35 semantic tokens for both `:root` (light) and `.dark` (dark mode).

### 3-State Colour Mode System
- **System** (default): Tracks OS preference via `prefers-color-scheme`, live updates on OS change
- **Light**: Forces light mode
- **Dark**: Forces dark mode
- Persisted in `localStorage` under key `theme`
- Resolved appearance applied via `.dark` class on `<html>`
- Exposed as a pill-shaped dropdown (`ThemeModeDropdown`) in header and mobile menu

### Design Tokens (Three-Tier)
1. **Primitives** (`src/styles/tokens/primitives.css`): Raw color scales (gray, brand, status) using **OKLCH**
2. **Semantic** (`src/styles/themes/*.css`): Purpose-based mappings (background, foreground, border, interactive, status, etc.)
3. **Tailwind** (`src/styles/global.css`): `@theme` directives exposing tokens as utility classes

### Customizing Brand Colors
Edit `src/styles/tokens/primitives.css` and update `--brand-*` OKLCH values. Use [oklch.com](https://oklch.com/) to pick colors visually. OKLCH format: `oklch(lightness chroma hue)`.

### WCAG Contrast Requirements
Maintain these minimums when customizing:
- `--foreground`: 7:1 (WCAG AAA)
- `--foreground-secondary`: 7:1 (WCAG AAA)
- `--foreground-muted`: 4.5:1 (WCAG AA)
- `--foreground-subtle`: 4.5:1 (WCAG AA)
- Status foreground tokens: 4.5:1 (WCAG AA)

---

## Icon System

**Unified Icon component** (`src/components/ui/primitives/Icon/`) powered by **Iconify**:
- **Lucide UI icons** (350+): Use `lucide:icon-name` (e.g., `lucide:arrow-right`, `lucide:mail`)
- **Simple Icons brand icons** (3000+): Use `simple-icons:name` (e.g., `simple-icons:github`, `simple-icons:vercel`)
- **Shorthand names**: `github`, `x-twitter`, `brand-astro`, `brand-tailwind` (automatically mapped to Simple Icons)
- **Five size variants**: `xs`, `sm`, `md`, `lg`, `xl`
- Supports both Astro and React components

---

## Content Management & Collections

### Blog Posts
Create posts in `src/content/blog/[locale]/` (e.g., `en/`, `es/`, `fr/` for i18n):

```markdown
---
title: "Your Post Title"
description: "Brief description for SEO"
publishedAt: 2026-01-30
author: "Author Name"
tags: ["astro", "tutorial"]
locale: en
draft: false
toc: true            # Optional: Enable table of contents
comments: true       # Optional: Enable Giscus comments
---

Your content here...
```

**Required fields**: title, description, publishedAt (ISO 8601), author, locale
**Optional fields**: draft, toc, comments, tags

### Content Collections
Defined in `src/content/config.ts` with Zod schemas:
- **blog**: Blog posts organized by locale
- **projects**: Portfolio project pages
- **authors**: Author metadata and bios
- **faqs**: FAQ entries

### Querying Content

```ts
---
import { getCollection } from 'astro:content';

// Get all blog posts, excluding drafts in production
const posts = await getCollection('blog', ({ data }) => {
  return import.meta.env.PROD ? !data.draft : true;
});
---
```

### Table of Contents (Blog)
Auto-generated from MDX headings with three layout options:
- **inline card**: Displays below the article hero
- **sidebar**: Sticky on desktop (xl+)
- **auto**: Sidebar on xl+, inline card below on smaller screens
- Default: off (disable per-post via `toc: false` in frontmatter)
- Includes IntersectionObserver scroll-spy

### Blog Comments (Giscus)
Optional GitHub Discussions comments at bottom of posts:
- Lazy-loaded (zero cost for non-scrollers)
- Reserved min-height prevents CLS
- Default: off (enable per-post via `comments: true` in frontmatter)

---

## TypeScript Configuration & Quality

### Type Safety
- `tsconfig.json` enforces strict mode — maintain full type coverage
- Use Zod for runtime schema validation (content, config, user input)
- All components have TypeScript prop interfaces with validation
- Use TypeScript `type` for type aliases, `interface` for extensible contracts

### Configuration Files
- **Site config**: `src/config/site.config.ts` — name, description, author, social links, analytics IDs
- **Navigation**: `src/config/nav.config.ts` — navItems, footerNavItems (independent footer nav), legalLinks
- All configs are type-safe and validated at runtime

### Environment Setup
- Use `.env` for sensitive data (see `.env.example`)
- Reference via `import.meta.env` in Astro and client code
- Optional: Analytics (GA_MEASUREMENT_ID, GTM_ID), Verification (GOOGLE_SITE_VERIFICATION, BING_SITE_VERIFICATION)

---

## Testing & Quality Standards

### Test Structure
- Unit & integration tests in `src/__tests__/` (Vitest)
- E2E tests in `src/__tests__/e2e/` (Playwright)
- Test contact forms, newsletter signup, data validation
- Example tests: `contact.test.ts`, `newsletter.test.ts`

### Commands
- `pnpm test` — Run Vitest unit/integration tests
- `pnpm test:e2e` — Run Playwright E2E tests
- `pnpm lint` — ESLint code quality checks
- `pnpm lint:fix` — Auto-fix ESLint issues
- `pnpm format` — Format with Prettier
- `pnpm check` — Astro type checker

### Code Quality
- ESLint configured in `eslint.config.js`
- Prettier for code formatting (`.prettierrc`)
- Astro type checker via `pnpm check`
- Maintain full type coverage in strict mode

---

## Development Workflow

### Prerequisites
- Node.js 22.12.0+ (required for Astro 6)
- pnpm 9.x (recommended) or npm/yarn

### Dependencies
- **Build**: Astro 6, Vite
- **Styling**: Tailwind CSS v4, OKLCH color system
- **Testing**: Vitest, Playwright
- **Linting**: ESLint
- **Package manager**: pnpm

### Core Scripts
- `pnpm dev` — Start dev server (http://localhost:4321)
- `pnpm build` — Build for production (outputs to `dist/`)
- `pnpm preview` — Preview production build locally
- `pnpm test` — Run Vitest unit/integration tests
- `pnpm test:e2e` — Run Playwright E2E tests
- `pnpm lint` — Run ESLint
- `pnpm lint:fix` — Fix ESLint issues
- `pnpm format` — Format code with Prettier
- `pnpm check` — Run Astro type checker

### Deployment Options
- **Vercel** (recommended): Configured in `vercel.json`
- **Netlify**: Configured in `netlify.toml`
- **Cloudflare Pages**: Use `wrangler pages deploy dist`
- **Static**: `pnpm build` outputs to `dist/` for any static host

---

## API Routes

### Contact Form
**Endpoint**: `POST /api/contact`

Validates and processes contact form submissions:
- `name`: 2-100 chars
- `email`: Valid email
- `subject`: Required
- `message`: 10-5000 chars
- `honeypot`: Must be empty (spam check)

Response: `{ success: true }` or `{ success: false, errors: { field: ["message"] } }`

### Newsletter Signup
**Endpoint**: `POST /api/newsletter`

Handles email subscriptions:
- `email`: Valid email

Response: `{ success: true }` or `{ success: false, error: "message" }`

---

## Animations

Astro Rocket includes purposeful animations that respect `prefers-reduced-motion`:

### Page Transitions
Smooth transitions between pages via Astro View Transitions (no full reload)

### Scroll-Triggered Animations
- Counter animation on homepage stats (counts up over 1.2s when visible)
- Lighthouse score bars animate into place on scroll

### Scroll-Reactive Header
Header appearance changes at 60px scroll threshold (transparent → solid background)

### Scroll Progress Bar
Thin 2px brand-colored bar fills as user scrolls. Enable with `showScrollProgress` prop on `<Header>` component.

### UI Micro-animations
Predefined animations in `src/styles/global.css`:
- `animate-fade-in`, `animate-slide-up`, `animate-slide-down`
- `animate-dropdown-in`, `animate-sheet-up`, `animate-menu-down`
- `animate-toast-in`, `animate-tooltip-in`
- `animate-pulse`, `animate-spin`, `animate-shake`
- Delay utilities (`.delay-0` through `.delay-5`) for staggering effects

---

## Internationalization (i18n)

### Base Configuration
The theme is i18n-ready with locale-aware content collection schemas. Content can be organized by locale:
- `src/content/blog/en/`, `src/content/blog/es/`, `src/content/blog/fr/`, etc.
- Frontmatter includes `locale` field

### Full i18n Support
Scaffold a fresh project with full i18n via:
```bash
npm create velocity-astro@latest my-site -- --i18n
# or
pnpm create velocity-astro my-site --i18n
```

This adds:
- Locale-prefixed routes (`/en/`, `/es/`, `/fr/`)
- `LanguageSwitcher` component wired into header
- Translated navigation and example content per locale
- `hreflang` SEO tags on every page

Full i18n setup is provided by [create-velocity-astro CLI](https://github.com/southwellmedia/create-velocity-astro) (maintained by Southwell Media).

---

## Component Registry & Discovery

- **Registry**: `component-registry.json` tracks all project components
- **Schema**: `component-registry.schema.json` validates registry structure
- **Updated by**: Automated processes when components are added/removed
- Use the registry for component documentation and reuse tracking

---

## Common Tasks

### Adding a Blog Post
1. Create markdown file in `src/content/blog/[locale]/` (e.g., `en/my-post.md`)
2. Include frontmatter: title, description, publishedAt (ISO 8601), author, tags, locale
3. Optional: toc (table of contents), comments (Giscus), draft flag
4. Posts automatically routed to `/blog/[slug]`
5. Test locally with `pnpm dev`, then commit

### Changing the Theme
1. Click theme swatch in header (`ThemeSelectorDropdown`) — all colors update live, no rebuild needed
2. To permanently set a theme, edit which theme is default in `src/components/layout/ThemeSelector.astro`
3. Remove theme selector from header once you've settled on a color

### Customizing Brand Colors
1. Edit `src/styles/tokens/primitives.css`
2. Update `--brand-*` OKLCH values (e.g., change hue from 38 to 260 for blue)
3. Use [oklch.com](https://oklch.com/) to pick colors visually
4. Changes apply instantly in dev server

### Creating a New Component
1. Create `.astro` file in appropriate `src/components/` subdirectory
2. Export variants if multiple styles/states exist
3. Add barrel export in subdirectory `index.ts`
4. Update `component-registry.json`
5. Include TypeScript for props interface and validation
6. Add tests if logic is complex

### Adding Content Collections
1. Define schema in `src/content/config.ts` using Zod
2. Create collection folder in `src/content/<collection>/`
3. Add markdown/YAML files with schema-compliant frontmatter
4. Query in pages via `getCollection('<collection>')`
5. Create layout in `src/layouts/` if needed

### Setting Up Analytics
1. Get tracking IDs (GA_MEASUREMENT_ID for Google Analytics, GTM_ID for Google Tag Manager)
2. Add to `.env` file
3. Reference in `src/config/site.config.ts`
4. Tracking automatically includes on all pages via `<Analytics />` in BaseLayout

### Enabling Contact Form
1. The contact form is pre-built in `src/components/patterns/ContactForm.astro`
2. API endpoint at `src/pages/api/contact.ts` validates submissions
3. Modify success/error messages in contact page as needed
4. Test with `pnpm test` before deploying

### Deploying
- **Hosting**: Vercel (configured in `vercel.json`) and Netlify (configured in `netlify.toml`)
- **DNS**: Wrangler config for Cloudflare integration (`wrangler.toml`)
- **Build**: `pnpm build` → static site in `dist/`
- Ensure all tests pass before deployment

---

## Key Files & References

| File | Purpose |
|------|---------|
| `astro.config.mjs` | Astro build config, integrations, output settings |
| `tsconfig.json` | TypeScript strict mode, path aliases |
| `src/content.config.ts` | Content collection schemas (Zod) |
| `src/content/config.ts` | Collection definitions and validation |
| `src/lib/utils.ts` | Shared utilities and helpers |
| `src/lib/schema.ts` | Reusable Zod schemas |
| `src/config/site.config.ts` | Global site metadata |
| `src/config/nav.config.ts` | Navigation configuration |
| `vitest.config.ts` | Test runner configuration |
| `eslint.config.js` | Linting rules |

---

## SEO & Performance

### Built-in SEO Features
- **Meta tags**: Title, description, canonical URL on all pages
- **Open Graph**: Complete OG tags for social sharing
- **Twitter Cards**: Large image cards
- **JSON-LD**: WebSite, Organization, BlogPosting, Breadcrumb, FAQ schemas
- **Sitemap**: Auto-generated at `/sitemap-index.xml`
- **robots.txt**: Dynamic generation with sitemap reference
- **Default OG Image**: Static `public/og-default.svg` serves all pages

### SEO Component
Use `SEO` component from `@/components/seo/` for custom meta tags:
```astro
---
import SEO from '@/components/seo/SEO.astro';
---

<head>
  <SEO title="Page Title" description="Page description" />
</head>
```

### Performance
- Lighthouse Score: **100/100/100/100** on mobile and desktop
- Zero JavaScript by default (islands architecture)
- Optimized fonts with `font-display: swap`
- Image optimization via Astro's built-in processing
- Prefetching for instant page transitions

---

## Style & Conventions

- Use camelCase for JS/TS identifiers
- Use kebab-case for file/folder names (except React/Vue components)
- Keep components focused and single-responsibility
- Write JSDoc comments for exported functions and types
- Use TypeScript `type` for type aliases, `interface` for extensible contracts
- Prefix Zod schemas with `z` (e.g., `zArticleSchema`)

---

## When to Ask for Clarification

- Schema changes affecting multiple content types
- Major refactoring of component structure
- Changes to build or deployment configuration
- Decisions about adding new content collections
- Performance optimizations affecting build time
