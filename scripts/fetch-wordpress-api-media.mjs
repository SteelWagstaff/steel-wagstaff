#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import https from 'https';

const MISSING_FILES = [
  'short_history.jpg',
  'img_0029.jpg', 'img_0030.jpg', 'img_0032.jpg', 'img_0038.jpg', 'img_0044.jpg',
  'img_0046.jpg', 'img_0049.jpg', 'img_0051.jpg', 'img_0276.jpg', 'img_0283.jpg',
  'img_0285.jpg', 'img_0292.jpg', 'img_0295.jpg', 'img_0296.jpg', 'img_0299.jpg',
  'tina_van_zile.jpg',
  '300px-EzraPound_Passport.png',
  'img_0457.jpg',
  '513pBo1mKBL.jpg',
  'barber_science.jpg',
  '7207469674_e9f7c8c055_o.jpg',
  '7207510968_8f8f147388_o.jpg',
  '7207509598_0799cc8074_o.jpg',
  'Rakosi_radio.jpg',
  'back_of_dress.jpg',
  '4707219428_d8f336f73b_b.jpg'
];

async function fetchWordPressMedia() {
  console.log('🔍 Querying WordPress REST API...');
  
  try {
    const response = await fetch('https://steelwagstaff.wordpress.com/wp-json/wp/v2/media?per_page=100');
    const media = await response.json();
    
    if (!Array.isArray(media)) {
      console.log('❌ API returned non-array response or error');
      return [];
    }

    console.log(`✅ Found ${media.length} media items in API\n`);
    
    // Build map of filename -> URL
    const mediaMap = new Map();
    for (const item of media) {
      if (item.source_url) {
        const filename = path.basename(item.source_url);
        mediaMap.set(filename, item.source_url);
        // Also store by slug
        if (item.slug) {
          mediaMap.set(item.slug, item.source_url);
        }
      }
    }

    return mediaMap;
  } catch (err) {
    console.log(`❌ Error querying API: ${err.message}\n`);
    return new Map();
  }
}

async function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const file = fs.createWriteStream(filepath);
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(true);
        });
      } else {
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

async function main() {
  const mediaMap = await fetchWordPressMedia();
  
  if (mediaMap.size === 0) {
    console.log('⚠️  No media found in API. Trying fallback URL patterns...\n');
    return;
  }

  let downloaded = 0;
  const downloadLog = [];

  for (const filename of MISSING_FILES) {
    const url = mediaMap.get(filename);
    
    if (url) {
      const filepath = path.join('src/assets/blog', filename);
      
      try {
        console.log(`⏳ Downloading ${filename}...`);
        await downloadFile(url, filepath);
        const stats = fs.statSync(filepath);
        downloaded++;
        downloadLog.push(`✅ ${filename} (${(stats.size / 1024).toFixed(1)}KB) from ${url}`);
      } catch (err) {
        downloadLog.push(`❌ ${filename}: Download failed - ${err.message}`);
      }
    } else {
      downloadLog.push(`⏭️  ${filename}: Not found in API`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('DOWNLOAD SUMMARY');
  console.log('='.repeat(70));
  downloadLog.forEach(log => console.log(log));
  console.log('='.repeat(70));
  console.log(`\n📊 Downloaded: ${downloaded}/${MISSING_FILES.length} files\n`);
}

main().catch(console.error);
