/**
 * ⚠️ ACTIVE SHOW DETAIL PAGE - This is the LIVE file used in production
 * 
 * Route: /show/:id in App-catalog.tsx
 * 
 * DO NOT EDIT catalog-show-detail-page.tsx (legacy file)
 * 
 * This file contains:
 * - Top ad container (blue/purple gradient)
 * - Bottom ad container (orange/red gradient)
 * - Complete sensory details display
 * - Show information and themes
 */

import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
  Tag,
  Heart
} from "lucide-react";
import SensoryBar from "@/components/SensoryBar";
import ShowCard from "@/components/ShowCard";

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

  // Fetch related shows based on themes and age range
  const { data: relatedShows = [] } = useQuery({
    queryKey: ['/api/tv-shows/related', id, show?.themes, show?.ageRange],
    queryFn: async () => {
      if (!show) return [];
      
      // Try multiple strategies to find related shows, starting with most restrictive
      let allShows: TvShow[] = [];
      
      // Strategy 1: Same themes + similar age range + similar stimulation (most restrictive)
      if (show.themes && show.themes.length > 0) {
        const params1 = new URLSearchParams();
        show.themes.slice(0, 3).forEach(theme => {
          params1.append('themes', theme);
        });
        params1.append('themeMatchMode', 'OR');
        
        if (show.ageRange) {
          params1.append('ageRange', show.ageRange);
        }
        
        if (show.stimulationScore) {
          const minScore = Math.max(1, show.stimulationScore - 1);
          const maxScore = Math.min(5, show.stimulationScore + 1);
          params1.append('stimulationScoreRange', JSON.stringify({ min: minScore, max: maxScore }));
        }
        
        const response1 = await fetch(`/api/tv-shows?${params1.toString()}`);
        if (response1.ok) {
          allShows = await response1.json();
        }
      }
      
      // Strategy 2: If we don't have enough shows, try just themes + age range
      if (allShows.length < 3 && show.themes && show.themes.length > 0) {
        const params2 = new URLSearchParams();
        show.themes.slice(0, 4).forEach(theme => {
          params2.append('themes', theme);
        });
        params2.append('themeMatchMode', 'OR');
        
        if (show.ageRange) {
          params2.append('ageRange', show.ageRange);
        }
        
        const response2 = await fetch(`/api/tv-shows?${params2.toString()}`);
        if (response2.ok) {
          const moreShows = await response2.json();
          // Merge, avoiding duplicates
          const existingIds = new Set(allShows.map(s => s.id));
          allShows = [...allShows, ...moreShows.filter((s: TvShow) => !existingIds.has(s.id))];
        }
      }
      
      // Strategy 3: If still not enough, try just themes (broadest)
      if (allShows.length < 4 && show.themes && show.themes.length > 0) {
        const params3 = new URLSearchParams();
        show.themes.slice(0, 2).forEach(theme => {
          params3.append('themes', theme);
        });
        params3.append('themeMatchMode', 'OR');
        
        const response3 = await fetch(`/api/tv-shows?${params3.toString()}`);
        if (response3.ok) {
          const moreShows = await response3.json();
          // Merge, avoiding duplicates
          const existingIds = new Set(allShows.map(s => s.id));
          allShows = [...allShows, ...moreShows.filter((s: TvShow) => !existingIds.has(s.id))];
        }
      }
      
      // Filter out the current show and prioritize by relevance
      const filteredShows = allShows.filter((relatedShow: TvShow) => relatedShow.id !== show.id);
      
      // Sort by relevance: same age range first, then similar stimulation scores
      return filteredShows
        .sort((a, b) => {
          // Prioritize same age range
          const aAgeMatch = a.ageRange === show.ageRange ? 2 : 0;
          const bAgeMatch = b.ageRange === show.ageRange ? 2 : 0;
          
          // Add stimulation score similarity bonus
          const aStimMatch = Math.abs((a.stimulationScore || 3) - (show.stimulationScore || 3)) <= 1 ? 1 : 0;
          const bStimMatch = Math.abs((b.stimulationScore || 3) - (show.stimulationScore || 3)) <= 1 ? 1 : 0;
          
          return (bAgeMatch + bStimMatch) - (aAgeMatch + aStimMatch);
        })
        .slice(0, 6);
    },
    enabled: !!show,
  });

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
    return (
      <div className="flex justify-center gap-1 mb-1">
        {[1, 2, 3, 4, 5].map((dot) => {
          let bgColor = '';
          if (dot === 1) bgColor = 'bg-green-500';
          else if (dot === 2) bgColor = 'bg-green-400';
          else if (dot === 3) bgColor = 'bg-yellow-500';
          else if (dot === 4) bgColor = 'bg-orange-500';
          else bgColor = 'bg-red-500';
          
          return (
            <div 
              key={dot} 
              className={`w-3 h-3 rounded-full ${dot <= score ? bgColor : 'border border-gray-300'}`}
            />
          );
        })}
      </div>
    );
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

        {/* Top Ad Container - Leaderboard */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-100 to-purple-100 border-2 border-dashed border-blue-400 rounded-lg p-6 text-center shadow-lg">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-lg font-bold text-blue-700">TOP AD SPACE</span>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
            <p className="text-blue-600 font-medium">728x90 Leaderboard Advertisement</p>
            <p className="text-sm text-blue-500 mt-1">Ready for AdSense integration</p>
          </div>
        </div>

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

        {/* What You Might Also Like Section */}
        {relatedShows.length > 0 && (
          <div className="mt-12 mb-8">
            <div className="flex items-center mb-6">
              <Heart className="w-5 h-5 mr-2 text-pink-500" />
              <h2 className="text-xl font-bold text-gray-900">What You Might Also Like</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Shows with similar themes, age range, and stimulation levels
            </p>
            
            {/* Fixed 3-Column Grid - Always 3 cards in a row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedShows.slice(0, 3).map((relatedShow: TvShow) => (
                <ShowCard 
                  key={relatedShow.id}
                  show={relatedShow}
                  viewMode="grid"
                  onClick={() => {}}
                  isMobile={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* Bottom Ad Container - Rectangle */}
        <div className="mt-12 mb-8">
          <div className="bg-gradient-to-tr from-orange-100 to-red-100 border-2 border-dashed border-orange-400 rounded-lg p-6 text-center shadow-lg w-full max-w-sm mx-auto">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="text-lg font-bold text-orange-700">BOTTOM AD SPACE</span>
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <p className="text-orange-600 font-medium">300x250 Rectangle Advertisement</p>
            <p className="text-sm text-orange-500 mt-1">Ready for AdSense integration</p>
          </div>
        </div>
      </div>
    </div>
  );
}