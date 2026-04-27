#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, '..', '..', 'steelwagstaff', 'src', 'content', 'tumblr');

console.log('🔍 Tumblr Import Quality Audit\n');
console.log(`📖 Source: ${sourceDir}\n`);

// HTML entity decoder
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
    decoded = decoded.replace(new RegExp(entity.replace(/&/g, '\\&').replace(/;/g, '\\;'), 'g'), char);
  });

  // Handle numeric entities
  decoded = decoded.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(parseInt(dec, 10)));
  decoded = decoded.replace(/&#x([a-fA-F0-9]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));

  return decoded;
};

const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.md'));
console.log(`📦 Found ${files.length} Tumblr posts\n`);

// Audit categories
let issues = {
  emptyTitle: [],
  emptyContent: [],
  htmlEntities: [],
  brokenUrls: [],
  emptyQuotes: [],
  noDescription: [],
  total: 0,
};

// Sample and audit files
const sampleSize = Math.min(100, files.length);
const sampleFiles = files.sort(() => Math.random() - 0.5).slice(0, sampleSize);

console.log(`🔬 Sampling ${sampleSize} posts for quality issues...\n`);

sampleFiles.forEach((filename) => {
  try {
    const filePath = path.join(sourceDir, filename);
    const content = fs.readFileSync(filePath, 'utf-8');

    const fmRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = content.match(fmRegex);

    if (!match) return;

    const [, frontmatterStr, body] = match;

    // Parse frontmatter
    const frontmatter = {};
    frontmatterStr.split('\n').forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        frontmatter[key] = value;
      }
    });

    // Audit checks
    if (!frontmatter.title || frontmatter.title.trim() === '') {
      issues.emptyTitle.push(filename);
    }

    if (!body || body.trim() === '') {
      issues.emptyContent.push(filename);
    }

    const allText = JSON.stringify(frontmatter) + body;
    if (/&[a-z]+;|&#\d+;|&#x[a-f0-9]+;/i.test(allText)) {
      issues.htmlEntities.push(filename);
    }

    if (frontmatter.quote_text && frontmatter.quote_text.trim() === '') {
      issues.emptyQuotes.push(filename);
    }

    if (!frontmatter.description && body.trim().length === 0) {
      issues.noDescription.push(filename);
    }

    if (frontmatter.photo_url && frontmatter.photo_url.includes('/images/tumblr/')) {
      // Check if file exists
      const photoPath = path.join(__dirname, '..', '..', 'steelwagstaff', 'public', frontmatter.photo_url);
      if (!fs.existsSync(photoPath)) {
        issues.brokenUrls.push(filename);
      }
    }

    issues.total++;
  } catch (error) {
    // Skip errors
  }
});

console.log('📊 Quality Audit Results:');
console.log(`   Total posts sampled: ${issues.total}`);
console.log(`   ⚠️  Empty titles: ${issues.emptyTitle.length} (${((issues.emptyTitle.length / issues.total) * 100).toFixed(1)}%)`);
console.log(`   ⚠️  Empty content: ${issues.emptyContent.length} (${((issues.emptyContent.length / issues.total) * 100).toFixed(1)}%)`);
console.log(`   ⚠️  HTML entities: ${issues.htmlEntities.length} (${((issues.htmlEntities.length / issues.total) * 100).toFixed(1)}%)`);
console.log(`   ⚠️  Broken URLs: ${issues.brokenUrls.length} (${((issues.brokenUrls.length / issues.total) * 100).toFixed(1)}%)`);
console.log(`   ⚠️  Empty quotes: ${issues.emptyQuotes.length} (${((issues.emptyQuotes.length / issues.total) * 100).toFixed(1)}%)`);
console.log(`   ⚠️  No description: ${issues.noDescription.length} (${((issues.noDescription.length / issues.total) * 100).toFixed(1)}%)`);

console.log(`\n💡 Estimated full dataset issues (extrapolated from sample):`);
console.log(`   Empty titles: ~${Math.round((issues.emptyTitle.length / issues.total) * files.length)}`);
console.log(`   HTML entities: ~${Math.round((issues.htmlEntities.length / issues.total) * files.length)}`);
console.log(`   Broken URLs: ~${Math.round((issues.brokenUrls.length / issues.total) * files.length)}`);

console.log(`\n📝 Sample files with issues:`);
if (issues.emptyTitle.length > 0) {
  console.log(`   Empty titles: ${issues.emptyTitle.slice(0, 3).join(', ')}`);
}
if (issues.htmlEntities.length > 0) {
  console.log(`   HTML entities: ${issues.htmlEntities.slice(0, 3).join(', ')}`);
}
if (issues.brokenUrls.length > 0) {
  console.log(`   Broken URLs: ${issues.brokenUrls.slice(0, 3).join(', ')}`);
}
