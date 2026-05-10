#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Try different URL patterns
const MISSING_FILES = [
  { name: 'short_history.jpg', patterns: ['short_history', 'history'] },
  { name: 'tina_van_zile.jpg', patterns: ['tina_van_zile', 'tina-van-zile'] },
  { name: '300px-EzraPound_Passport.png', patterns: ['ezra', 'pound', 'passport'] },
  { name: '513pBo1mKBL.jpg', patterns: ['513p', '513'] },
  { name: 'barber_science.jpg', patterns: ['barber', 'science'] },
  { name: 'Rakosi_radio.jpg', patterns: ['rakosi', 'radio'] },
  { name: 'back_of_dress.jpg', patterns: ['dress', 'back'] },
  { name: '4707219428_d8f336f73b_b.jpg', patterns: ['4707', 'flickr'] }
];

async function checkWayback(url) {
  try {
    const waybackUrl = `https://web.archive.org/web/*/` + url;
    const response = await fetch(waybackUrl);
    const json = await response.json();
    return json.closest?.url;
  } catch (e) {
    return null;
  }
}

async function searchWayback() {
  console.log('🔍 Searching Wayback Machine...\n');
  
  const baseDomains = [
    'https://steelwagstaff.files.wordpress.com/',
    'https://steelwagstaff.wordpress.com/'
  ];

  for (const file of MISSING_FILES) {
    console.log(`📦 ${file.name}...`);
    
    for (const domain of baseDomains) {
      try {
        // Try multiple year ranges
        const response = await fetch(
          `https://archive.org/advancedsearch.php?output=json&` +
          `url=${domain}*${file.name}*&fl=timestamp,statuscode&filter=statuscode:200&sort=timestamp+desc&rows=1`,
          { timeout: 5000 }
        );
        const data = await response.json();
        
        if (data.response?.numFound > 0) {
          const result = data.response.docs[0];
          console.log(`   ✅ Found on ${domain}`);
          console.log(`   📅 Timestamp: ${result.timestamp}`);
          continue;
        }
      } catch (e) {
        // Continue
      }
    }
  }
}

searchWayback().catch(console.error);
