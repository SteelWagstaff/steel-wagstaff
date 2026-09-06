/**
 * Remark plugin to embed Spotify players
 * Converts Spotify URLs into embedded iframes
 */
import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';
import { extractSpotifyId, detectSpotifyType } from './spotify';

export function remarkSpotifyEmbed() {
  return (tree: Root) => {
    try {
      let replacementCount = 0;

      // Visit all nodes to find Spotify URLs
      visit(tree, 'paragraph', (node, index, parent) => {
        try {
          // Check each child of the paragraph
          for (const child of node.children) {
            let spotifyUrl: string | null = null;

            // Handle text nodes (plain URLs)
            if (child.type === 'text' && child.value) {
              const text = child.value.trim();
              if (text.match(/^https?:\/\/(open\.)?spotify\.com|^spotify:/)) {
                spotifyUrl = text;
              }
            }

            // Handle autolinks (created by markdown from bare URLs)
            if (child.type === 'link' && child.url) {
              if (child.url.match(/spotify\.com|^spotify:/)) {
                spotifyUrl = child.url;
              }
            }

            // If we found a Spotify URL, replace the entire paragraph with an embed
            if (spotifyUrl) {
              const id = extractSpotifyId(spotifyUrl);
              const type = detectSpotifyType(spotifyUrl) || 'playlist';

              if (id && parent && typeof index === 'number') {
                const embedUrl = `https://open.spotify.com/embed/${type}/${id}`;

                const embedNode = {
                  type: 'html' as const,
                  value: `<div class="spotify-embed-container my-8"><iframe src="${embedUrl}" width="100%" height="380" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="Spotify ${type}" style="border-radius: 12px; border: none;"></iframe></div>`,
                };

                parent.children[index] = embedNode;
                replacementCount++;
                return; // Stop checking other children
              }
            }
          }
        } catch (e) {
          console.error('Error processing paragraph in remark-spotify-embed:', e);
        }
      });

      if (replacementCount > 0) {
        console.log(`✅ Remark Spotify Embed: Replaced ${replacementCount} Spotify URL(s) with embeds`);
      }
    } catch (e) {
      console.error('Error in remark-spotify-embed plugin:', e);
    }
  };
}
