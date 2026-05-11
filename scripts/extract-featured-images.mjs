import fs from 'fs';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';

const xmlPath = '/home/steelwagstaff/steelwagstaff/steelwagstaff.WordPress.2026-04-24.xml';
const blogContentPath = '/home/steelwagstaff/steelwagstaff/src/content/blog/en';
const assetPath = '/home/steelwagstaff/steelwagstaff/src/assets/blog';

const xml = fs.readFileSync(xmlPath, 'utf-8');
const parser = new XMLParser({ ignoreAttributes: false });
const data = parser.parse(xml);

// Maps
const attachmentMap = {}; // attachment_id -> url
const postFeaturedImages = {}; // post_id -> attachment_id
const postTitles = {}; // post_id -> title
const postSlugs = {}; // post_id -> post_name (slug)

// Extract attachments
const items = data.rss.channel.item;
items.forEach(item => {
  if (!item['wp:post_type']) return;
  
  // Get attachment URLs
  if (item['wp:post_type'] === 'attachment') {
    const attachmentId = item['wp:post_id'];
    const url = item['wp:attachment_url'];
    if (attachmentId && url) {
      attachmentMap[attachmentId] = url;
    }
  }
  
  // Get posts with featured image meta
  if (item['wp:post_type'] === 'post') {
    const postId = item['wp:post_id'];
    const title = item.title;
    const slug = item['wp:post_name'];
    
    postTitles[postId] = title;
    postSlugs[postId] = slug;
    
    // Extract featured image from postmeta
    const postmeta = Array.isArray(item['wp:postmeta']) 
      ? item['wp:postmeta'] 
      : item['wp:postmeta'] ? [item['wp:postmeta']] : [];
      
    postmeta.forEach(meta => {
      if (meta['wp:meta_key'] === '_thumbnail_id') {
        const thumbnailId = meta['wp:meta_value'];
        postFeaturedImages[postId] = thumbnailId;
      }
    });
  }
});

// Now find which blog posts need featured images
const blogFiles = fs.readdirSync(blogContentPath).filter(f => f.endsWith('.md'));
const report = [];

blogFiles.forEach(file => {
  const filePath = path.join(blogContentPath, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Extract frontmatter
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return;
  
  const frontmatter = match[1];
  const titleMatch = frontmatter.match(/title:\s*"([^"]+)"/);
  const hasImage = frontmatter.includes('image:');
  
  if (titleMatch && !hasImage) {
    const title = titleMatch[1];
    
    // Find in WordPress by title
    let wpPostId = null;
    let featuredImageId = null;
    let imageUrl = null;
    
    for (const [pid, ptitle] of Object.entries(postTitles)) {
      if (ptitle === title) {
        wpPostId = pid;
        featuredImageId = postFeaturedImages[pid];
        if (featuredImageId && attachmentMap[featuredImageId]) {
          imageUrl = attachmentMap[featuredImageId];
        }
        break;
      }
    }
    
    if (imageUrl) {
      const filename = path.basename(imageUrl.split('?')[0]);
      const exists = fs.existsSync(path.join(assetPath, filename));
      report.push({
        file,
        title: title.substring(0, 50),
        wpPostId,
        thumbnailId: featuredImageId,
        imageUrl,
        filename,
        exists,
        frontmatter: hasImage ? 'HAS IMAGE' : 'MISSING IMAGE'
      });
    }
  }
});

console.log(`\nFeatured Images Found: ${report.filter(r => r.imageUrl).length}`);
console.log(`Files with existing images: ${report.filter(r => r.exists).length}`);
console.log('\nSample (first 10):');
report.slice(0, 10).forEach(r => {
  console.log(`${r.file.padEnd(40)} | ${r.filename.padEnd(35)} | EXISTS: ${r.exists}`);
});

// Save full report
fs.writeFileSync(
  '/home/steelwagstaff/steelwagstaff/scripts/featured-images-report.json',
  JSON.stringify(report, null, 2)
);

console.log(`\n✓ Full report saved to featured-images-report.json`);
