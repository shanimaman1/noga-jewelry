import { BRAND } from '@/lib/constants';
import { SITE_URL, DEFAULT_OG_IMAGE, absoluteUrl } from '@/lib/seo';

/**
 * Per-page document metadata. Relies on React 19's native hoisting of
 * <title>/<meta>/<link> to <head> — no react-helmet needed.
 *
 * NOTE: this is client-rendered. Fine for the demo; a production store needs
 * SSR / pre-rendering so crawlers see the tags without executing JS (already
 * flagged in index.html and CLAUDE.md).
 */
export function Seo({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  type = 'website',
  jsonLd,
}: {
  title: string;
  description: string;
  /** Route path with leading slash, for canonical + og:url. */
  path: string;
  image?: string;
  type?: 'website' | 'product' | 'article';
  jsonLd?: object;
}) {
  const fullTitle = `${title} | ${BRAND.nameHe}`;
  const url = absoluteUrl(path);
  const img = image.startsWith('http') ? image : `${SITE_URL}${image}`;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:site_name" content={BRAND.nameEn} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta property="og:locale" content="he_IL" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={img} />

      {jsonLd && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </>
  );
}
