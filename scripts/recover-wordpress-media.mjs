#!/usr/bin/env node
/**
 * Recover WordPress media from three sites and import into Astro project
 * 
 * This script:
 * 1. Scans all blog posts for attachment IDs
 * 2. Queries WordPress REST APIs to find media metadata
 * 3. Downloads media files to src/assets/blog/
 * 4. Generates a mapping CSV for manual frontmatter updates
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const blogContentDir = path.join(projectRoot, 'src/content/blog/en');
const assetsDir = path.join(projectRoot, 'src/assets/blog');

// WordPress site URLs
const SITES = [
  'https://steelwagstaff.info',
  'https://music.steelwagstaff.info',
  'https://otc.steelwagstaff.info'
];

/**
 * Download a file from URL
 */
async function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.open(outputPath, 'w');
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirects
        downloadFile(response.headers.location, outputPath).then(resolve).catch(reject);
        return;
      }
      
      file.then(f => {
        response.pipe(f.createWriteStream({ fd: f.fd }))
          .on('finish', () => {
            f.close().then(() => resolve(outputPath)).catch(reject);
          })
          .on('error', reject);
      }).catch(reject);
    }).on('error', reject);
  });
}

/**
 * Query WordPress REST API for media
 */
async function queryWordPressMedia(siteUrl) {
  console.log(`\nQuerying ${siteUrl} for media...`);
  
  const media = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    try {
      const url = `${siteUrl}/wp-json/wp/v2/media?per_page=100&page=${page}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Astro-Media-Recovery/1.0'
        }
      });
      
      if (!response.ok) {
        console.warn(`  ⚠ API request failed: ${response.status}`);
        break;
      }
      
      const items = await response.json();
      
      if (Array.isArray(items) && items.length > 0) {
        media.push(...items);
        console.log(`  ✓ Fetched ${items.length} media items (page ${page})`);
        page++;
      } else {
        hasMore = false;
      }
    } catch (error) {
      console.warn(`  ✗ Error querying page ${page}:`, error.message);
      hasMore = false;
    }
  }
  
  return media;
}

/**
 * Extract attachment IDs from blog posts
 */
async function extractAttachmentIds() {
  const attachments = new Map();
  const files = await fs.readdir(blogContentDir);
  
  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    
    const content = await fs.readFile(path.join(blogContentDir, file), 'utf-8');
    const matches = [...content.matchAll(/attachment_(\d+)/g)];
    
    for (const match of matches) {
      const id = parseInt(match[1]);
      if (!attachments.has(id)) {
        attachments.set(id, []);
      }
      attachments.get(id).push(file);
    }
  }
  
  return attachments;
}

/**
 * Main recovery process
 */
async function main() {
  console.log('🔄 Starting WordPress Media Recovery\n');
  
  // Step 1: Extract attachment IDs from blog posts
  console.log('Step 1: Scanning blog posts for attachment IDs...');
  const requiredAttachments = await extractAttachmentIds();
  console.log(`✓ Found ${requiredAttachments.size} unique attachment IDs\n`);
  
  // Step 2: Query WordPress sites
  console.log('Step 2: Querying WordPress REST APIs...');
  const allMedia = [];
  const mediaMap = new Map(); // id -> media object + site
  
  for (const site of SITES) {
    try {
      const media = await queryWordPressMedia(site);
      for (const item of media) {
        mediaMap.set(item.id, { ...item, source: site });
        allMedia.push(item);
      }
    } catch (error) {
      console.warn(`✗ Failed to query ${site}:`, error.message);
    }
  }
  
  console.log(`✓ Retrieved ${allMedia.length} total media items from all sites\n`);
  
  // Step 3: Create assets directory if needed
  console.log('Step 3: Preparing assets directory...');
  try {
    await fs.mkdir(assetsDir, { recursive: true });
    console.log('✓ Assets directory ready\n');
  } catch (error) {
    console.warn('✗ Failed to create assets directory:', error.message);
  }
  
  // Step 4: Download and map media
  console.log('Step 4: Downloading and organizing media...');
  const mapping = [];
  let downloaded = 0;
  let notFound = 0;
  
  for (const [attachmentId, posts] of requiredAttachments) {
    const media = mediaMap.get(attachmentId);
    
    if (!media) {
      notFound++;
      mapping.push({
        attachmentId,
        posts: posts.join('; '),
        status: 'NOT_FOUND',
        url: 'N/A',
        filename: 'N/A',
        notes: 'Attachment ID not found in any WordPress site'
      });
      continue;
    }
    
    // Get the source URL
    const sourceUrl = media.source_url;
    const filename = path.basename(sourceUrl).split('?')[0] || `attachment_${attachmentId}.jpg`;
    const outputPath = path.join(assetsDir, filename);
    
    try {
      // Check if already exists
      try {
        await fs.access(outputPath);
        console.log(`  ✓ ${filename} (already exists)`);
      } catch {
        // Download the file
        await downloadFile(sourceUrl, outputPath);
        console.log(`  ✓ Downloaded ${filename}`);
      }
      
      mapping.push({
        attachmentId,
        posts: posts.join('; '),
        status: 'DOWNLOADED',
        url: sourceUrl,
        filename: filename,
        mediaId: media.id,
        title: media.title?.rendered || media.alt_text || '',
        source: media.source
      });
      
      downloaded++;
    } catch (error) {
      console.warn(`  ✗ Failed to download ${filename}:`, error.message);
      mapping.push({
        attachmentId,
        posts: posts.join('; '),
        status: 'DOWNLOAD_FAILED',
        url: sourceUrl,
        filename: filename,
        error: error.message
      });
    }
  }
  
  console.log(`\n✓ Downloaded ${downloaded} files`);
  console.log(`⚠ ${notFound} attachment IDs not found`);
  
  // Step 5: Generate mapping CSV
  console.log('\nStep 5: Generating mapping file...');
  const csvPath = path.join(projectRoot, 'scripts', 'media-mapping.csv');
  const headers = Object.keys(mapping[0] || {});
  const csvContent = [
    headers.join(','),
    ...mapping.map(row =>
      headers.map(h => {
        const val = row[h] || '';
        return typeof val === 'string' && (val.includes(',') || val.includes('"'))
          ? `"${val.replace(/"/g, '""')}"`
          : val;
      }).join(',')
    )
  ].join('\n');
  
  await fs.writeFile(csvPath, csvContent, 'utf-8');
  console.log(`✓ Mapping saved to: scripts/media-mapping.csv\n`);
  
  console.log('📊 Recovery Summary:');
  console.log(`  • Total unique attachment IDs: ${requiredAttachments.size}`);
  console.log(`  • Successfully downloaded: ${downloaded}`);
  console.log(`  • Not found: ${notFound}`);
  console.log(`  • Failed: ${mapping.filter(m => m.status === 'DOWNLOAD_FAILED').length}`);
  console.log(`\n📁 Media files are in: src/assets/blog/`);
  console.log(`📋 Mapping CSV: scripts/media-mapping.csv\n`);
  
  // Step 6: Show next steps
  console.log('📝 Next Steps:');
  console.log('  1. Open scripts/media-mapping.csv in Excel or VS Code');
  console.log('  2. For each post, add the filename to the "image" field in frontmatter');
  console.log('  3. Update descriptions that reference attachment IDs');
  console.log('  4. Run: pnpm dev to verify images display correctly\n');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
