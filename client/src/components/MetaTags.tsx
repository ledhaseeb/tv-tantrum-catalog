import { Helmet } from 'react-helmet-async';

interface MetaTagsProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  showData?: {
    name: string;
    description?: string;
    themes?: string[];
    stimulationScore?: number;
    ageRange?: string;
    imageUrl?: string;
  };
}

/**
 * MetaTags component for improved SEO
 * This component dynamically updates meta tags for each page
 */
export default function MetaTags({ 
  title, 
  description, 
  image, 
  url,
  type = 'website',
  showData
}: MetaTagsProps) {
  // Default values
  const defaultTitle = 'TV Tantrum - Children\'s TV Show Ratings for Parents';
  const defaultDescription = 'TV Tantrum helps parents make informed decisions about children\'s TV shows with detailed stimulation scores, themes, and age suitability information.';
  const defaultImage = '/logo.png';
  const defaultUrl = 'https://tvtantrum.com';
  
  // If show data is provided, create optimized meta content
  let finalTitle = title || defaultTitle;
  let finalDescription = description || defaultDescription;
  let finalImage = image || defaultImage;
  
  if (showData) {
    // Create a more SEO-friendly title and description for show pages
    finalTitle = `${showData.name} - TV Show Guide | TV Tantrum`;
    
    // Create a rich description with show details for better SEO
    const themeText = showData.themes?.length 
      ? `Themes: ${showData.themes.join(', ')}. ` 
      : '';
    
    const scoreText = showData.stimulationScore !== undefined 
      ? `Stimulation Score: ${showData.stimulationScore}/10. ` 
      : '';
    
    const ageText = showData.ageRange 
      ? `Suitable for ages ${showData.ageRange}. ` 
      : '';
    
    finalDescription = `${showData.description || showData.name} ${themeText}${scoreText}${ageText}Find detailed parent guides and reviews at TV Tantrum.`;
    
    // Use show image if available
    if (showData.imageUrl) {
      finalImage = showData.imageUrl;
    }
  }
  
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="title" content={finalTitle} />
      <meta name="description" content={finalDescription} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url || defaultUrl} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url || defaultUrl} />
      <meta property="twitter:title" content={finalTitle} />
      <meta property="twitter:description" content={finalDescription} />
      <meta property="twitter:image" content={finalImage} />
      
      {/* Add structured data for TV shows if show data is provided */}
      {showData && (
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'TVSeries',
            'name': showData.name,
            'description': showData.description || `${showData.name} - Parent guide and reviews on TV Tantrum`,
            'image': showData.imageUrl || defaultImage,
            'potentialAction': {
              '@type': 'ViewAction',
              'target': `${defaultUrl}/shows/${encodeURIComponent(showData.name)}`
            },
            'aggregateRating': showData.stimulationScore !== undefined ? {
              '@type': 'AggregateRating',
              'ratingValue': showData.stimulationScore,
              'bestRating': '10',
              'worstRating': '1',
              'ratingCount': '1'
            } : undefined
          })}
        </script>
      )}
    </Helmet>
  );
}