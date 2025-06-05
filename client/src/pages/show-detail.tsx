import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Heart, Share2, Star, Calendar, Clock, Users, Tv, Youtube, ExternalLink } from "lucide-react";
import type { TvShow } from "../../../shared/catalog-schema";

// Helper function to convert show name to URL slug
export const createShowSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
};

// Helper function to get stimulation level color and label
const getStimulationDisplay = (score: number) => {
  const levels = [
    { min: 1, max: 1, label: "Very Low", color: "bg-green-500" },
    { min: 2, max: 2, label: "Low", color: "bg-yellow-400" },
    { min: 3, max: 3, label: "Moderate", color: "bg-orange-400" },
    { min: 4, max: 4, label: "High", color: "bg-red-400" },
    { min: 5, max: 5, label: "Very High", color: "bg-red-600" }
  ];
  
  const level = levels.find(l => score >= l.min && score <= l.max) || levels[2];
  return { label: level.label, color: level.color };
};

// Helper function to get sensory level color
const getSensoryLevelColor = (level: string) => {
  switch (level?.toLowerCase()) {
    case 'low': return 'bg-green-500';
    case 'moderate-low': return 'bg-yellow-400';
    case 'moderate': return 'bg-orange-400';
    case 'moderate-high': return 'bg-red-400';
    case 'high': return 'bg-red-600';
    default: return 'bg-gray-400';
  }
};

// Sensory level progress bar component
const SensoryBar = ({ level, label }: { level: string; label: string }) => {
  const colorClass = getSensoryLevelColor(level);
  
  // Calculate width percentage based on level
  const getWidth = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'low': return '20%';
      case 'moderate-low': return '40%';
      case 'moderate': return '60%';
      case 'moderate-high': return '80%';
      case 'high': return '100%';
      default: return '60%';
    }
  };

  return (
    <div className="flex items-center justify-between mb-3">
      <span className="text-gray-700 font-medium">{label}:</span>
      <div className="flex items-center gap-3 flex-1 ml-4">
        <div className="flex-1 bg-gray-200 rounded-full h-3 relative overflow-hidden">
          <div 
            className={`h-full ${colorClass} transition-all duration-300`}
            style={{ width: getWidth(level) }}
          />
        </div>
        <span className="text-gray-600 min-w-[120px] text-right">{level || 'N/A'}</span>
      </div>
    </div>
  );
};

