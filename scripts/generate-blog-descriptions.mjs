#!/usr/bin/env node
/**
 * generate-blog-descriptions.mjs
 * Populates blank 'description' fields in blog post frontmatter using Claude.
 *
 * Usage:
 *   node scripts/generate-blog-descriptions.mjs
 *
 * Requires:
 *   ANTHROPIC_API_KEY in .env (or environment)
 *
 * Skips posts that already have a non-empty description.
 * Processes posts with a 200ms delay between API calls to avoid rate limits.
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = join(__dirname, '../src/content/blog/en');

// Load .env manually (no dotenv dependency needed)
function loadEnv() {
  try {
    const env = readFileSync(join(__dirname, '../.env'), 'utf-8');
    for (const line of env.split('\n')) {
      const [key, ...rest] = line.split('=');
      if (key && rest.length) {
        process.env[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  } catch {
    // .env not found — rely on environment variables
  }
}

loadEnv();

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function extractFrontmatterAndBody(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;
  return { frontmatter: match[1], body: match[2] };
}

function hasBlankDescription(frontmatter) {
  return /^description:\s*""?\s*$/m.test(frontmatter);
}

async function generateDescription(title, body) {
  // Truncate body to ~2000 chars to stay within token limits
  const excerpt = body.trim().slice(0, 2000);
  const message = await client.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 100,
    messages: [
      {
        role: 'user',
        content: `Write a single sentence (under 160 characters) summarising this blog post. Return only the sentence, no quotes, no explanation.\n\nTitle: ${title}\n\n${excerpt}`,
      },
    ],
  });
  const text = message.content[0]?.type === 'text' ? message.content[0].text.trim() : '';
  // Ensure it fits in 160 chars
  return text.slice(0, 158);
}

function extractTitle(frontmatter) {
  const match = frontmatter.match(/^title:\s*"(.*)"\s*$/m);
  return match ? match[1].replace(/\\"/g, '"') : '';
}

function updateDescription(frontmatter, description) {
  const escaped = description.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return frontmatter.replace(/^description:\s*""?\s*$/m, `description: "${escaped}"`);
}

async function main() {
  const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'));
  const toProcess = [];

  for (const file of files) {
    const content = readFileSync(join(BLOG_DIR, file), 'utf-8');
    const parsed = extractFrontmatterAndBody(content);
    if (!parsed) continue;
    if (hasBlankDescription(parsed.frontmatter)) {
      toProcess.push({ file, content, ...parsed });
    }
  }

  console.log(`Found ${toProcess.length} posts with blank descriptions`);

  let done = 0;
  let failed = 0;

  for (const { file, content, frontmatter, body } of toProcess) {
    const title = extractTitle(frontmatter);
    try {
      const description = await generateDescription(title, body);
      const newFrontmatter = updateDescription(frontmatter, description);
      const newContent = content.replace(frontmatter, newFrontmatter);
      writeFileSync(join(BLOG_DIR, file), newContent, 'utf-8');
      done++;
      console.log(`  ✓ ${file.slice(0, 50)}: "${description.slice(0, 60)}..."`);
    } catch (err) {
      failed++;
      console.warn(`  ✗ ${file}: ${err.message}`);
    }

    // Polite delay between API calls
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\nDone: ${done} descriptions written, ${failed} failed`);
}

main().catch((err) => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
