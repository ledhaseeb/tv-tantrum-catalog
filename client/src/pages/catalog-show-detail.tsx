import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Play, 
  Clock, 
  Users, 
  Calendar, 
  Sparkles, 
  BookOpen,
  Volume2,
  Zap,
  Eye,
  Star,
  ArrowLeft,
  ExternalLink
} from "lucide-react";
import type { TvShow } from "../../../shared/catalog-schema";

interface CatalogShowDetailProps {
  id: number;
}

export default function CatalogShowDetail({ id }: CatalogShowDetailProps) {
  // Fetch show details
  const { data: show, isLoading, error } = useQuery({
    queryKey: ['/api/tv-shows', id],
    queryFn: async () => {
      const response = await fetch(`/api/tv-shows/${id}`);
      if (!response.ok) {
        throw new Error('Show not found');
      }
      return response.json() as Promise<TvShow>;
    },
  });

  // Fetch similar shows
  const { data: similarShows } = useQuery({
    queryKey: ['/api/tv-shows/similar', id],
    queryFn: async () => {
      if (!show) return [];
      const response = await fetch(`/api/tv-shows/similar/${id}?limit=6`);
      if (!response.ok) return [];
      return response.json() as Promise<TvShow[]>;
    },
    enabled: !!show,
  });

  // SEO optimization - Update page title and meta tags
  useEffect(() => {
    if (show) {
      // Update page title
      document.title = `${show.name} - TV Show Details | TV Tantrum`;
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      const description = `${show.name}: ${show.description?.substring(0, 150)}... Age range: ${show.ageRange}. Stimulation level: ${show.stimulationScore}/5.`;
      if (metaDescription) {
        metaDescription.setAttribute('content', description);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = description;
        document.head.appendChild(meta);
      }

      // Update Open Graph tags
      const updateOrCreateMeta = (property: string, content: string) => {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (meta) {
          meta.setAttribute('content', content);
        } else {
          meta = document.createElement('meta');
          meta.setAttribute('property', property);
          meta.setAttribute('content', content);
          document.head.appendChild(meta);
        }
      };

      updateOrCreateMeta('og:title', `${show.name} - TV Show Details`);
      updateOrCreateMeta('og:description', description);
      updateOrCreateMeta('og:type', 'website');
      updateOrCreateMeta('og:url', window.location.href);
      if (show.imageUrl) {
        updateOrCreateMeta('og:image', show.imageUrl);
      }

      // Update structured data for SEO
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "TVSeries",
        "name": show.name,
        "description": show.description,
        "image": show.imageUrl,
        "creator": show.creator ? {
          "@type": "Person",
          "name": show.creator
        } : undefined,
        "datePublished": show.releaseYear?.toString(),
        "genre": show.themes,
        "audience": {
          "@type": "PeopleAudience",
          "suggestedMinAge": show.ageRange?.split('-')[0] || "0",
          "suggestedMaxAge": show.ageRange?.split('-')[1] || "18"
        },
        "aggregateRating": show.stimulationScore ? {
          "@type": "AggregateRating",
          "ratingValue": show.stimulationScore,
          "ratingCount": "1",
          "bestRating": "5",
          "worstRating": "1"
        } : undefined
      };

      // Remove existing structured data
      const existingScript = document.querySelector('script[type="application/ld+json"]');
      if (existingScript) {
        existingScript.remove();
      }

      // Add new structured data
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = 'TV Tantrum - Children\'s TV Show Catalog';
    };
  }, [show]);

  if (isLoading) {
    return <ShowDetailSkeleton />;
  }

  if (error || !show) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Show Not Found</h1>
          <p className="text-gray-600 mb-6">The TV show you're looking for doesn't exist.</p>
          <Link href="/browse">
            <Button>Browse All Shows</Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatAvailability = (availability: string[] | string | null) => {
    if (!availability) return 'Not specified';
    if (Array.isArray(availability)) {
      return availability.join(', ');
    }
    return availability;
  };

  const getStimulationLabel = (score: number) => {
    switch (score) {
      case 1: return 'Very Calm';
      case 2: return 'Calm';
      case 3: return 'Moderate';
      case 4: return 'Active';
      case 5: return 'High Energy';
      default: return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/browse">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Browse
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Show Image */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden">
              {show.imageUrl ? (
                <img 
                  src={show.imageUrl} 
                  alt={`${show.name} poster`}
                  className="w-full h-96 object-cover"
                />
              ) : (
                <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
                  <Play className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </Card>

            {/* Quick Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Age Range</span>
                  <Badge variant="outline">{show.ageRange}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Episode Length</span>
                  <span className="text-sm font-medium">{show.episodeLength} min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Stimulation Level</span>
                  <div className="flex items-center">
                    <span className="text-sm font-medium mr-2">{getStimulationLabel(show.stimulationScore)}</span>
                    <Badge variant={show.stimulationScore <= 2 ? 'secondary' : show.stimulationScore <= 3 ? 'default' : 'destructive'}>
                      {show.stimulationScore}/5
                    </Badge>
                  </div>
                </div>
                {show.releaseYear && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Release Year</span>
                    <span className="text-sm font-medium">{show.releaseYear}</span>
                  </div>
                )}
                {show.seasons && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Seasons</span>
                    <span className="text-sm font-medium">{show.seasons}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Show Details */}
          <div className="lg:col-span-2">
            {/* Show Title and Basic Info */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{show.name}</h1>
              
              {show.creator && (
                <p className="text-lg text-gray-600 mb-4">
                  Created by <span className="font-medium">{show.creator}</span>
                </p>
              )}

              <div className="flex flex-wrap gap-2 mb-6">
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  <Users className="h-3 w-3 mr-1" />
                  Ages {show.ageRange}
                </Badge>
                <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                  <Clock className="h-3 w-3 mr-1" />
                  {show.episodeLength} minutes
                </Badge>
                <Badge className="bg-green-50 text-green-700 border-green-200">
                  <Zap className="h-3 w-3 mr-1" />
                  {getStimulationLabel(show.stimulationScore)}
                </Badge>
                {show.isOngoing && (
                  <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    <Star className="h-3 w-3 mr-1" />
                    Ongoing
                  </Badge>
                )}
              </div>
            </div>

            {/* Description */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{show.description}</p>
              </CardContent>
            </Card>

            {/* Themes */}
            {show.themes && show.themes.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Sparkles className="h-5 w-5 mr-2" />
                    Themes & Topics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {show.themes.map((theme, index) => (
                      <Badge key={index} variant="outline" className="text-sm">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Detailed Information */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="h-5 w-5 mr-2" />
                  Show Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Technical Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Animation Style:</span>
                        <span className="font-medium">{show.animationStyle || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Interactivity Level:</span>
                        <span className="font-medium">{show.interactivityLevel || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Available On:</span>
                        <span className="font-medium">{formatAvailability(show.availableOn)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Audio & Visual</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dialogue Intensity:</span>
                        <span className="font-medium">{show.dialogueIntensity || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sound Effects:</span>
                        <span className="font-medium">{show.soundEffectsLevel || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Music Tempo:</span>
                        <span className="font-medium">{show.musicTempo || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Scene Frequency:</span>
                        <span className="font-medium">{show.sceneFrequency || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* YouTube Channel Info (if available) */}
            {show.subscriberCount && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ExternalLink className="h-5 w-5 mr-2" />
                    Channel Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary">{parseInt(show.subscriberCount).toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Subscribers</div>
                    </div>
                    {show.videoCount && (
                      <div>
                        <div className="text-2xl font-bold text-primary">{parseInt(show.videoCount).toLocaleString()}</div>
                        <div className="text-sm text-gray-600">Videos</div>
                      </div>
                    )}
                    <div>
                      <div className="text-2xl font-bold text-primary">Active</div>
                      <div className="text-sm text-gray-600">Status</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Similar Shows Section */}
        {similarShows && similarShows.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Shows</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {similarShows.map((similarShow) => (
                <Link key={similarShow.id} href={`/show/${similarShow.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                    {similarShow.imageUrl ? (
                      <img 
                        src={similarShow.imageUrl} 
                        alt={similarShow.name}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <Play className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h3 className="font-medium text-sm mb-2 line-clamp-2">{similarShow.name}</h3>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>Ages {similarShow.ageRange}</span>
                        <Badge variant="outline" className="text-xs">
                          {similarShow.stimulationScore}/5
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ShowDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Skeleton className="w-full h-96 rounded-lg" />
            <Card className="mt-6">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-2">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2 mb-6" />
            <div className="flex gap-2 mb-6">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}