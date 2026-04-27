# WordPress Media Recovery - Complete Summary

## 📊 Recovery Results

### Overall Statistics
- **Total unique attachment IDs found**: 185
- **Successfully recovered**: 107 media files (58%)
- **Not found/Unavailable**: 78 attachment IDs (42%)
- **Media files location**: `src/assets/blog/`

### WordPress Sites Queried
1. `https://steelwagstaff.info` - 512 media items
2. `https://music.steelwagstaff.info` - 261 media items  
3. `https://otc.steelwagstaff.info` - 172 media items

**Total API items retrieved**: 945 media items

## 📁 Recovered Media Files

All 107 recovered images are now available in `src/assets/blog/` including:

- **Photos**: IMG_*.jpg, personal photos and screenshots (80+ files)
- **Logos/Graphics**: OTC_logo_wide.png, geometric patterns, various logos
- **Portraits**: self-portraits.jpg, musician photos, album covers
- **Design assets**: Screen captures, design mockups, tutorials
- **Historic content**: Photos from 2007-2021

## 🗂️ Reference Files

### `scripts/media-mapping.csv`
Complete mapping of attachment IDs to recovered filenames and their associated blog posts.

**Columns:**
- `attachmentId`: Original WordPress attachment ID
- `posts`: Blog post(s) referencing this image
- `status`: DOWNLOADED or NOT_FOUND
- `url`: Original WordPress media URL
- `filename`: Recovered filename in assets/blog/
- `mediaId`: WordPress REST API media ID
- `title`: Media title from WordPress
- `source`: Which WordPress site it came from

**Example entries:**
```
125,10-years-later-quotations-for-a-friend.md,DOWNLOADED,...,self-portraits.jpg,125,Self-Portraits,https://steelwagstaff.info
6145,a-guide-to-diy-podcast-recording.md,DOWNLOADED,...,OTC_logo_wide.png,6145,OTC_logo_wide,https://steelwagstaff.info
```

### `scripts/recover-wordpress-media.mjs`
The recovery script that:
1. Scans all blog posts for attachment ID references
2. Queries all three WordPress REST APIs
3. Downloads and organizes media files
4. Generates the mapping CSV

Usage:
```bash
node scripts/recover-wordpress-media.mjs
```

## ⚠️ What's Missing (78 Attachment IDs)

These attachments couldn't be found:
- Deleted from WordPress media library
- References in content but never uploaded
- Permission/access issues
- May have been in a non-standard location

**To recover these:**
- Check WordPress trash/recycle bin for deleted items
- Check if there are backup databases with older versions
- Review WordPress revision history for any clues

## 🔗 Current State

### ✅ Working
- **Spotify embeds**: Blog posts with Spotify URLs render as embedded players
- **Dev server**: `pnpm dev` runs on localhost:4323
- **Blog posts load**: All blog posts display correctly
- **Media files recovered**: Available for manual integration

### 🟡 Outstanding
- **Featured images**: Not yet integrated into blog post frontmatter
- **WordPress shortcodes**: Still present in blog post content (`[caption id="..."]`)
- **78 missing images**: No source material available

## 📝 Next Steps for Integration

### Option 1: Manual Featured Images (Recommended)
1. Open `scripts/media-mapping.csv` in Excel/CSV viewer
2. For each blog post with recovered images:
   - Review the recovered image file
   - Decide if it's appropriate for that post
   - Use the filename to reference in your custom image display logic

### Option 2: Create Frontmatter Integration
Due to Astro's `image()` validator expectations, you'll need to either:
- Import images directly in blog files (not scalable for 107 files)
- Create a custom image loading component that accepts file paths as strings
- Use a build-time script to generate proper imports

### Option 3: Direct Asset References
Reference the recovered images directly in your blog component templates:
```
<img src="/assets/blog/filename.jpg" alt="description" />
```

## 🧹 Cleanup Tasks

### Remove Remaining WordPress Shortcodes
Many blog posts still contain `[caption id="attachment_XXX"...]` markup that should be removed.

Check the blog post content for:
- `[caption id="attachment_..."...]` - Remove and replace with proper text
- `[bandcamp ...]` - Remove embeds (if present)
- Other WordPress-specific shortcodes

### Update Post Descriptions
Some post descriptions still reference attachment IDs - consider updating these to descriptive text instead.

## 📊 Attachment ID Distribution

**Top posts by recovered images:**
- designing-and-making-rings.md: 8 images
- designing-and-making-invitations-part-2.md: 6 images
- planning-meals.md: 5 images
- a-guide-to-diy-podcast-recording.md: 5 images

**By source site:**
- steelwagstaff.info: ~60% of recovered images
- music.steelwagstaff.info: ~30% of recovered images
- otc.steelwagstaff.info: ~10% of recovered images

## 🎯 Summary

Your three-site WordPress import successfully recovered **107 media files** that can now be used to restore featured images to your blog posts. The mapping file provides a complete reference of what was found and which posts each image belongs to.

While 78 attachment IDs couldn't be recovered (likely deleted), the majority of critical media has been preserved. These files are now safely stored in your Astro project and ready for integration into your blog post design.
