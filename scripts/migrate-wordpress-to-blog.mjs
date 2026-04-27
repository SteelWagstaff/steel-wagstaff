#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, '..', '..', 'steelwagstaff', 'src', 'content', 'wordpress');
const targetDir = path.join(__dirname, '..', 'src', 'content', 'blog', 'en');

console.log('🚀 WordPress → Blog Migration\n');
console.log(`📖 Source: ${sourceDir}`);
console.log(`📝 Target: ${targetDir}\n`);

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.md'));
console.log(`📦 Found ${files.length} WordPress posts to migrate\n`);

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

        // Handle arrays (simple case: [item1, item2])
        if (value.startsWith('[') && value.endsWith(']')) {
          const arrayStr = value.slice(1, -1);
          frontmatter[key] = arrayStr.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        } else {
          frontmatter[key] = value;
        }
      }
    });

    // Sanitize strings for YAML
    const sanitizeYaml = (str) => {
      if (!str) return '';
      return str
        .replace(/\\/g, '\\\\')      // backslashes first
        .replace(/"/g, '\\"')         // double quotes
        .replace(/\n/g, ' ')          // newlines -> spaces
        .replace(/\t/g, ' ')          // tabs -> spaces
        .replace(/\r/g, '');          // carriage returns
    };

    // Extract existing fields
    const title = (frontmatter.title || 'Untitled').toString();
    const date = frontmatter.date || new Date().toISOString().split('T')[0];
    const author = (frontmatter.author || 'steel').toString();
    const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : (frontmatter.tags ? [frontmatter.tags] : []);

    // Generate description from first paragraph of body
    let description = '';
    const bodyLines = body.trim().split('\n');
    for (const line of bodyLines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        description = trimmed.replace(/\[.*?\]\(.*?\)/g, '').slice(0, 200);
        break;
      }
    }
    if (!description) {
      description = 'A blog post by Steel Wagstaff';
    }

    // Build new frontmatter in Rocket schema
    const newFrontmatter = [
      `title: "${sanitizeYaml(title)}"`,
      `description: "${sanitizeYaml(description)}"`,
      `publishedAt: ${date}`,
      `author: ${author}`,
      `tags: [${tags.map(t => `"${t}"`).join(', ')}]`,
      `draft: false`,
      `locale: en`,
    ].join('\n');

    const newContent = `---\n${newFrontmatter}\n---\n\n${body}`;

    // Write to target directory with same filename
    const targetPath = path.join(targetDir, filename);
    fs.writeFileSync(targetPath, newContent);

    migratedCount++;
    if (migratedCount % 50 === 0 || migratedCount === files.length) {
      console.log(`✅ [${index + 1}/${files.length}] Migrated ${migratedCount} posts...`);
    }
  } catch (error) {
    console.error(`❌ Error migrating ${filename}:`, error.message);
    errorCount++;
  }
});

console.log(`\n✨ Migration Complete!`);
console.log(`✅ Successfully migrated: ${migratedCount} posts`);
if (errorCount > 0) {
  console.log(`❌ Errors: ${errorCount} posts`);
}
console.log(`\n📂 Posts are now in: ${targetDir}`);
