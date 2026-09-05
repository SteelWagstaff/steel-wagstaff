/**
 * Utility functions for Spotify integration
 */

/**
 * Extract Spotify ID from a Spotify URL
 * Supports formats:
 * - https://open.spotify.com/playlist/PLAYLISTID
 * - https://open.spotify.com/user/USERNAME/playlist/PLAYLISTID
 * - https://open.spotify.com/album/ALBUMID
 * - https://open.spotify.com/track/TRACKID
 * - spotify:playlist:PLAYLISTID (URI format)
 */
export function extractSpotifyId(url: string): string | null {
  if (!url) return null;

  // URI format: spotify:playlist:ID
  const uriMatch = url.match(/spotify:(playlist|album|track):([a-zA-Z0-9]+)/);
  if (uriMatch) return uriMatch[2];

  // URL format: open.spotify.com/[type]/[id] or open.spotify.com/user/[user]/[type]/[id]
  const urlMatch = url.match(/open\.spotify\.com(?:\/user\/[^/]+)?\/(?:playlist|album|track)\/([a-zA-Z0-9]+)/);
  if (urlMatch) return urlMatch[1];

  // Fallback: check if it's already just an ID (alphanumeric, no special chars)
  if (/^[a-zA-Z0-9]+$/.test(url)) return url;

  return null;
}

/**
 * Detect Spotify content type from URL
 */
export function detectSpotifyType(
  url: string
): 'playlist' | 'album' | 'track' | null {
  if (!url) return null;

  if (url.includes('playlist')) return 'playlist';
  if (url.includes('album')) return 'album';
  if (url.includes('track')) return 'track';

  return null;
}

/**
 * Build Spotify embed URL
 */
export function buildSpotifyEmbedUrl(
  id: string,
  type: 'playlist' | 'album' | 'track' = 'playlist'
): string {
  return `https://open.spotify.com/embed/${type}/${id}`;
}

/**
 * Extract Spotify data from a URL or text containing Spotify link
 */
export function parseSpotifyUrl(
  input: string
): { id: string; type: 'playlist' | 'album' | 'track' } | null {
  const id = extractSpotifyId(input);
  if (!id) return null;

  const type = detectSpotifyType(input) || 'playlist';
  return { id, type };
}
