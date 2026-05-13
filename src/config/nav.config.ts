/**
 * Navigation Configuration
 *
 * Defines which pages appear in the site navigation and their display order.
 * Astro handles routing via the filesystem — this only controls nav menus.
 */

export interface NavItem {
  label: string;
  href: string;
  order: number;
}

export const navItems: NavItem[] = [
  { label: 'Blog', href: '/blog', order: 1 },
  { label: 'Writing + Storytelling', href: '/writing-storytelling', order: 2 },
  { label: 'Radio + Podcasts', href: '/radio-podcasts', order: 3 },
  { label: 'The Commonplace', href: '/commonplace', order: 4 },
];

/**
 * Get navigation items sorted by order
 */
export function getNavItems(): NavItem[] {
  return [...navItems].sort((a, b) => a.order - b.order);
}
