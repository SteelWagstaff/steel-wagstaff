#!/usr/bin/env node

/**
 * Extract Spotify IDs from music content files
 * This script reads all music markdown files and:
 * 1. Looks for Spotify URLs in the content
 * 2. Extracts the playlist/album/track ID
 * 3. Adds/updates the spotifyEmbedId field in the frontmatter
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MUSIC_DIR = path.join(__dirname, '../src/content/music');
const PODCASTS_DIR = path.join(__dirname, '../src/content/podcasts');

function extractSpotifyId(url) {
  if (!url) return null;

  // URI format: spotify:playlist:ID
  const uriMatch = url.match(/spotify:(playlist|album|track):([a-zA-Z0-9]+)/);
  if (uriMatch) return uriMatch[2];

  // URL format: open.spotify.com/[type]/[id] or open.spotify.com/user/[user]/[type]/[id]
  const urlMatch = url.match(/open\.spotify\.com(?:\/user\/[^/]+)?\/(?:playlist|album|track)\/([a-zA-Z0-9]+)/);
  if (urlMatch) return urlMatch[1];

  // Fallback: check if it's already just an ID
  if (/^[a-zA-Z0-9]+$/.test(url)) return url;

  return null;
}

function findSpotifyUrls(content) {
  const urlPattern = /https?:\/\/(?:open\.)?spotify\.com[^\s)>\]"]*/g;
  return (content.match(urlPattern) || []).map(url => url.replace(/[)">\]]$/, ''));
}

function updateMusicFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;

  // Extract frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return false;

  const frontmatter = frontmatterMatch[1];
  const fileBody = content.slice(frontmatterMatch[0].length);

  // Find Spotify URLs in the entire content
  const spotifyUrls = findSpotifyUrls(fileBody);

  if (spotifyUrls.length === 0) return false;

  // Extract ID from first URL found
  const spotifyId = extractSpotifyId(spotifyUrls[0]);
  if (!spotifyId) return false;

  // Check if spotifyEmbedId already exists
  if (frontmatter.includes('spotifyEmbedId:')) {
    console.log(`  ✓ Already has spotifyEmbedId: ${spotifyId}`);
    return false;
  }

  // Add spotifyEmbedId to frontmatter
  const spotifyUrlLine = frontmatter.includes('spotifyUrl:')
    ? frontmatter.replace(/spotifyUrl:.*/, `spotifyUrl: "${spotifyUrls[0]}"\nspotifyEmbedId: "${spotifyId}"`)
    : frontmatter + `\nspotifyEmbedId: "${spotifyId}"`;

  const newContent = content.replace(/^---\n[\s\S]*?\n---/, `---\n${spotifyUrlLine}\n---`);

  if (newContent !== originalContent) {
    fs.writeFileSync(filePath, newContent);
    console.log(`  ✓ Added spotifyEmbedId: ${spotifyId}`);
    return true;
  }

  return false;
}

function processDirectory(dir, type) {
  console.log(`\nProcessing ${type} files...`);
  if (!fs.existsSync(dir)) {
    console.log(`Directory not found: ${dir}`);
    return;
  }

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
  let updated = 0;

  for (const file of files) {
    const filePath = path.join(dir, file);
    try {
      if (updateMusicFile(filePath)) {
        updated++;
      }
    } catch (error) {
      console.error(`  ✗ Error processing ${file}:`, error.message);
    }
  }

  console.log(`Updated ${updated} of ${files.length} files`);
}

// Process music files in all locale directories
async function run() {
  console.log('🎵 Extracting Spotify IDs from content files...\n');

  // Find all locale directories
  const locales = ['en', 'es', 'fr'];

  for (const locale of locales) {
    const musicPath = path.join(MUSIC_DIR, locale);
    if (fs.existsSync(musicPath)) {
      processDirectory(musicPath, `music (${locale})`);
    }

    const podcastPath = path.join(PODCASTS_DIR, locale);
    if (fs.existsSync(podcastPath)) {
      processDirectory(podcastPath, `podcasts (${locale})`);
    }
  }

  console.log('\n✨ Done!');
}

run().catch(console.error);
