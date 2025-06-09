import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Users, 
  Clock, 
  Calendar, 
  BookOpen, 
  Zap,
  Tag
} from "lucide-react";
import SensoryBar from "@/components/SensoryBar";

interface TvShow {
  id: number;
  name: string;
  description: string;
  ageRange: string;
  episodeLength: number;
  creator?: string;
  releaseYear?: number;
  endYear?: number;
  stimulationScore?: number;
  imageUrl?: string;
  themes?: string[];
  dialogueIntensity?: string;
  soundEffectsLevel?: string;
  musicTempo?: string;
  totalMusicLevel?: string;
  totalSoundEffectTimeLevel?: string;
  sceneFrequency?: string;
  interactivityLevel?: string;
  animationStyle?: string;
}

export default function CatalogShowDetailPage() {
  console.log('🔥 CATALOG SHOW DETAIL PAGE COMPONENT LOADED 🔥');
  
  const { id } = useParams<{ id: string }>();
  console.log('CatalogShowDetailPage mounted with params:', { id }, 'parsed ID:', parseInt(id || '0'));
  console.log('Current URL pathname:', window.location.pathname);

  const {
    data: show,
    isLoading,
    error,
  } = useQuery<TvShow>({
    queryKey: ['/api/tv-shows', parseInt(id || '0')],
    queryFn: async () => {
      console.log('=== FETCHING SHOW DETAILS ===');
      console.log('Show ID:', parseInt(id || '0'));
      
      const url = `/api/tv-shows/${parseInt(id || '0')}`;
      console.log('Request URL:', url);
      console.log('Full URL:', `${window.location.origin}${url}`);
      
      const response = await fetch(url);
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch show: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Raw catalog show data received:', data);
      
      const normalizedData = {
        ...data,
        ageRange: data.age_range || data.ageRange,
        episodeLength: data.episode_length || data.episodeLength,
        releaseYear: data.release_year || data.releaseYear,
        endYear: data.end_year || data.endYear,
        stimulationScore: data.stimulation_score || data.stimulationScore,
        imageUrl: data.image_url || data.imageUrl,
        dialogueIntensity: data.dialogue_intensity || data.dialogueIntensity,
        soundEffectsLevel: data.sound_effects_level || data.soundEffectsLevel,
        musicTempo: data.music_tempo || data.musicTempo,
        totalMusicLevel: data.total_music_level || data.totalMusicLevel,
        totalSoundEffectTimeLevel: data.total_sound_effect_time_level || data.totalSoundEffectTimeLevel,
        sceneFrequency: data.scene_frequency || data.sceneFrequency,
        interactivityLevel: data.interactivity_level || data.interactivityLevel,
        animationStyle: data.animation_style || data.animationStyle
      };
      
      console.log('Normalized catalog show data:', normalizedData);
      return normalizedData;
    },
    enabled: !!id && parseInt(id || '0') > 0,
  });

  console.log('Query state - isLoading:', isLoading, 'error:', error, 'show:', !!show);

  // SEO optimization
  useEffect(() => {
    if (show) {
      document.title = `${show.name} - TV Show Details | TV Tantrum`;
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', 
          `${show.name} - ${show.description?.substring(0, 150)}... Ages ${show.ageRange}. Find detailed sensory information and more.`
        );
      }
    } else {
      document.title = 'TV Tantrum - Children\'s TV Show Catalog';
    }
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Show Image */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden">
              <div className="aspect-[2/3] relative">
                {show.imageUrl ? (
                  <img
                    src={show.imageUrl}
                    alt={`${show.name} poster`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/>
                      </svg>
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
                  <SensoryBar level={show.interactivityLevel} />
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
                    <Tag className="w-5 h-5 mr-2" />
                    Themes
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
  );
}