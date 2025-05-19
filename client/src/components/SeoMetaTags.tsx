import { Helmet } from 'react-helmet-async';

interface SeoMetaTagsProps {
  title?: string;
  description?: string;
  image?: string;
  pageUrl?: string;
  keywords?: string[];
  canonicalUrl?: string;
  isArticle?: boolean;
}

/**
 * SeoMetaTags component for improving search engine optimization
 * Use this component on every page to ensure proper meta tags are included
 */
export default function SeoMetaTags({
  title = 'TV Tantrum - Children\'s TV Show Ratings for Parents',
  description = 'TV Tantrum helps parents make informed decisions about children\'s TV shows with detailed stimulation scores, themes, and age suitability information.',
  image = '/logo.png',
  pageUrl = 'https://tvtantrum.com',
  keywords = ['children\'s TV shows', 'parental guidance', 'TV show ratings', 'kids shows', 'stimulation scores', 'sensory impact', 'screen time'],
  canonicalUrl,
  isArticle = false
}: SeoMetaTagsProps) {
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      
      {/* Canonical URL (important for SEO) */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={isArticle ? 'article' : 'website'} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={pageUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      
      {/* Additional SEO-friendly tags */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
    </Helmet>
  );
}