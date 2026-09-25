export const publishedPostsQuery = `*[
  _type == "post" &&
  !coalesce(draft, false) &&
  coalesce(locale, "en") == "en"
] | order(publishedAt desc) {
  _id,
  title,
  slug,
  description,
  publishedAt,
  author,
  tags,
  image,
  imageAlt,
  body,
  locale,
  draft
}`;

export const publishedCommonplaceQuery = `*[
  _type == "commonplaceEntry" &&
  !coalesce(draft, false) &&
  coalesce(locale, "en") == "en"
] | order(publishedAt desc) {
  _id,
  title,
  type,
  publishedAt,
  tags,
  content,
  image,
  imageAlt,
  videoUrl,
  audioUrl,
  source,
  locale,
  draft
}`;

export const postBySlugQuery = `${publishedPostsQuery} [slug.current == $slug][0]`;
