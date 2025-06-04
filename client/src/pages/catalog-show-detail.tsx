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
import type { TvShow } from "@shared/schema";

interface CatalogShowDetailProps {
  id: number;
}

export default function CatalogShowDetail({ id }: CatalogShowDetailProps) {
  console.log('CatalogShowDetail component mounted with ID:', id);
  
  // Fetch show details
  const { data: show, isLoading, error } = useQuery({
    queryKey: ['tv-show', id],
    queryFn: async () => {
      console.log('Fetching show with ID:', id);
      const response = await fetch(`/api/tv-shows/${id}`);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to fetch show: ${response.status}`);
      }
      
      const rawData = await response.json();
      console.log('Raw show data received:', rawData);
      
      // Normalize snake_case to camelCase
      const normalizedData = {
        ...rawData,
        ageRange: rawData.age_range || rawData.ageRange,
        imageUrl: rawData.image_url || rawData.imageUrl,
        episodeLength: rawData.episode_length || rawData.episodeLength,
        releaseYear: rawData.release_year || rawData.releaseYear,
        endYear: rawData.end_year || rawData.endYear,
        isOngoing: rawData.is_ongoing || rawData.isOngoing,
        stimulationScore: rawData.stimulation_score || rawData.stimulationScore,
        interactivityLevel: rawData.interactivity_level || rawData.interactivityLevel,
        dialogueIntensity: rawData.dialogue_intensity || rawData.dialogueIntensity,
        soundEffectsLevel: rawData.sound_effects_level || rawData.soundEffectsLevel,
        musicTempo: rawData.music_tempo || rawData.musicTempo,
        totalMusicLevel: rawData.total_music_level || rawData.totalMusicLevel,
        totalSoundEffectTimeLevel: rawData.total_sound_effect_time_level || rawData.totalSoundEffectTimeLevel,
        sceneFrequency: rawData.scene_frequency || rawData.sceneFrequency,
        creativityRating: rawData.creativity_rating || rawData.creativityRating,
        availableOn: rawData.available_on || rawData.availableOn,
        animationStyle: rawData.animation_style || rawData.animationStyle,
        isFeatured: rawData.is_featured || rawData.isFeatured,
        subscriberCount: rawData.subscriber_count || rawData.subscriberCount,
        videoCount: rawData.video_count || rawData.videoCount,
        channelId: rawData.channel_id || rawData.channelId,
        isYoutubeChannel: rawData.is_youtube_channel || rawData.isYoutubeChannel,
        publishedAt: rawData.published_at || rawData.publishedAt,
        hasOmdbData: rawData.has_omdb_data || rawData.hasOmdbData,
        hasYoutubeData: rawData.has_youtube_data || rawData.hasYoutubeData,
      };
      
      console.log('Normalized show data:', normalizedData);
      return normalizedData;
    },
    enabled: !!id,
  });

  console.log('Query state - isLoading:', isLoading, 'error:', error, 'show:', !!show);

  // SEO optimization
  useEffect(() => {
    if (show) {
      document.title = `${show.name} - TV Show Details | TV Tantrum`;
    }
    return () => {
      document.title = 'TV Tantrum - Children\'s TV Show Catalog';
    };
  }, [show]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Skeleton className="w-full aspect-[2/3] rounded-lg" />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Error in CatalogShowDetail:', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Link href="/">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Shows
            </Button>
          </Link>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Error Loading Show</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600 mb-4">
                Failed to load show details. Please try again later.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Error: {error.message}
              </p>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Return to Browse
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Link href="/">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Shows
            </Button>
          </Link>
          
          <Card>
            <CardHeader>
              <CardTitle>Show Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                The TV show you're looking for doesn't exist.
              </p>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Return to Browse
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Helper functions
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

  const renderStimulationDots = (score: number) => {
    const dots = [];
    for (let i = 1; i <= 5; i++) {
      dots.push(
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${
            i <= score ? 'bg-orange-500' : 'bg-gray-300'
          }`}
        />
      );
    }
    return dots;
  };

  const formatAvailability = (availability: string[] | string | null) => {
    if (!availability) return 'Not specified';
    if (Array.isArray(availability)) {
      return availability.join(', ');
    }
    return availability;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back to Shows */}
        <Link href="/">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Shows
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Show Image */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden">
              <div className="aspect-[2/3] bg-gray-200 flex items-center justify-center">
                {show.imageUrl ? (
                  <img 
                    src={show.imageUrl} 
                    alt={show.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = `
                        <div class="flex items-center justify-center h-full text-gray-500">
                          <div class="text-center">
                            <svg class="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/>
                            </svg>
                            <p class="text-sm">No Image Available</p>
                          </div>
                        </div>
                      `;
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <Play className="w-16 h-16 mx-auto mb-2" />
                      <p className="text-sm">No Image Available</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Show Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{show.name}</h1>
              {show.creator && (
                <p className="text-lg text-gray-600">Created by {show.creator}</p>
              )}
            </div>

            {/* Key Info Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Users className="w-3 h-3 mr-1" />
                Ages {show.ageRange}
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Clock className="w-3 h-3 mr-1" />
                {show.episodeLength} min episodes
              </Badge>
              {show.releaseYear && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  <Calendar className="w-3 h-3 mr-1" />
                  {show.endYear && show.endYear !== show.releaseYear 
                    ? `${show.releaseYear}-${show.endYear}` 
                    : show.releaseYear}
                </Badge>
              )}
            </div>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  About This Show
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{show.description}</p>
              </CardContent>
            </Card>

            {/* Stimulation Level */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Stimulation Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex gap-1">
                    {renderStimulationDots(show.stimulationScore || 0)}
                  </div>
                  <span className="text-lg font-medium">
                    {getStimulationLabel(show.stimulationScore || 0)}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({show.stimulationScore || 0}/5)
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Themes */}
            {show.themes && show.themes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Themes & Topics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {show.themes.map((theme, index) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Where to Watch */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Play className="w-5 h-5 mr-2" />
                  Where to Watch
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{formatAvailability(show.availableOn)}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}