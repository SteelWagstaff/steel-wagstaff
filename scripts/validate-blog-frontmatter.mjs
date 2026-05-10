#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

async function validateBlogFrontmatter() {
  const blogDir = 'src/content/blog';
  const files = await glob(`${blogDir}/**/*.md`);

  console.log(`📋 Validating ${files.length} blog posts...\n`);

  const issues = {
    missing_title: [],
    missing_publishedAt: [],
    invalid_date: [],
    missing_locale: [],
    non_array_tags: [],
    other: []
  };

  let valid = 0;

  for (const filepath of files) {
    const content = fs.readFileSync(filepath, 'utf-8');
    const match = content.match(/^---\n([\s\S]*?)\n---/);

    if (!match) {
      issues.other.push(`${filepath}: No frontmatter found`);
      continue;
    }

    const frontmatter = match[1];
    const lines = frontmatter.split('\n');
    const fm = {};

    // Parse YAML-like frontmatter
    for (const line of lines) {
      if (!line.trim()) continue;
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();
      fm[key.trim()] = value;
    }

    // Validate required fields
    const errors = [];

    if (!fm.title) {
      errors.push('missing title');
      issues.missing_title.push(filepath);
    }

    if (!fm.publishedAt) {
      errors.push('missing publishedAt');
      issues.missing_publishedAt.push(filepath);
    } else if (!/^\d{4}-\d{2}-\d{2}/.test(fm.publishedAt)) {
      errors.push(`invalid publishedAt format: "${fm.publishedAt}"`);
      issues.invalid_date.push(filepath);
    }

    if (!fm.locale) {
      errors.push('missing locale');
      issues.missing_locale.push(filepath);
    }

    // Check tags format (should be array)
    if (fm.tags && !fm.tags.startsWith('[')) {
      errors.push(`tags not in array format: "${fm.tags}"`);
      issues.non_array_tags.push(filepath);
    }

    if (errors.length === 0) {
      valid++;
    } else {
      console.log(`❌ ${path.basename(filepath)}`);
      errors.forEach(e => console.log(`   ⚠️  ${e}`));
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Valid: ${valid}/${files.length}`);
  console.log(`❌ Issues found: ${files.length - valid}`);

  if (issues.missing_title.length > 0) {
    console.log(`\n🔴 Missing title (${issues.missing_title.length}):`);
    issues.missing_title.forEach(f => console.log(`   ${path.basename(f)}`));
  }

  if (issues.missing_publishedAt.length > 0) {
    console.log(`\n🔴 Missing publishedAt (${issues.missing_publishedAt.length}):`);
    issues.missing_publishedAt.forEach(f => console.log(`   ${path.basename(f)}`));
  }

  if (issues.invalid_date.length > 0) {
    console.log(`\n🟡 Invalid date format (${issues.invalid_date.length}):`);
    issues.invalid_date.forEach(f => console.log(`   ${path.basename(f)}`));
  }

  if (issues.missing_locale.length > 0) {
    console.log(`\n🔴 Missing locale (${issues.missing_locale.length}):`);
    issues.missing_locale.forEach(f => console.log(`   ${path.basename(f)}`));
  }

  if (issues.non_array_tags.length > 0) {
    console.log(`\n🟡 Tags not in array format (${issues.non_array_tags.length}):`);
    issues.non_array_tags.forEach(f => console.log(`   ${path.basename(f)}`));
  }

  if (issues.other.length > 0) {
    console.log(`\n🔴 Other issues (${issues.other.length}):`);
    issues.other.forEach(f => console.log(`   ${f}`));
  }
}

validateBlogFrontmatter().catch(console.error);
