#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, '..', '..', 'steelwagstaff', 'src', 'content', 'tumblr');

console.log('🔧 Tumblr Import Quality Repair\n');

// HTML entity decoder - handles all common entities
const decodeHtmlEntities = (text) => {
  if (!text) return '';
  
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&lsquo;': "'",
    '&rsquo;': "'",
    '&ndash;': '–',
    '&mdash;': '—',
    '&hellip;': '…',
    '&#39;': "'",
    '&#8217;': "'",
    '&#8216;': "'",
    '&#8220;': '"',
    '&#8221;': '"',
    '&#8212;': '—',
    '&#8211;': '–',
    '&nbsp;': ' ',
  };

  let decoded = text;
  Object.entries(entities).forEach(([entity, char]) => {
    const escapedEntity = entity.replace(/[&;]/g, '\\$&');
    decoded = decoded.replace(new RegExp(escapedEntity, 'g'), char);
  });

  // Handle numeric entities
  decoded = decoded.replace(/&#(\d+);/g, (match, dec) => {
    try {
      return String.fromCharCode(parseInt(dec, 10));
    } catch {
      return match;
    }
  });
  decoded = decoded.replace(/&#x([a-fA-F0-9]+);/g, (match, hex) => {
    try {
      return String.fromCharCode(parseInt(hex, 16));
    } catch {
      return match;
    }
  });

  return decoded;
};

// HTML tag stripper - removes HTML tags
const stripHtmlTags = (text) => {
  if (!text) return '';
  return text
    .replace(/<p>/g, '')
    .replace(/<\/p>/g, '\n\n')
    .replace(/<[^>]*>/g, '')
    .trim();
};

// Generate title from content
const generateTitle = (content, quoteText, postId) => {
  // If quote text exists, use first 60 chars
  if (quoteText && quoteText.trim()) {
    const cleaned = stripHtmlTags(decodeHtmlEntities(quoteText));
    const firstLine = cleaned.split('\n')[0].trim();
    if (firstLine.length > 0) {
      return firstLine.substring(0, 60) + (firstLine.length > 60 ? '…' : '');
    }
  }

  // If content exists, use first 60 chars
  if (content && content.trim()) {
    const cleaned = stripHtmlTags(decodeHtmlEntities(content));
    const firstLine = cleaned.split('\n')[0].trim();
    if (firstLine.length > 0) {
      return firstLine.substring(0, 60) + (firstLine.length > 60 ? '…' : '');
    }
  }

  // Fallback: use post ID with friendly format
  return `Post ${postId.substring(0, 8)}`;
};

// Generate description from content
const generateDescription = (content, quoteText) => {
  const text = quoteText || content;
  if (!text || !text.trim()) return '';

  const cleaned = stripHtmlTags(decodeHtmlEntities(text));
  const words = cleaned.split(/\s+/);
  const truncated = words.slice(0, 30).join(' ');
  return truncated + (words.length > 30 ? '…' : '');
};

// Parse frontmatter
const parseFrontmatter = (fmStr) => {
  const fm = {};
  const lines = fmStr.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const colonIndex = line.indexOf(':');
    
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();
      
      // Handle quoted values
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      // Handle arrays
      if (value.startsWith('[') && value.endsWith(']')) {
        try {
          fm[key] = JSON.parse(value);
        } catch {
          fm[key] = value;
        }
      } else {
        fm[key] = value;
      }
    }
  }
  
  return fm;
};

// Serialize frontmatter
const serializeFrontmatter = (fm) => {
  const lines = [];
  
  Object.entries(fm).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      lines.push(`${key}: ${JSON.stringify(value)}`);
    } else if (typeof value === 'string') {
      // Escape quotes and wrap in quotes
      const escaped = value.replace(/"/g, '\\"');
      lines.push(`${key}: "${escaped}"`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  });
  
  return lines.join('\n');
};

