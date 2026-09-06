import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_POSTS = 'c:\\Users\\steel\\LIFE\\music website\\tumblr\\posts\\html';
const SOURCE_MEDIA = 'c:\\Users\\steel\\LIFE\\music website\\tumblr\\media';
const DEST_CONTENT = path.join(__dirname, '..', 'src', 'content', 'commonplace');
const DEST_MEDIA = path.join(__dirname, '..', 'public', 'commonplace-media');

// Post type detection helpers
function detectPostType(dom) {
  const body = dom.window.document.body;
  
  // Check for image
  const img = body.querySelector('img');
  if (img) return 'photo';
  
  // Check for audio
  const audio = body.querySelector('audio, [src*=".mp3"], [src*=".m4a"]');
  if (audio) return 'audio';
  
  // Check for video (iframe, video tag, or YouTube embed)
  const video = body.querySelector('video, iframe[src*="youtube"], iframe[src*="vimeo"]');
  if (video) return 'video';
  
  // Check for blockquote (quote reblogs)
  const blockquote = body.querySelector('blockquote');
  if (blockquote) return 'quote';
  
  return 'quote'; // Default to quote for text posts
}

function extractContent(dom, postType) {
  const body = dom.window.document.body;
  const caption = body.querySelector('.caption');
  const footer = body.querySelector('#footer');
  
  if (postType === 'quote') {
    // First try blockquote (reblog style)
    const blockquote = body.querySelector('blockquote');
    if (blockquote) {
      return blockquote.textContent.trim();
    }
    
    // Otherwise get body text before caption and footer
    const bodyClone = body.cloneNode(true);
    const clonedCaption = bodyClone.querySelector('.caption');
    const clonedFooter = bodyClone.querySelector('#footer');
    if (clonedCaption) clonedCaption.remove();
    if (clonedFooter) clonedFooter.remove();
    
    let text = bodyClone.textContent.trim();
    // Remove extra whitespace
    text = text.replace(/\s+/g, ' ').trim();
    return text;
  }
  
  if (caption) {
    return caption.innerHTML;
  }
  
  // Get all text content except footer
  const bodyClone = body.cloneNode(true);
  const clonedFooter = bodyClone.querySelector('#footer');
  if (clonedFooter) clonedFooter.remove();
  let text = bodyClone.textContent.trim();
  // Remove extra whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

function extractTags(dom) {
  const tags = [];
  const tagElements = dom.window.document.querySelectorAll('span.tag');
  tagElements.forEach(el => {
    const tag = el.textContent.trim();
    if (tag) tags.push(tag);
  });
  return tags;
}

function extractTimestamp(dom) {
  const timestamp = dom.window.document.querySelector('span#timestamp');
  if (timestamp) {
    try {
      const text = timestamp.textContent.trim();
      // Handle format like "October 14th, 2014 4:25pm"
      // Clean up ordinal suffixes (1st, 2nd, 3rd, 4th, etc.)
      const cleaned = text.replace(/(\d+)(st|nd|rd|th)/g, '$1');
      const date = new Date(cleaned);
      if (!isNaN(date.getTime())) {
        return date;
      }
    } catch (e) {
      // Continue to fallback
    }
  }
  return new Date();
}

function extractSource(dom) {
  // Try caption first for attribution
  const caption = dom.window.document.querySelector('.caption');
  if (caption) {
    const text = caption.textContent.trim();
    if (text.startsWith('—')) {
      return text;
    }
  }
  
  // Fallback to tumblr blog
  const tumblrBlog = dom.window.document.querySelector('a.tumblr_blog');
  if (tumblrBlog) {
    return tumblrBlog.textContent.trim();
  }
  return null;
}

function extractMediaUrl(dom) {
  const img = dom.window.document.querySelector('img');
  if (img) return img.getAttribute('src');
  
  const audio = dom.window.document.querySelector('audio source');
  if (audio) return audio.getAttribute('src');
  
  return null;
}

function shouldExclude(dom) {
  const text = dom.window.document.body.textContent;
  // Exclude cross-posts to music.steelwagstaff.info
  if (text.includes('music.steelwagstaff.info')) {
    return true;
  }
  return false;
}

function parseYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/embed\/|youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : null;
}

function copyMediaFile(sourceFile, destFile) {
  try {
    if (fs.existsSync(sourceFile)) {
      fs.copyFileSync(sourceFile, destFile);
      return true;
    }
  } catch (e) {
    console.warn(`Failed to copy ${sourceFile}: ${e.message}`);
  }
  return false;
}

