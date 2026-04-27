#!/usr/bin/env node
/**
 * Update blog post frontmatter with recovered WordPress media
 * 
 * This script:
 * 1. Reads the media-mapping.csv
 * 2. For each blog post with attachments, adds the first successfully downloaded image to frontmatter
 * 3. Generates a report of updates made
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const blogContentDir = path.join(projectRoot, 'src/content/blog/en');
const mappingFile = path.join(__dirname, 'media-mapping.csv');

/**
 * Parse CSV file
 */
async function parseCsv(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  const headers = lines[0].split(',');
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = lines[i].split(',');
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }
  
  return rows;
}

/**
 * Parse frontmatter from markdown
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { frontmatter: '', body: content, lines: [] };
  
  const frontmatter = match[1];
  const body = content.slice(match[0].length);
  const lines = frontmatter.split('\n');
  
  return { frontmatter, body, lines };
}

/**
 * Update frontmatter with image reference
 */
function updateFrontmatter(lines, filename, imageAlt) {
  // Check if image field already exists
  const imageIndex = lines.findIndex(l => l.trim().startsWith('image:'));
  
  if (imageIndex !== -1) {
    // Replace existing image line
    lines[imageIndex] = `image: ../../assets/blog/${filename}`;
  } else {
    // Add after svgSlug or description if it exists
    let insertIndex = lines.length - 1;
    
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim().startsWith('svgSlug:') || 
          lines[i].trim().startsWith('description:') ||
          lines[i].trim().startsWith('featured:')) {
        insertIndex = i + 1;
        break;
      }
    }
    
    lines.splice(insertIndex, 0, `image: ../../assets/blog/${filename}`);
  }
  
  // Also add imageAlt if not present
  const altIndex = lines.findIndex(l => l.trim().startsWith('imageAlt:'));
  if (altIndex === -1 && imageAlt) {
    const imageIdx = lines.findIndex(l => l.trim().startsWith('image:'));
    if (imageIdx !== -1) {
      lines.splice(imageIdx + 1, 0, `imageAlt: "${imageAlt}"`);
    }
  }
  
  return lines;
}

/**
 * Main update process
 */
async function main() {
  console.log('📝 Updating blog post frontmatter with recovered images\n');
  
  // Step 1: Load mapping
  console.log('Step 1: Loading media mapping...');
  const mapping = await parseCsv(mappingFile);
  console.log(`✓ Loaded ${mapping.length} mapping entries\n`);
  
  // Group by post
  const postImages = new Map();
  for (const row of mapping) {
    if (row.status !== 'DOWNLOADED') continue;
    
    const posts = row.posts.split(';').map(p => p.trim()).filter(p => p);
    for (const post of posts) {
      if (!postImages.has(post)) {
        postImages.set(post, {
          filenames: [],
          attachmentIds: []
        });
      }
      postImages.get(post).filenames.push(row.filename);
      postImages.get(post).attachmentIds.push(row.attachmentId);
    }
  }
  
  console.log(`Step 2: Found ${postImages.size} posts with recovered images\n`);
  
  // Step 3: Update frontmatter
  console.log('Step 3: Updating blog post frontmatter...\n');
  const updates = [];
  
  for (const [postName, imageData] of postImages) {
    const postPath = path.join(blogContentDir, postName);
    
    try {
      const content = await fs.readFile(postPath, 'utf-8');
      const { frontmatter, body, lines } = parseFrontmatter(content);
      
      // Get the primary image (first downloaded one)
      const filename = imageData.filenames[0];
      const imageAlt = `Image from ${postName}`;
      
      // Update lines
      const updatedLines = updateFrontmatter(lines, filename, imageAlt);
      const newFrontmatter = updatedLines.join('\n');
      
      // Reconstruct file
      const newContent = `---\n${newFrontmatter}\n---${body}`;
      
      // Write back
      await fs.writeFile(postPath, newContent, 'utf-8');
      
      updates.push({
        post: postName,
        status: 'UPDATED',
        images: imageData.filenames.length,
        primary: filename
      });
      
      console.log(`  ✓ ${postName}`);
      console.log(`    → ${filename}`);
      
    } catch (error) {
      updates.push({
        post: postName,
        status: 'ERROR',
        error: error.message
      });
      console.log(`  ✗ ${postName}: ${error.message}`);
    }
  }
  
  // Step 4: Summary
  console.log('\n📊 Update Summary:');
  const successful = updates.filter(u => u.status === 'UPDATED').length;
  const failed = updates.filter(u => u.status === 'ERROR').length;
  
  console.log(`  • Posts updated: ${successful}`);
  console.log(`  • Failed: ${failed}`);
  console.log(`  • Total images added: ${updates.reduce((sum, u) => sum + (u.images || 0), 0)}`);
  
  // Step 5: Show next steps
  console.log('\n📝 Next Steps:');
  console.log('  1. Run: pnpm dev');
  console.log('  2. Visit a few blog posts to verify images display');
  console.log('  3. Check for any posts still missing featured images');
  console.log('  4. Manually add SVG backgrounds (svgSlug field) for posts that need them\n');
  
  // Save report
  const reportPath = path.join(__dirname, 'frontmatter-update-report.json');
  await fs.writeFile(reportPath, JSON.stringify(updates, null, 2), 'utf-8');
  console.log(`📋 Detailed report: scripts/frontmatter-update-report.json\n`);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
