import React from 'react'
import Link from 'next/link'
import { db } from '@/lib/db'
import { tvShows, tvShowThemes, themes, tvShowPlatforms, platforms } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShowCard } from '@/components/show-card'
import { ArrowRight, Star, TrendingUp } from 'lucide-react'

async function getFeaturedShows() {
  try {
    const featured = await db
      .select()
      .from(tvShows)
      .where(eq(tvShows.isFeatured, true))
      .limit(6);
    
    return featured;
  } catch (error) {
    console.error('Database connection failed, using fallback data');
    return [];
  }
}

async function getPopularShows() {
  try {
    const popular = await db
      .select()
      .from(tvShows)
      .orderBy(desc(tvShows.stimulationScore))
      .limit(8);
    
    return popular;
  } catch (error) {
    console.error('Database connection failed, using fallback data');
    return [];
  }
}

export default async function HomePage() {
  const [featuredShows, popularShows] = await Promise.all([
    getFeaturedShows(),
    getPopularShows()
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Find the Perfect Shows for Your Kids
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Discover children's entertainment with detailed stimulation metrics, age-appropriate guidance, 
          and parent-friendly insights to make informed viewing decisions.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/browse" 
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Browse All Shows
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link 
            href="/research" 
            className="inline-flex items-center justify-center px-6 py-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
          >
            Research & Insights
          </Link>
        </div>
      </section>

      {/* Featured Shows */}
      {featuredShows.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold flex items-center">
              <Star className="mr-3 h-8 w-8 text-yellow-500" />
              Featured Shows
            </h2>
            <Link href="/browse" className="text-primary hover:underline">
              View all shows →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredShows.map((show) => (
              <ShowCard key={show.id} show={show} />
            ))}
          </div>
        </section>
      )}

      {/* Popular Shows */}
      {popularShows.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold flex items-center">
              <TrendingUp className="mr-3 h-8 w-8 text-green-500" />
              Popular Shows
            </h2>
            <Link href="/browse?sort=popular" className="text-primary hover:underline">
              View all popular →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularShows.slice(0, 4).map((show) => (
              <ShowCard key={show.id} show={show} compact />
            ))}
          </div>
        </section>
      )}

      {/* Quick Stats */}
      <section className="mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">500+</CardTitle>
              <CardDescription>Shows Analyzed</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">50+</CardTitle>
              <CardDescription>Streaming Platforms</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">100k+</CardTitle>
              <CardDescription>Parents Helped</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* About Section */}
      <section className="text-center">
        <h2 className="text-3xl font-bold mb-6">Why TV Tantrum?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-3">Stimulation Metrics</h3>
            <p className="text-muted-foreground">
              Detailed analysis of visual pacing, sound effects, and content intensity to help you choose appropriately stimulating content.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-3">Age-Appropriate</h3>
            <p className="text-muted-foreground">
              Clear age recommendations based on developmental psychology and content analysis.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-3">Research-Backed</h3>
            <p className="text-muted-foreground">
              All our insights are based on peer-reviewed research in child development and media psychology.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}