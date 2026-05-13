# Steel Wagstaff

A personal website showcasing music, podcasts, writing, and blog content. Built with [Astro Rocket](https://github.com/hansmartens68/Astro-Rocket), a modern theme featuring multiple color themes, dark mode, and smooth animations.

## What's Inside

- **Blog** — Articles and posts
- **Writing + Storytelling** — Articles, essays, and storytelling recordings
- **Radio + Podcasts** — Music playlists and podcast episodes (Off the Chain, Theme Songs, Steel's Magnolias)
- **The Commonplace** — Curated thoughts and ideas

---

## Quick Start

### Prerequisites

- **Node.js 22.12.0+**
- **pnpm 9.x** (or npm/yarn)

### Installation

```bash
git clone https://github.com/hansmartens68/astro-rocket.git my-project
cd my-project
pnpm install
pnpm dev
```

Visit `http://localhost:4321` to see the site.

---

## Commands

```bash
pnpm dev        # Start development server
pnpm build      # Build for production
pnpm preview    # Preview production build
pnpm check      # Run type checker
pnpm lint       # Run ESLint
pnpm format     # Format code with Prettier
```

---

## Features

- **12 color themes** — click a swatch in the header to change instantly
- **Dark mode** — respects user preferences
- **Responsive design** — mobile, tablet, and desktop
- **Fast** — optimized for Core Web Vitals, zero JavaScript by default
- **Animations** — smooth page transitions and scroll-triggered effects
- **Built with Astro 6** — modern static site generator
- **Tailwind CSS v4** — utility-first CSS with OKLCH colors
- **TypeScript** — type-safe development

---

## Configuration

Edit `src/config/site.config.ts`:

```typescript
const siteConfig = {
  name: 'Your Site Name',
  description: 'Your site description',
  url: 'https://yoursite.com',
  author: 'Your Name',
  email: 'hello@yoursite.com',
};
```

---

## Adding Content

### Blog Posts

Create markdown files in `src/content/blog/en/`:

```markdown
---
title: "Post Title"
description: "SEO description"
publishedAt: 2026-04-28
tags: ["tag1", "tag2"]
---

Your content here...
```

---

## Deployment

### Vercel (Recommended)

```bash
vercel
```

### Netlify

```bash
netlify deploy --prod
```

### Cloudflare Pages

```bash
pnpm build
wrangler pages deploy dist
```

---

## License

MIT License — see [LICENSE](LICENSE) for details.

## Links

- [Astro Rocket](https://github.com/hansmartens68/Astro-Rocket) — the theme
- [Astro Docs](https://docs.astro.build)
- [Tailwind CSS](https://tailwindcss.com)

```css
:root {
  --brand-50:  oklch(97.5% 0.02 45);  /* lightest tint */
  --brand-100: oklch(94.8% 0.04 45);
  --brand-200: oklch(87.5% 0.08 45);
  --brand-300: oklch(77.8% 0.14 45);
  --brand-400: oklch(68.5% 0.19 40);
  --brand-500: oklch(62.5% 0.22 38);  /* primary brand color */
  --brand-600: oklch(53.2% 0.19 38);
  --brand-700: oklch(45.5% 0.16 38);
  --brand-800: oklch(37.2% 0.13 38);
  --brand-900: oklch(26.5% 0.09 38);
}
```

OKLCH values are `oklch(lightness chroma hue)`. To shift your brand to blue, change the hue from `38-45` to `~260`. Use [oklch.com](https://oklch.com) to pick colors visually.

### Creating a New Theme

1. Duplicate `src/styles/themes/default.css` as your starting point
2. Implement all ~35 semantic tokens for both `:root` (light) and `.dark` (dark):

   **Backgrounds**: `--background`, `--background-secondary`, `--background-tertiary`, `--background-elevated`

   **Foregrounds**: `--foreground`, `--foreground-secondary`, `--foreground-muted`, `--foreground-subtle`

   **Borders**: `--border`, `--border-strong`, `--border-subtle`

   **Interactive**: `--primary`, `--primary-hover`, `--primary-foreground`, `--secondary`, `--secondary-hover`, `--secondary-foreground`, `--accent`, `--accent-hover`, `--accent-light`

   **Surfaces**: `--muted`, `--muted-foreground`, `--card`, `--card-border`, `--input-bg`, `--input-border`, `--input-focus`, `--ring`

   **Destructive**: `--destructive`, `--destructive-foreground`

   **Gradients**: `--gradient-start`, `--gradient-end`

   **Invert sections**: `--surface-invert`, `--surface-invert-secondary`, `--surface-invert-tertiary`, `--on-invert`, `--on-invert-secondary`, `--on-invert-muted`, `--border-invert`, `--border-invert-strong`

3. Update the import in `src/styles/tokens/colors.css` to point to your new theme file

### Dark Mode

Dark mode toggles via the `.dark` class on `<html>`. The default is **dark** — the design was built dark-first and it looks great for portfolios and creative sites.

FOUC is prevented by an inline script that reads `sessionStorage` before first paint. Use the included `ThemeToggle` component:

```astro
---
import ThemeToggle from '@/components/layout/ThemeToggle.astro';
---

<ThemeToggle />
```

To opt out of dark mode, remove the `.dark { ... }` block from your theme file.

> **Why `sessionStorage` instead of `localStorage`?** This is a deliberate choice. `sessionStorage` persists the user's preference during their visit but resets when the tab is closed — so every new visit starts with the intended dark design. For a portfolio or marketing site this is the right call. For a product users return to daily (a SaaS dashboard, editor, etc.), switch to `localStorage` so the preference survives across sessions. Read the full reasoning in [this blog post](https://hansmartens.dev/blog/dark-mode-sessionstorage).

### WCAG Contrast Requirements

Foreground tokens are documented with their contrast ratios inline. When customizing, maintain these minimums:

| Token | Minimum ratio | Standard |
|-------|:---:|:---:|
| `--foreground` | 7:1 | WCAG AAA |
| `--foreground-secondary` | 7:1 | WCAG AAA |
| `--foreground-muted` | 4.5:1 | WCAG AA |
| `--foreground-subtle` | 4.5:1 | WCAG AA |
| Status `-foreground` tokens | 4.5:1 | WCAG AA (on their `-light` bg) |

### Using Design Tokens

```astro
<!-- Tailwind utilities (recommended) -->
<div class="bg-background text-foreground">
  <h1 class="text-primary font-display">Hello</h1>
</div>

<!-- CSS custom properties -->
<style>
  .custom {
    background: var(--background-secondary);
    color: var(--foreground);
  }
</style>
```

---

## Components

Astro Rocket includes 57 components across 7 categories. All UI components use [class-variance-authority (CVA)](https://cva.style) for type-safe variant management.

### UI Components (31)

#### Form (`ui/form/`)

| Component | Description |
|-----------|-------------|
| Button | Interactive button with primary, secondary, outline, ghost, destructive variants and loading state |
| Input | Text input with label, hint, and error states |
| Textarea | Multi-line text input |
| Select | Dropdown selection |
| Checkbox | Boolean toggle with indeterminate state |
| Radio | Single selection from group |
| Switch | Toggle switch input |

#### Data Display (`ui/data-display/`)

| Component | Description |
|-----------|-------------|
| Card | Content container with variant, padding, and hover options |
| Badge | Status labels and tags with contextual variants |
| Avatar | User images with fallback |
| AvatarGroup | Grouped avatar display with overlap |
| Table | Styled data table |
| Pagination | Page navigation controls |
| Progress | Progress bar indicator |
| Skeleton | Loading placeholders |

#### Feedback (`ui/feedback/`)

| Component | Description |
|-----------|-------------|
| Alert | Contextual feedback messages (info, success, warning, error) |
| Toast | Temporary notification messages |
| Tooltip | Hover tooltips with positioning |

#### Overlay (`ui/overlay/`)

| Component | Description |
|-----------|-------------|
| Dialog | Modal overlay |
| Dropdown | Menu with trigger |
| Tabs | Horizontal tabbed content panels |
| VerticalTabs | Vertical tab navigation |
| Accordion | Collapsible content sections |

#### Layout (`ui/layout/`)

| Component | Description |
|-----------|-------------|
| Separator | Visual divider between sections |

#### Primitives (`ui/primitives/`)

| Component | Description |
|-----------|-------------|
| Icon | Unified icon component (Astro + React) powered by Iconify. Supports all [Lucide](https://lucide.dev) icons (`lucide:*`) and all [Simple Icons](https://simpleicons.org) brand icons (`simple-icons:*`). Includes shorthand names for common social and brand icons. Five size variants: `xs`, `sm`, `md`, `lg`, `xl`. |

#### Content (`ui/content/`)

| Component | Description |
|-----------|-------------|
| CodeBlock | Syntax-highlighted code display |

#### Marketing (`ui/marketing/`)

| Component | Description |
|-----------|-------------|
| Logo | Auto-generated monogram badge — renders the first letter of `siteConfig.name` on the active brand color. Five sizes: `sm`, `md`, `lg`, `xl`, `2xl`. No logo file required. |
| CTA | Call-to-action sections with slot-based composition |
| NpmCopyButton | NPM install command with copy-to-clipboard |
| SocialProof | Testimonial and trust indicator cards |
| TerminalDemo | Animated terminal demonstration (React) |

### Pattern Components (7)

| Component | Description |
|-----------|-------------|
| ContactForm | Complete contact form with validation |
| NewsletterForm | Email subscription form |
| FormField | Reusable form field wrapper |
| SearchInput | Search input with icon |
| PasswordInput | Password input with visibility toggle |
| StatCard | Statistics display card |
| EmptyState | Empty state placeholder with icon and action |

### Other Categories

| Category | Count | Components |
|----------|-------|------------|
| Hero | 1 | Hero section with centered/split layouts, grid pattern, and typing effect |
| Layout | 6 | Header (with scroll progress bar), Footer, ThemeToggle, ThemeSelector, ThemeSelectorDropdown, Analytics |
| Blog | 4 | ArticleHero, BlogCard, ShareButtons, RelatedPosts |
| Landing | 5 | Credibility, LighthouseScores, TechStack, FeatureTabs, and more |
| SEO | 3 | SEO, JsonLd, Breadcrumbs |

### Usage Example

```astro
---
import { Button, Input, Card } from '@/components/ui';
---

<Card>
  <Input label="Email" type="email" name="email" required />
  <Button variant="primary">Submit</Button>
</Card>
```

### Icon Usage

```astro
---
import Icon from '@/components/ui/primitives/Icon/Icon.astro';
---

<!-- Lucide UI icons — use any icon name from lucide.dev -->
<Icon name="arrow-right" size="md" />
<Icon name="mail" size="sm" />
<Icon name="layers" size="lg" />

<!-- Simple Icons brand icons — shorthand names available -->
<Icon name="github" size="md" />
<Icon name="x-twitter" size="md" />
<Icon name="brand-astro" size="md" />
<Icon name="brand-tailwind" size="md" />

<!-- Or use the full Iconify name directly -->
<Icon name="simple-icons:vercel" size="md" />
<Icon name="lucide:rocket" size="xl" />
```

All UI components are imported via barrel exports from `@/components/ui`. View all components at `/components` in development.

---

## Content Management

### Blog Posts

Create posts in `src/content/blog/[locale]/`:

```markdown
---
title: "Your Post Title"
description: "Brief description for SEO"
publishedAt: 2026-01-30
author: "Author Name"
tags: ["astro", "tutorial"]
locale: en
---

Your content here...
```

### Querying Content

```astro
---
import { getCollection } from 'astro:content';

const posts = await getCollection('blog', ({ data }) => {
  return import.meta.env.PROD ? !data.draft : true;
});
---
```

---

## SEO

### Automatic Features

- **Meta tags**: Title, description, canonical URL
- **Open Graph**: Complete OG tags for social sharing
- **Twitter Cards**: Large image cards
- **JSON-LD**: WebSite, Organization, BlogPosting, Breadcrumb, FAQ schemas
- **Sitemap**: Auto-generated at `/sitemap-index.xml`
- **robots.txt**: Dynamic generation with sitemap reference
- **OG Images**: A static default OG image serves all pages and blog posts

### Using the SEO Component

```astro
---
import SEO from '@/components/seo/SEO.astro';
---

<head>
  <SEO
    title="Page Title"
    description="Page description"
  />
</head>
```

### OG Image

A static default OG image (`public/og-default.svg`) serves as the social preview for all pages. The path is set via `ogImage` in `src/config/site.config.ts`. To use a custom image for a specific page, pass it as the `image` prop to the layout component.

---

## API Routes

### Contact Form

**POST** `/api/contact`

```typescript
// Request (FormData)
{
  name: string,      // 2-100 chars
  email: string,     // Valid email
  subject: string,   // Required
  message: string,   // 10-5000 chars
  honeypot: string   // Must be empty (spam check)
}

// Response
{ success: true }
// or
{ success: false, errors: { field: ["message"] } }
```

### Newsletter

**POST** `/api/newsletter`

```typescript
// Request (FormData)
{ email: string }

// Response
{ success: true }
// or
{ success: false, error: "message" }
```

---

## Deployment

Configuration files included for major platforms.

### Vercel (Recommended)

```bash
vercel
```

### Netlify

```bash
netlify deploy --prod
```

### Cloudflare Pages

```bash
wrangler pages deploy dist
```

### Static Export

Build outputs to `dist/` for any static host:

```bash
pnpm build
```

---

## Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

---

## Performance

Astro Rocket is optimized for Core Web Vitals:

- **Lighthouse Score**: 95+ across all categories
- **Zero JavaScript** by default (islands architecture)
- **Optimized fonts** with `font-display: swap`
- **Image optimization** via Astro's built-in processing
- **Prefetching** for instant page transitions

---

## Animations

Every page in Astro Rocket includes purposeful animations that make the site feel polished and alive. All animations respect the user's `prefers-reduced-motion` setting — they are disabled automatically for users who prefer less motion.

### Page transitions

Astro Rocket uses Astro's built-in `<ClientRouter />` (View Transitions API) to animate between pages. Instead of a full browser reload, content fades smoothly from one page to the next. This is enabled globally in `BaseLayout.astro` and requires no per-page configuration.

### Scroll-triggered animations

Two components use an `IntersectionObserver` to trigger animations when elements enter the viewport:

- **Counter animation** — the stats block on the homepage (Years Experience, Projects Delivered, etc.) counts up from zero when it scrolls into view. Each number animates with a cubic ease-out over 1.2 seconds.
- **Lighthouse score bars** — the `LighthouseScores` landing component animates its score bars into place as the section becomes visible.

### Scroll-reactive header

The floating header changes its appearance as the user scrolls. When the page is at the top, the header is transparent with inverted text. Once the user scrolls past 60px, the header gains a solid background and the text flips to normal colors — all driven by CSS transitions via a `data-scrolled` attribute.

### Scroll progress bar

A thin 2px brand-coloured bar on the header edge that grows from left to right as the user scrolls, showing reading progress at a glance. Enable it with two props on the `<Header>` component:

| Prop | Type | Default | What it does |
|------|------|:-------:|--------------|
| `showScrollProgress` | `boolean` | `false` | Renders the progress bar |
| `scrollProgressPosition` | `'top'` \| `'bottom'` | `'bottom'` | Edge of the header where the bar sits |

The bar is enabled by default on three page types: the **homepage** (above the floating header), the **blog index**, and **individual blog posts** (both below the solid bar header). Use `scrollProgressPosition="top"` on a floating capsule header and `'bottom'` on a solid bar header. The bar colour always matches `--color-brand-500` and updates instantly when the visitor switches themes.

### Card hover effects

Cards throughout the site lift slightly on hover (`-translate-y-1`) and gain a subtle shadow. This is a Tailwind utility applied consistently to all interactive cards.

### UI micro-animations

The full animation library is defined in `src/styles/global.css`. These classes are used by components throughout the site:

| Class | What it does |
|-------|-------------|
| `animate-fade-in` | Fades an element from transparent to visible (0.5s ease-out) |
| `animate-slide-up` | Slides an element up from 12px below while fading in (0.5s ease-out) |
| `animate-slide-down` | Slides an element down from 12px above while fading in (0.5s ease-out) |
| `animate-dropdown-in` | Slides and scales a dropdown menu into view (0.2s spring) |
| `animate-dropdown-out` | Collapses a dropdown menu out of view (0.15s) |
| `animate-sheet-up` | Slides a bottom sheet up from off-screen (0.25s spring) |
| `animate-menu-down` | Slides the mobile navigation drawer open (0.25s spring) |
| `animate-tab-enter` | Crossfades tab panel content when switching tabs |
| `animate-toast-in` | Slides a toast notification in from the right (350ms spring) |
| `animate-tooltip-in` | Fades and scales a tooltip into view |
| `animate-pulse` | Breathing pulse for skeleton loading states |
| `animate-spin` | Continuous rotation for loading spinners |
| `animate-shake` | Brief shake for error feedback (400ms) |

Animation delay utilities (`.delay-0` through `.delay-5`, in 50ms steps) let you stagger multiple elements into view.

---

## Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code passes linting (`pnpm lint`) and type checking (`pnpm check`) before submitting.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Links

- [Astro Rocket on GitHub](https://github.com/hansmartens68/astro-rocket)
- [Velocity — the original theme](https://github.com/southwellmedia/velocity) by [Southwell Media](https://southwellmedia.com)
- [Astro Documentation](https://docs.astro.build)
- [Tailwind CSS v4](https://tailwindcss.com/docs)