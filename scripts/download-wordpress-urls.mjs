#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const MISSING_FILES = {
  'short_history.jpg': null,
  'img_0029.jpg': 'https://steelwagstaff.files.wordpress.com/2012/05/img_0029.jpg',
  'img_0030.jpg': 'https://steelwagstaff.files.wordpress.com/2012/05/img_0030.jpg',
  'img_0032.jpg': 'https://steelwagstaff.files.wordpress.com/2012/05/img_0032.jpg',
  'img_0038.jpg': 'https://steelwagstaff.files.wordpress.com/2012/05/img_0038.jpg',
  'img_0044.jpg': 'https://steelwagstaff.files.wordpress.com/2012/05/img_0044.jpg',
  'img_0046.jpg': 'https://steelwagstaff.files.wordpress.com/2012/05/img_0046.jpg',
  'img_0049.jpg': 'https://steelwagstaff.files.wordpress.com/2012/05/img_0049.jpg',
  'img_0051.jpg': 'https://steelwagstaff.files.wordpress.com/2012/05/img_0051.jpg',
  'img_0276.jpg': 'https://steelwagstaff.files.wordpress.com/2012/05/img_0276.jpg',
  'img_0283.jpg': 'https://steelwagstaff.files.wordpress.com/2012/05/img_0283.jpg',
  'img_0285.jpg': 'https://steelwagstaff.files.wordpress.com/2012/05/img_0285.jpg',
  'img_0292.jpg': 'https://steelwagstaff.files.wordpress.com/2012/05/img_0292.jpg',
  'img_0295.jpg': 'https://steelwagstaff.files.wordpress.com/2012/05/img_0295.jpg',
  'img_0296.jpg': 'https://steelwagstaff.files.wordpress.com/2012/05/img_0296.jpg',
  'img_0299.jpg': 'https://steelwagstaff.files.wordpress.com/2012/05/img_0299.jpg',
  'tina_van_zile.jpg': null,
  '300px-EzraPound_Passport.png': null,
  'img_0457.jpg': null,
  '513pBo1mKBL.jpg': null,
  'barber_science.jpg': null,
  '7207469674_e9f7c8c055_o.jpg': null,
  '7207510968_8f8f147388_o.jpg': null,
  '7207509598_0799cc8074_o.jpg': null,
  'Rakosi_radio.jpg': null,
  'back_of_dress.jpg': null,
  '4707219428_d8f336f73b_b.jpg': null
};

// Read URLs from file
const urls = fs.readFileSync('/tmp/media_urls.txt', 'utf-8').trim().split('\n');
const urlsByFilename = new Map();

for (const url of urls) {
  const filename = path.basename(url);
  urlsByFilename.set(filename, url);
}

console.log(`📋 Found ${urls.length} total URLs in XML`);
console.log(`🎯 Looking for ${Object.keys(MISSING_FILES).length} missing files\n`);

let downloaded = 0;
let notFound = [];
let results = [];

for (const [filename, providedUrl] of Object.entries(MISSING_FILES)) {
  const url = providedUrl || urlsByFilename.get(filename);
  const filepath = path.join('src/assets/blog', filename);

  if (!url) {
    results.push(`⏭️  ${filename}: Not found in URLs`);
    notFound.push(filename);
    continue;
  }

  // Check if already exists
  if (fs.existsSync(filepath)) {
    const stats = fs.statSync(filepath);
    results.push(`✅ ${filename} (${(stats.size / 1024).toFixed(1)}KB) - already exists`);
    downloaded++;
    continue;
  }

  // Download
  try {
    const cmd = `curl -s -o "${filepath}" "${url}"`;
    execSync(cmd);
    
    if (fs.existsSync(filepath)) {
      const stats = fs.statSync(filepath);
      results.push(`✅ ${filename} (${(stats.size / 1024).toFixed(1)}KB)`);
      downloaded++;
    } else {
      results.push(`❌ ${filename}: Download failed (no file)`);
    }
  } catch (err) {
    results.push(`❌ ${filename}: ${err.message}`);
  }
}

console.log('='.repeat(70));
console.log('DOWNLOAD RESULTS');
console.log('='.repeat(70));
results.forEach(r => console.log(r));
console.log('='.repeat(70));
console.log(`\n✨ Downloaded: ${downloaded}/${Object.keys(MISSING_FILES).length} files`);

if (notFound.length > 0) {
  console.log(`\n⚠️  Still missing (${notFound.length}):`);
  notFound.forEach(f => console.log(`   - ${f}`));
}
