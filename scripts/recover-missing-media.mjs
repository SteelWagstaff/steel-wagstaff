#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const XML_FILE = 'steelwagstaff.WordPress.2026-04-24.xml';
const MEDIA_EXPORTS = 'media-exports/media_library_export-steel_wagstaff-2026_05_10_23_29_58';
const ASSETS_BLOG = 'src/assets/blog';
const CSV_FILE = 'scripts/media-mapping.csv';

// Read XML and extract attachment ID -> filename mappings
function extractAttachmentsFromXML() {
  const xmlContent = fs.readFileSync(XML_FILE, 'utf-8');
  const attachments = new Map();

  // Match patterns like: http://steelwagstaff.files.wordpress.com/2011/05/bill_bryson.jpg
  // or [caption id="attachment_298"...<img...src="...filename.jpg"
  const captionPattern = /\[caption id="attachment_(\d+)"[^\]]*\].*?<img[^>]*src="([^"]*?)([^/]*?\.(?:jpg|png|gif|jpeg|pdf|mp4))"/gs;
  let match;

  while ((match = captionPattern.exec(xmlContent)) !== null) {
    const attachmentId = match[1];
    const url = match[2] + match[3];
    const filename = match[3];
    attachments.set(attachmentId, { url, filename });
  }

  return attachments;
}

// Read CSV and get NOT_FOUND entries
function readCSV() {
  const csv = fs.readFileSync(CSV_FILE, 'utf-8').split('\n');
  const notFound = [];

  for (let i = 1; i < csv.length; i++) {
    const row = csv[i].trim();
    if (!row) continue;
    
    const cols = row.split(',');
    if (cols[2] === 'NOT_FOUND') {
      notFound.push({
        attachmentId: cols[0],
        posts: cols[1],
        index: i
      });
    }
  }

  return notFound;
}

// Get list of files in media-exports
function getMediaExportFiles() {
  return fs.readdirSync(MEDIA_EXPORTS);
}

// Find likely match in media-exports for a given filename
function findMediaFile(filename, exportFiles) {
  // Extract just the base filename without date modifiers
  // e.g., "steel-and-laurel-233-copy-e1478018027840.jpg" -> match "steel-and-laurel-233-copy"
  const cleanName = filename.replace(/(-e\d+)?\./, '.');
  const nameWithoutExt = path.parse(cleanName).name;

  // Look for exact match first
  if (exportFiles.includes(cleanName)) {
    return cleanName;
  }

  // Look for prefix match
  const matches = exportFiles.filter(f => {
    const fBase = path.parse(f).name;
    return fBase.includes(nameWithoutExt) || nameWithoutExt.includes(fBase.slice(0, 20));
  });

  return matches.length > 0 ? matches[0] : null;
}

async function main() {
  console.log('🔍 Extracting attachments from XML...');
  const xmlAttachments = extractAttachmentsFromXML();
  console.log(`✅ Found ${xmlAttachments.size} attachments in XML\n`);

  console.log('📋 Reading CSV for NOT_FOUND entries...');
  const notFound = readCSV();
  console.log(`✅ Found ${notFound.length} NOT_FOUND entries\n`);

  console.log('📁 Scanning media-exports...');
  const exportFiles = getMediaExportFiles();
  console.log(`✅ Found ${exportFiles.length} files in media-exports\n`);

  // Try to recover missing media
  let recovered = 0;
  const recoveryLog = [];

  for (const entry of notFound) {
    const attachmentId = entry.attachmentId;
    const xmlInfo = xmlAttachments.get(attachmentId);

    if (!xmlInfo) {
      recoveryLog.push(`⚠️  Attachment ${attachmentId} (${entry.posts}): No XML record found`);
      continue;
    }

    const mediaFile = findMediaFile(xmlInfo.filename, exportFiles);
    
    if (mediaFile) {
      const srcPath = path.join(MEDIA_EXPORTS, mediaFile);
      const destPath = path.join(ASSETS_BLOG, mediaFile);

      try {
        fs.copyFileSync(srcPath, destPath);
        recovered++;
        recoveryLog.push(`✅ Attachment ${attachmentId}: Recovered as ${mediaFile}`);
      } catch (err) {
        recoveryLog.push(`❌ Attachment ${attachmentId}: Copy failed - ${err.message}`);
      }
    } else {
      recoveryLog.push(`⚠️  Attachment ${attachmentId} (${xmlInfo.filename}): Not found in media-exports`);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('RECOVERY SUMMARY');
  console.log('='.repeat(60));
  recoveryLog.forEach(log => console.log(log));
  console.log('='.repeat(60));
  console.log(`\n📊 Recovered: ${recovered}/${notFound.length} files\n`);

  // Update CSV for recovered entries
  if (recovered > 0) {
    console.log('📝 Updating CSV...');
    let csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
    let lineNum = 0;

    for (const entry of notFound) {
      const attachmentId = entry.attachmentId;
      const xmlInfo = xmlAttachments.get(attachmentId);

      if (xmlInfo) {
        const mediaFile = findMediaFile(xmlInfo.filename, exportFiles);
        if (mediaFile) {
          // Update CSV line
          csvContent = updateCSVLine(csvContent, entry.attachmentId, 'RECOVERED', xmlInfo.url, mediaFile);
        }
      }
    }

    fs.writeFileSync(CSV_FILE, csvContent);
    console.log('✅ CSV updated\n');
  }
}

function updateCSVLine(csvContent, attachmentId, status, url, filename) {
  const lines = csvContent.split('\n');
  
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols[0] === attachmentId) {
      cols[2] = status;
      cols[3] = url;
      cols[4] = filename;
      lines[i] = cols.join(',');
      break;
    }
  }

  return lines.join('\n');
}

main().catch(console.error);
