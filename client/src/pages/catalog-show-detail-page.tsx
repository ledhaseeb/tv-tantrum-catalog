import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
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
  Zap,
  ArrowLeft,
} from "lucide-react";
import type { TvShow } from "@shared/schema";
import CatalogNavbar from "@/components/CatalogNavbar";
import Footer from "@/components/Footer";
import SensoryBar from "@/components/SensoryBar";

export default function CatalogShowDetailPage() {
  console.log('🔥 CATALOG SHOW DETAIL PAGE COMPONENT LOADED 🔥');
  
  const params = useParams();
  const id = parseInt(params.id || "0");
  
  console.log('CatalogShowDetailPage mounted with params:', params, 'parsed ID:', id);
  console.log('Current URL pathname:', window.location.pathname);
  
  // Fetch show details
  const { data: show, isLoading, error } = useQuery({
    queryKey: ['catalog-tv-show', id],
    queryFn: async () => {
      console.log('=== FETCHING SHOW DETAILS ===');
      console.log('Show ID:', id);
      console.log('Request URL:', `/api/tv-shows/${id}`);
      console.log('Full URL:', `${window.location.origin}/api/tv-shows/${id}`);
      
      const response = await fetch(`/api/tv-shows/${id}`);
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to fetch show: ${response.status} - ${errorText}`);
      }
      
      const rawData = await response.json();
      console.log('Raw catalog show data received:', rawData);
      
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
      
      console.log('Normalized catalog show data:', normalizedData);
      return normalizedData;
    },
    enabled: !!id && id > 0,
  });

  console.log('Query state - isLoading:', isLoading, 'error:', error, 'show:', !!show);

  // Helper function to convert sensory levels to percentages
  const getSensoryLevelPercentage = (level: string | null | undefined) => {
    if (!level) return 0;
    const normalizedLevel = level.toLowerCase().trim();
    
    switch (normalizedLevel) {
      case 'very low':
      case 'very-low':
        return 20;
      case 'low':
        return 20;
      case 'low-moderate':
      case 'low moderate':
        return 40;
      case 'moderate':
        return 60;
      case 'moderate-high':
      case 'moderate high':
        return 80;
      case 'high':
        return 100;
      case 'very high':
      case 'very-high':
        return 100;
      default:
        return 60; // Default to moderate if unknown
    }
  };

  // SEO optimization
  useEffect(() => {
    if (show) {
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
    }
    return () => {
      document.title = 'TV Tantrum - Children\'s TV Show Catalog';
    };
  }, [show]);

  // Helper functions
  const getStimulationLabel = (score: number) => {
    switch (score) {
      case 1: return 'Low';
      case 2: return 'Low-Medium';
      case 3: return 'Medium';
      case 4: return 'Medium-High';
      case 5: return 'High';
      default: return 'Unknown';
    }
  };

  const renderStimulationDots = (score: number) => {
    const dots = [];
    const colors = [
      'bg-green-500',    // 1 - Low
      'bg-yellow-500',   // 2 - Low-Medium  
      'bg-orange-500',   // 3 - Medium
      'bg-red-500',      // 4 - Medium-High
      'bg-red-700'       // 5 - High
    ];
    
    for (let i = 1; i <= 5; i++) {
      const isActive = i <= score;
      const colorClass = isActive ? colors[i - 1] : 'bg-gray-300';
      const ringClass = i === score ? 'ring-2 ring-gray-400' : '';
      
      dots.push(
        <div
          key={i}
          className={`w-3 h-3 rounded-full ${colorClass} ${ringClass}`}
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

  const LoadingSkeleton = () => (
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

  const ErrorState = () => (
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
            {error && (
              <p className="text-sm text-gray-500 mb-4">
                Error: {error.message}
              </p>
            )}
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

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    console.error('Error in CatalogShowDetailPage:', error);
    return <ErrorState />;
  }

  if (!show) {
    return <ErrorState />;
  }

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

                {/* Sensory Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Zap className="w-5 h-5 mr-2" />
                      Sensory Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Dialogue Intensity */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Dialogue Intensity:</span>
                        <span className="text-sm text-gray-600">{show.dialogueIntensity || 'Not specified'}</span>
                      </div>
                      <SensoryBar level={show.dialogueIntensity} />
                    </div>

                    {/* Scene Frequency */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Scene Frequency:</span>
                        <span className="text-sm text-gray-600">{show.sceneFrequency || 'Not specified'}</span>
                      </div>
                      <SensoryBar level={show.sceneFrequency} />
                    </div>

                    {/* Sound Effects Level */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Sound Effects Level:</span>
                        <span className="text-sm text-gray-600">{show.soundEffectsLevel || 'Not specified'}</span>
                      </div>
                      <SensoryBar level={show.soundEffectsLevel} />
                    </div>

                    {/* Total Sound Effect Time */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Total Sound Effect Time:</span>
                        <span className="text-sm text-gray-600">{show.totalSoundEffectTimeLevel || 'Not specified'}</span>
                      </div>
                      <SensoryBar level={show.totalSoundEffectTimeLevel} />
                    </div>

                    {/* Music Tempo */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Music Tempo:</span>
                        <span className="text-sm text-gray-600">{show.musicTempo || 'Not specified'}</span>
                      </div>
                      <SensoryBar level={show.musicTempo} />
                    </div>

                    {/* Total Music Level */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Total Music Level:</span>
                        <span className="text-sm text-gray-600">{show.totalMusicLevel || 'Not specified'}</span>
                      </div>
                      <SensoryBar level={show.totalMusicLevel} />
                    </div>

                    {/* Interaction Level */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Interaction Level:</span>
                        <span className="text-sm text-gray-600">{show.interactivityLevel || 'Not specified'}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
                        <div 
                          className="absolute inset-0 bg-gradient-to-r from-green-400 via-yellow-400 via-orange-400 to-red-400 h-2 rounded-full"
                        ></div>
                        <div 
                          className="absolute top-0 right-0 bg-gray-200 h-2 rounded-r-full"
                          style={{ width: `${100 - getSensoryLevelPercentage(show.interactivityLevel)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Animation Style */}
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Animation Style:</span>
                        <span className="text-sm text-gray-600">{show.animationStyle || 'Not specified'}</span>
                      </div>
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
                        {show.themes.map((theme: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-sm">
                            {theme}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}


              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}