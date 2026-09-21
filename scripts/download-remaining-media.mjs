#!/usr/bin/env node
/**
 * Download images still referenced by dead WordPress URLs (per
 * scripts/dead-image-repair-report.json) into media-exports/, then leave
 * repair-dead-image-urls.mjs to wire them into posts on the next run.
 *
 * Usage:
 *   node scripts/download-remaining-media.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import http from 'node:http';

const projectRoot = process.cwd();
const reportPath = path.join(projectRoot, 'scripts', 'dead-image-repair-report.json');
const mediaExportsDir = path.join(projectRoot, 'media-exports');
const resultPath = path.join(projectRoot, 'scripts', 'download-remaining-media-report.json');

function basenameFromUrl(url) {
  return decodeURIComponent(url.split('?')[0].split('/').pop() ?? '');
}

function download(url, destPath, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client
      .get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (media-recovery-script)' } }, (res) => {
        if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location && redirectsLeft > 0) {
          res.resume();
          download(res.headers.location, destPath, redirectsLeft - 1).then(resolve, reject);
          return;
        }
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const file = fs.createWriteStream(destPath);
        res.pipe(file);
        file.on('finish', () => file.close(() => resolve()));
        file.on('error', reject);
      })
      .on('error', reject);
  });
}

async function main() {
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const urls = [...new Set(report.missing.map((item) => item.originalUrl))];

  fs.mkdirSync(mediaExportsDir, { recursive: true });

  const downloaded = [];
  const failed = [];

  for (const url of urls) {
    const filename = basenameFromUrl(url);
    const destPath = path.join(mediaExportsDir, filename);
    if (fs.existsSync(destPath)) {
      downloaded.push({ url, filename, status: 'already-present' });
      continue;
    }
    try {
      await download(url, destPath);
      downloaded.push({ url, filename, status: 'downloaded' });
      console.log(`  ✓ ${filename}`);
    } catch (err) {
      failed.push({ url, filename, error: err.message });
      console.warn(`  ✗ ${filename}: ${err.message}`);
    }
  }

  fs.writeFileSync(resultPath, JSON.stringify({ downloaded, failed }, null, 2));
  console.log(`\nDownloaded ${downloaded.filter((d) => d.status === 'downloaded').length} new files.`);
  console.log(`Already present: ${downloaded.filter((d) => d.status === 'already-present').length}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Report written to ${path.relative(projectRoot, resultPath)}`);
}

main().catch((err) => {
  console.error('❌ Download failed:', err);
  process.exit(1);
});
