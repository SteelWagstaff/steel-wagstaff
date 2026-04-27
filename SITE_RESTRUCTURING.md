# Site Restructuring Complete

## New Site Structure

Your site has been reorganized around three main content areas plus supporting pages:

### Navigation (Updated)
1. **Radio + Podcasts** → `/radio-podcasts`
2. **Writing + Storytelling** → `/writing-storytelling`
3. **Commonplace** → `/commonplace`
4. **About** → `/about`
5. **Contact** → `/contact`

---

## Pages Overview

### 🏠 Home Page (`/`)
**Purpose:** Personal introduction and entry point to all content areas

**Content:**
- Welcome hero with tagline: "Curious human. Father. Partner. Writer. Listener."
- "Who I am" section with biography
- Quick facts card (based in Eugene, Oregon; open source software work; 16 years experience)
- Three main content area cards linking to:
  - Radio + Podcasts
  - Writing + Storytelling
  - Commonplace
- Call-to-action to contact

---

### 🎵 Radio + Podcasts (`/radio-podcasts`)
**Purpose:** Hub for all audio content - podcasts and Spotify playlists

**Content Sections:**

1. **Spotify Playlists**
   - Monthly curated playlists from the `music` collection
   - Sorted by date (newest first)
   - Displays: Title, date, playlist badge
   - Links to: `/music/[slug]`

2. **Off the Chain Podcast**
   - Episodes from the "Off the Chain" podcast series
   - Sorted by date (newest first)
   - Displays: Title, episode number, date, "OTC" badge
   - Links to: `/podcasts/[slug]`

3. **Theme Songs Podcast**
   - Episodes from the "Theme Songs" podcast series (if available)
   - Sorted by date (newest first)
   - Displays: Title, episode number (if available), date, "Theme Songs" badge
   - Links to: `/podcasts/[slug]`

**Data Source:**
- Pulls from `music` collection (Spotify playlists)
- Pulls from `podcasts` collection (both podcast series)
- Dynamically filters by podcast name

---

### ✍️ Writing + Storytelling (`/writing-storytelling`)
**Purpose:** Central hub for written content and longer-form storytelling

**Content:**
- All blog posts from the `blog` collection
- Sorted by date (newest first)
- Displays for each post:
  - Title
  - Description excerpt
  - Publication date
  - Estimated reading time (calculated from word count)
  - Tags (first 2 shown)
- Links to: `/blog/[slug]`

**Future Expansion:**
- Can add sections for longer publications
- Can add storytelling recordings
- Can categorize by content type (essays, posts, recordings)

**Data Source:**
- `blog` collection (all non-draft posts)

---

### 📖 Commonplace (`/commonplace`)
**Purpose:** Digital commonplace book collecting quotations, videos, and music

**Current State:**
- Ready for future integration
- Placeholder showing intended content types:
  - Quotations (with sources)
  - Videos (linked)
  - Songs (with Spotify links)

**Future Implementation:**
- Can integrate with a custom Tumblr API feed
- Can use a separate content collection for commonplace items
- Can display items in a masonry or timeline layout

---

## Content Collections Used

### `music` (Spotify Playlists)
**Schema fields used on Radio + Podcasts page:**
- `title` - Playlist name
- `publishedAt` - Date created
- `spotifyEmbedId` - For embedding

### `podcasts` (Podcast Episodes)
**Schema fields used on Radio + Podcasts page:**
- `title` - Episode title
- `podcast` - Series name ("Off the Chain", "Theme Songs")
- `episode` - Episode number
- `publishedAt` - Date published
- `audioUrl` - Link to audio file

### `blog` (Blog Posts)
**Schema fields used on Writing + Storytelling page:**
- `title` - Post title
- `description` - Summary text
- `publishedAt` - Publication date
- `tags` - Topic tags
- Body content (for reading time calculation)

---

## Component/Layout Files

- **Layout:** `LandingLayout.astro` (home page) and `BaseLayout.astro` (other pages)
- **Components Used:**
  - `Hero` - Home page hero section
  - `Button` - Navigation buttons
  - `Badge` - Section labels
  - `Card` - Content containers
  - `Icon` - Visual indicators

---

## Styling & Design

All pages use consistent theming:
- **Colors:** Brand colors for actions, secondary for Writing, accent for Commonplace
- **Hover Effects:** Cards lift on hover, icons animate
- **Typography:** Display fonts for headings, consistent spacing
- **Responsive:** Grid layouts adapt from mobile to desktop
- **Dark Mode:** Supported throughout

---

## Key Features

✅ **Dynamic Content Loading:** Pages automatically pull content from collections
✅ **Responsive Design:** Mobile-first approach adapts to all screen sizes
✅ **Semantic Navigation:** Clear URL structure matches content organization
✅ **Content Grouping:** Related content organized by theme/audience
✅ **Easy Expansion:** Each page can grow by simply adding more content to collections

---

## Next Steps / Future Enhancements

### Commonplace Page
- [ ] Integrate Tumblr data feed
- [ ] Create content collection for quotations, videos, songs
- [ ] Design masonry layout for visual items

### Radio + Podcasts Page
- [ ] Add "steel's magnolia radio episodes" section (if content exists)
- [ ] Add podcast player/audio controls
- [ ] Add episode descriptions/show notes

### Writing + Storytelling Page
- [ ] Add filter/search by tags
- [ ] Add "featured" post highlighting
- [ ] Separate "longer publications" section
- [ ] Add storytelling recordings section

### General
- [ ] Consider adding archive/timeline view
- [ ] Add RSS feeds for each section
- [ ] Implement social sharing on individual pages

---

## File Changes Summary

**Modified Files:**
- `src/config/nav.config.ts` - Updated navigation items
- `src/pages/index.astro` - Complete redesign as home page

**New Files Created:**
- `src/pages/radio-podcasts.astro` - Radio + Podcasts hub
- `src/pages/writing-storytelling.astro` - Writing + Storytelling hub
- `src/pages/commonplace.astro` - Commonplace book page

**Unchanged:**
- All content collections (`music`, `podcasts`, `blog`)
- Blog detail pages
- Podcast detail pages
- Music detail pages
- About, Contact, Projects pages