function sanitizeFilename(filename) {
  return filename.replace(/[^a-z0-9-]/gi, '-').replace(/-+/g, '-').toLowerCase();
}

async function migrate() {
  console.log('Starting commonplace migration...');
  
  const files = fs.readdirSync(SOURCE_POSTS).filter(f => f.endsWith('.html'));
  console.log(`Found ${files.length} posts to process`);
  
  let processed = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const file of files) {
    try {
      const postId = path.basename(file, '.html');
      const htmlPath = path.join(SOURCE_POSTS, file);
      const html = fs.readFileSync(htmlPath, 'utf-8');
      
      const dom = new JSDOM(html);
      
      // Skip cross-posts
      if (shouldExclude(dom)) {
        skipped++;
        continue;
      }
      
      const postType = detectPostType(dom);
      const content = extractContent(dom, postType);
      const tags = extractTags(dom);
      const timestamp = extractTimestamp(dom);
      const source = extractSource(dom);
      const mediaPath = extractMediaUrl(dom);
      
      // Skip if no content
      if (!content || content.length < 2) {
        skipped++;
        continue;
      }

      // Clean title - remove HTML tags and truncate
      const rawTitle = content.replace(/<[^>]*>/g, '').substring(0, 100).trim();
      const title = rawTitle.length > 0 ? rawTitle : `Post ${postId}`;
      // Prepare frontmatter
      let frontmatter = {
        title: title,
        type: postType,
        content: content,
        publishedAt: timestamp.toISOString(),
        tags: tags,
        draft: false,
        locale: 'en',
      };
      
      if (source) {
        frontmatter.source = source;
      }
      
      // Handle media
      let mediaFilename = null;
      if (mediaPath) {
        const ext = path.extname(mediaPath);
        const basename = path.basename(mediaPath);
        const sourceMediaPath = path.join(SOURCE_MEDIA, basename);
        
        if (postType === 'photo' && fs.existsSync(sourceMediaPath)) {
          mediaFilename = `${postId}${ext}`;
          const destPath = path.join(DEST_MEDIA, mediaFilename);
          copyMediaFile(sourceMediaPath, destPath);
          frontmatter.image = `/commonplace-media/${mediaFilename}`;
        } else if (postType === 'audio' && fs.existsSync(sourceMediaPath)) {
          mediaFilename = `${postId}${ext}`;
          const destPath = path.join(DEST_MEDIA, mediaFilename);
          copyMediaFile(sourceMediaPath, destPath);
          frontmatter.audioUrl = `/commonplace-media/${mediaFilename}`;
        } else if (postType === 'video' && mediaPath.includes('youtube')) {
          const youtubeId = parseYouTubeId(mediaPath);
          if (youtubeId) {
            frontmatter.videoUrl = `https://www.youtube.com/embed/${youtubeId}`;
          }
        }
      }
      
      // Create markdown file
      const yamlContent = Object.entries(frontmatter)
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            return `${key}: [${value.map(v => `"${String(v).replace(/"/g, '\\"')}"` ).join(', ')}]`;
          }
          if (typeof value === 'string') {
            // Use block scalar for multiline content
            const escaped = String(value).replace(/"/g, '\\"');
            if (escaped.includes('\n')) {
              return `${key}: |\n  ${escaped.split('\n').join('\n  ')}`;
            }
            return `${key}: "${escaped}"`;
          }
          return `${key}: ${value}`;
        })
        .join('\n');
      
      const markdown = `---
${yamlContent}
---

${postType === 'quote' ? `> ${frontmatter.content.split('\n').join('\n> ')}${frontmatter.source ? `\n\n${frontmatter.source}` : ''}` : ''}
${postType === 'photo' && frontmatter.image ? `![${frontmatter.title}](${frontmatter.image})` : ''}
${postType === 'audio' && frontmatter.audioUrl ? `[Listen](${frontmatter.audioUrl})` : ''}
${postType === 'video' && frontmatter.videoUrl ? `<iframe src="${frontmatter.videoUrl}" width="560" height="315" allowfullscreen></iframe>` : ''}
`;
      
      const mdFilename = `${postId}.md`;
      const mdPath = path.join(DEST_CONTENT, mdFilename);
      fs.writeFileSync(mdPath, markdown);
      
      processed++;
      if (processed % 100 === 0) {
        console.log(`Processed ${processed} posts...`);
      }
    } catch (e) {
      console.error(`Error processing ${file}: ${e.message}`);
      errors++;
    }
  }
  
  console.log(`\n✅ Migration complete!`);
  console.log(`   Processed: ${processed}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Total: ${processed + skipped + errors}/${files.length}`);
}

migrate().catch(console.error);