// Repair a single post
const repairPost = (filename, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fmRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = content.match(fmRegex);

    if (!match) {
      return { status: 'error', reason: 'Invalid frontmatter format' };
    }

    const [, frontmatterStr, body] = match;
    const fm = parseFrontmatter(frontmatterStr);

    let changed = false;
    const changes = [];

    // 1. Decode HTML entities in all fields
    const fieldsToClean = ['quote_text', 'quote_source', 'photo_alt', 'title', 'description', 'content'];
    fieldsToClean.forEach(field => {
      if (fm[field] && typeof fm[field] === 'string' && /&[a-z]+;|&#\d+;|&#x[a-f0-9]+;/i.test(fm[field])) {
        const original = fm[field];
        fm[field] = decodeHtmlEntities(fm[field]);
        if (fm[field] !== original) {
          changed = true;
          changes.push(`decoded_${field}`);
        }
      }
    });

    // 2. Generate title if missing
    if (!fm.title || fm.title.trim() === '') {
      fm.title = generateTitle(body, fm.quote_text, filename);
      changed = true;
      changes.push('generated_title');
    }

    // 3. Generate description if missing and needed
    if (!fm.description || fm.description.trim() === '') {
      const desc = generateDescription(body, fm.quote_text);
      if (desc) {
        fm.description = desc;
        changed = true;
        changes.push('generated_description');
      }
    }

    // 4. Clean up empty quote fields (if quote_text is empty but source exists, remove both)
    if (fm.post_type === 'quote' && (!fm.quote_text || fm.quote_text.trim() === '')) {
      if (fm.quote_text !== undefined) {
        delete fm.quote_text;
        changed = true;
        changes.push('removed_empty_quote_text');
      }
    }

    // Write back if changed
    if (changed) {
      const newFrontmatter = serializeFrontmatter(fm);
      const newContent = `---\n${newFrontmatter}\n---\n${body}`;
      fs.writeFileSync(filePath, newContent, 'utf-8');
      return { status: 'repaired', changes };
    }

    return { status: 'clean' };
  } catch (error) {
    return { status: 'error', reason: error.message };
  }
};

// Main processing
const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.md'));
console.log(`📦 Processing ${files.length} Tumblr posts\n`);

let stats = {
  total: 0,
  repaired: 0,
  clean: 0,
  errors: 0,
  changeTypes: {},
};

files.forEach((filename, idx) => {
  const filePath = path.join(sourceDir, filename);
  const result = repairPost(filename, filePath);

  stats.total++;

  if (result.status === 'repaired') {
    stats.repaired++;
    result.changes.forEach(change => {
      stats.changeTypes[change] = (stats.changeTypes[change] || 0) + 1;
    });

    // Progress indicator every 100 posts
    if ((idx + 1) % 100 === 0) {
      process.stdout.write(`✓ Processed ${idx + 1}/${files.length}\r`);
    }
  } else if (result.status === 'clean') {
    stats.clean++;
  } else if (result.status === 'error') {
    stats.errors++;
    if (stats.errors <= 5) {
      console.error(`\n❌ Error in ${filename}: ${result.reason}`);
    }
  }
});

console.log('\n');
console.log('✅ Repair Complete!\n');
console.log('📊 Repair Statistics:');
console.log(`   Total posts processed: ${stats.total}`);
console.log(`   Repaired: ${stats.repaired} (${((stats.repaired / stats.total) * 100).toFixed(1)}%)`);
console.log(`   Already clean: ${stats.clean} (${((stats.clean / stats.total) * 100).toFixed(1)}%)`);
console.log(`   Errors: ${stats.errors} (${((stats.errors / stats.total) * 100).toFixed(1)}%)`);

console.log('\n📝 Changes Applied:');
Object.entries(stats.changeTypes)
  .sort((a, b) => b[1] - a[1])
  .forEach(([change, count]) => {
    console.log(`   ${change}: ${count} posts`);
  });

console.log(`\n✨ Tumblr import quality improved!`);
