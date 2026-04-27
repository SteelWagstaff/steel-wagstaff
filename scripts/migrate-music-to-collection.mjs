#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, '..', '..', 'steelwagstaff', 'src', 'content', 'music');
const targetDir = path.join(__dirname, '..', 'src', 'content', 'music', 'en');

console.log('🎵 Music Playlists → Music Collection Migration\n');
console.log(`📖 Source: ${sourceDir}`);
console.log(`📝 Target: ${targetDir}\n`);

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.md'));
console.log(`📦 Found ${files.length} music playlists to migrate\n`);

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

    // Extract Spotify URL from body if not in frontmatter
    let spotifyUrl = frontmatter.spotify_url || '';
    if (!spotifyUrl) {
      const spotifyMatch = body.match(/https:\/\/open\.spotify\.com\/[^\s)]+/);
      if (spotifyMatch) {
        spotifyUrl = spotifyMatch[0];
      }
    }

    // Extract Spotify embed ID from URL
    let spotifyEmbedId = '';
    if (spotifyUrl) {
      const idMatch = spotifyUrl.match(/playlist\/([a-zA-Z0-9]+)/);
      if (idMatch) {
        spotifyEmbedId = idMatch[1];
      }
    }

    // Extract existing fields
    const title = (frontmatter.title || 'Untitled').toString();
    const date = frontmatter.publishedDate || new Date().toISOString().split('T')[0];
    const author = 'steel';

    // Generate description from body (remove Spotify link)
    let description = body.trim().replace(/https:\/\/open\.spotify\.com\/[^\s)]+/g, '').trim();
    if (description.length > 500) {
      description = description.slice(0, 500);
    }

    // Build tags (monthly playlists get "mixtape" tag)
    const tags = ['mixtape'];
    const yearMatch = date.match(/(\d{4})/);
    if (yearMatch) {
      tags.push(`y${yearMatch[1]}`);
    }

    // Build new frontmatter in Rocket schema
    const newFrontmatter = [
      `title: "${title.replace(/"/g, '\\"')}"`,
      description ? `description: "${description.replace(/"/g, '\\"')}"` : '',
      `publishedAt: ${date}`,
      `author: ${author}`,
      spotifyUrl ? `spotifyUrl: "${spotifyUrl}"` : '',
      spotifyEmbedId ? `spotifyEmbedId: "${spotifyEmbedId}"` : '',
      `tags: [${tags.map(t => `"${t}"`).join(', ')}]`,
      `draft: false`,
      `locale: en`,
    ].filter(Boolean).join('\n');

    const newContent = `---\n${newFrontmatter}\n---\n\n${description}\n`;

    // Write to target directory with same filename
    const targetPath = path.join(targetDir, filename);
    fs.writeFileSync(targetPath, newContent);

    migratedCount++;
    if (migratedCount % 10 === 0 || migratedCount === files.length) {
      console.log(`✅ [${index + 1}/${files.length}] Migrated ${migratedCount} playlists...`);
    }
  } catch (error) {
    console.error(`❌ Error migrating ${filename}:`, error.message);
    errorCount++;
  }
});

console.log(`\n✨ Migration Complete!`);
console.log(`✅ Successfully migrated: ${migratedCount} playlists`);
if (errorCount > 0) {
  console.log(`❌ Errors: ${errorCount} playlists`);
}
console.log(`\n📂 Playlists are now in: ${targetDir}`);
