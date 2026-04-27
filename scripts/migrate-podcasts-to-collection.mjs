#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, '..', '..', 'steelwagstaff', 'src', 'content', 'podcast');
const targetDir = path.join(__dirname, '..', 'src', 'content', 'podcasts', 'en');

console.log('🎙️ Podcasts → Podcasts Collection Migration\n');
console.log(`📖 Source: ${sourceDir}`);
console.log(`📝 Target: ${targetDir}\n`);

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Sanitize strings for YAML by escaping problematic characters
const sanitizeYaml = (str) => {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')      // backslashes first
    .replace(/"/g, '\\"')         // double quotes
    .replace(/\n/g, ' ')          // newlines
    .replace(/\t/g, ' ');         // tabs
};

const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.md'));
console.log(`📦 Found ${files.length} podcast episodes to migrate\n`);

let migratedCount = 0;
let errorCount = 0;

files.forEach((filename, index) => {
  try {
    const filePath = path.join(sourceDir, filename);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Parse frontmatter and body
    const fmRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = content.match(fmRegex);

    if (!match) {
      console.warn(`⚠️  [${index + 1}/${files.length}] Skipping ${filename} (invalid frontmatter)`);
      errorCount++;
      return;
    }

    const [, frontmatterStr, body] = match;

    // Parse YAML frontmatter (simple parser)
    const frontmatter = {};
    frontmatterStr.split('\n').forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim();

        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }

        frontmatter[key] = value;
      }
    });

    // Extract existing fields
    const title = (frontmatter.title || 'Untitled').toString();
    const date = frontmatter.publishedDate || new Date().toISOString().split('T')[0];
    const author = 'steel';
    const audioUrl = frontmatter.mp3_url || '';

    // Determine podcast name and extract episode number
    let podcast = 'Off the Chain'; // default
    let episode = index + 1;
    
    // Extract episode number from filename (e.g., "episode-1-..." or "episode-10-...")
    const episodeMatch = filename.match(/episode-(\d+)/i);
    if (episodeMatch) {
      episode = parseInt(episodeMatch[1], 10);
    }

    // Determine podcast from title or filename
    if (filename.includes('theme') || title.includes('Theme Songs')) {
      podcast = 'Theme Songs';
    }

    // Generate description from body
    let description = body.trim();
    if (description.length > 1000) {
      description = description.slice(0, 1000) + '...';
    }

    // Extract tags from title (e.g., comic book mentions, music mentions)
    const tags = [];
    if (title.match(/comic|marvel|dc|superhero/i)) tags.push('comics');
    if (title.match(/music|song|album|artist/i)) tags.push('music');
    if (title.match(/movie|film|actor|cinema/i)) tags.push('film');
    if (title.match(/book|novel|author/i)) tags.push('books');

    // Build new frontmatter in Rocket schema
    const newFrontmatter = [
      `title: "${sanitizeYaml(title)}"`,
      description ? `description: "${sanitizeYaml(description)}"` : '',
      `publishedAt: ${date}`,
      `author: ${author}`,
      `podcast: "${podcast}"`,
      `episode: ${episode}`,
      audioUrl ? `audioUrl: "${audioUrl}"` : '',
      `tags: [${tags.map(t => `"${t}"`).join(', ')}]`,
      `draft: false`,
      `locale: en`,
    ].filter(Boolean).join('\n');

    const newContent = `---\n${newFrontmatter}\n---\n\n${sanitizeYaml(description)}\n`;

    // Write to target directory with same filename
    const targetPath = path.join(targetDir, filename);
    fs.writeFileSync(targetPath, newContent);

    migratedCount++;
    if (migratedCount % 10 === 0 || migratedCount === files.length) {
      console.log(`✅ [${index + 1}/${files.length}] Migrated ${migratedCount} episodes...`);
    }
  } catch (error) {
    console.error(`❌ Error migrating ${filename}:`, error.message);
    errorCount++;
  }
});

console.log(`\n✨ Migration Complete!`);
console.log(`✅ Successfully migrated: ${migratedCount} episodes`);
if (errorCount > 0) {
  console.log(`❌ Errors: ${errorCount} episodes`);
}
console.log(`\n📂 Episodes are now in: ${targetDir}`);