export default function ShowDetail() {
  const params = useParams<{ slug: string }>();

  // Fetch show data directly by slug
  const { data: show, isLoading, error } = useQuery({
    queryKey: ['/api/shows/by-slug', params.slug],
    enabled: !!params.slug
  });

  // Set page title for SEO
  useEffect(() => {
    if (show) {
      document.title = `${show.name} (${show.releaseYear}) - TV Tantrum Catalog`;
      
      // Add meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', 
          `${show.description.substring(0, 150)}... Age range: ${show.ageRange}. Stimulation level: ${getStimulationDisplay(show.stimulationScore).label}.`
        );
      }
    }
  }, [show]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Skeleton className="w-full h-96 rounded-lg" />
            </div>
            
            <div className="lg:col-span-2 space-y-6">
              <div>
                <Skeleton className="h-12 w-3/4 mb-4" />
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-6 w-2/3" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Show Not Found</h1>
          <p className="text-gray-600 mb-6">The show you're looking for doesn't exist.</p>
          <Link href="/browse">
            <Button>Browse All Shows</Button>
          </Link>
        </div>
      </div>
    );
  }

  const stimulationDisplay = getStimulationDisplay(show.stimulationScore);
  const yearRange = show.endYear && show.endYear !== show.releaseYear 
    ? `${show.releaseYear}-${show.endYear}`
    : show.isOngoing 
      ? `${show.releaseYear}-present`
      : show.releaseYear?.toString() || 'Unknown';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <div className="mb-6">
          <Link href="/browse">
            <Button variant="ghost" className="text-primary hover:text-primary-dark">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Browse
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Show Image */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden sticky top-8">
              <div className="aspect-[3/4] relative">
                {show.imageUrl ? (
                  <img 
                    src={show.imageUrl} 
                    alt={`${show.name} show poster`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                    <Tv className="h-16 w-16 text-primary opacity-50" />
                  </div>
                )}
              </div>
              
              {/* Key Information Card */}
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Key Information</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Target Age Range:</span>
                    <span className="font-medium">{show.ageRange}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform(s):</span>
                    <span className="font-medium">{show.availableOn?.join(', ') || 'Various'}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg. Episode Length:</span>
                    <span className="font-medium">{show.episodeLength} min</span>
                  </div>
                  
                  {show.seasons && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Seasons:</span>
                      <span className="font-medium">{show.seasons} seasons</span>
                    </div>
                  )}
                </div>

                {/* YouTube Channel Information */}
                {show.isYouTubeChannel && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center mb-3">
                      <Youtube className="h-5 w-5 text-red-600 mr-2" />
                      <h4 className="font-semibold text-gray-900">YouTube Channel Information</h4>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      {show.subscriberCount && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subscribers:</span>
                          <span className="font-medium">{parseInt(show.subscriberCount).toLocaleString()}</span>
                        </div>
                      )}
                      
                      {show.videoCount && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Videos:</span>
                          <span className="font-medium">{show.videoCount}</span>
                        </div>
                      )}
                      
                      {show.publishedAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Channel Since:</span>
                          <span className="font-medium">{new Date(show.publishedAt).getFullYear()}</span>
                        </div>
                      )}
                    </div>
                    
                    {show.channelId && (
                      <div className="mt-4">
                        <a 
                          href={`https://www.youtube.com/channel/${show.channelId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          View on YouTube
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                  {show.name} <span className="text-gray-500 font-normal">({yearRange})</span>
                </h1>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Heart className="h-4 w-4 mr-2" />
                    Add to Favorites
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
              
              {show.creator && (
                <p className="text-lg text-gray-600 mb-4">Created by {show.creator}</p>
              )}
              
              <p className="text-gray-700 leading-relaxed text-lg">{show.description}</p>
            </div>

            {/* Stimulation Score */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Overall Stimulation Score:</h3>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-6 h-6 rounded-full border-2 ${
                          i < show.stimulationScore 
                            ? `${stimulationDisplay.color} border-transparent` 
                            : 'border-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-xl font-bold text-gray-900">
                      {show.stimulationScore}/5
                    </span>
                  </div>
                </div>
                <p className="text-gray-600">
                  This show has a <strong>{stimulationDisplay.label.toLowerCase()}</strong> stimulation level, 
                  making it {show.stimulationScore <= 2 ? 'suitable for calm viewing' : 
                           show.stimulationScore === 3 ? 'moderately engaging' : 
                           'high-energy and engaging'}.
                </p>
              </CardContent>
            </Card>

            {/* Sensory Details */}
            <Card>
              <CardHeader>
                <CardTitle>Sensory Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <SensoryBar level={show.dialogueIntensity || 'Moderate'} label="Dialogue Intensity" />
                  <SensoryBar level={show.sceneFrequency || 'Moderate'} label="Scene Frequency" />
                  <SensoryBar level={show.soundEffectsLevel || 'Moderate'} label="Sound Effects Level" />
                  <SensoryBar level={show.totalSoundEffectTimeLevel || 'Moderate'} label="Total Sound Effect Time" />
                  <SensoryBar level={show.musicTempo || 'Moderate'} label="Music Tempo" />
                  <SensoryBar level={show.totalMusicLevel || 'Moderate'} label="Total Music Level" />
                  <SensoryBar level={show.interactivityLevel || 'Moderate'} label="Interaction Level" />
                  
                  {show.animationStyle && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-medium">Animation Style:</span>
                        <span className="text-gray-600">{show.animationStyle}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Themes */}
            {show.themes && show.themes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Themes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {show.themes.map((theme, index) => (
                      <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">Release Year</div>
                      <div className="text-gray-600">{show.releaseYear || 'Unknown'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">Episode Length</div>
                      <div className="text-gray-600">{show.episodeLength} minutes</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {show.seasons && (
                    <div className="flex items-center">
                      <Tv className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">Seasons</div>
                        <div className="text-gray-600">{show.seasons}</div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">Age Range</div>
                      <div className="text-gray-600">{show.ageRange}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}