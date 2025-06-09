/**
 * Create Sample Ads Script
 * Populates the ads table with sample advertising content for different placements
 */

const { db } = require('./server/db.ts');
const { ads } = require('./shared/schema.ts');

async function createSampleAds() {
  console.log('Creating sample ads...');

  const sampleAds = [
    {
      title: "Educational Toys for Smart Kids",
      description: "Discover STEM toys that make learning fun! Perfect for curious minds aged 3-8.",
      imageUrl: "/images/ads/educational-toys.jpg",
      ctaText: "Shop Now",
      targetUrl: "https://educationaltoys.example.com",
      placement: "show-details",
      isActive: true,
      priority: 1,
      currentImpressions: 0,
      currentClicks: 0,
      maxImpressions: 10000,
      maxClicks: 500,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
    {
      title: "Screen Time Balance App",
      description: "Help your family manage screen time with our award-winning parental control app.",
      imageUrl: "/images/ads/screen-time-app.jpg",
      ctaText: "Try Free",
      targetUrl: "https://screentime.example.com",
      placement: "research-summary",
      isActive: true,
      priority: 1,
      currentImpressions: 0,
      currentClicks: 0,
      maxImpressions: 8000,
      maxClicks: 400,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Kids Book Subscription Box",
      description: "Monthly delivery of age-appropriate books to inspire young readers. Cancel anytime.",
      imageUrl: "/images/ads/book-subscription.jpg",
      ctaText: "Get Started",
      targetUrl: "https://kidsbooks.example.com",
      placement: "research-details",
      isActive: true,
      priority: 1,
      currentImpressions: 0,
      currentClicks: 0,
      maxImpressions: 12000,
      maxClicks: 600,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }
  ];

  try {
    for (const ad of sampleAds) {
      const [createdAd] = await db.insert(ads).values({
        ...ad,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      
      console.log(`Created ad: ${createdAd.title} for placement: ${createdAd.placement}`);
    }
    
    console.log('Sample ads created successfully!');
    console.log('Ad system is now functional with real content.');
    
  } catch (error) {
    console.error('Error creating sample ads:', error);
  }
}

createSampleAds().catch(console.error);