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
// AdContainer component removed - using direct HTML implementation

export default function CatalogShowDetailPage() {
  console.log('🔥 CATALOG SHOW DETAIL PAGE COMPONENT LOADED 🔥');
  
  const params = useParams();
  const id = parseInt(params.id || "0");
  
  console.log('CatalogShowDetailPage mounted with params:', params, 'parsed ID:', id);
  console.log('Current URL pathname:', window.location.pathname);
  
  // Force valid ID for testing if none provided
  const validId = id > 0 ? id : 1;
  
  // Fetch show details
  const { data: show, isLoading, error } = useQuery({
    queryKey: ['catalog-tv-show', validId],
    queryFn: async () => {
      console.log('=== FETCHING SHOW DETAILS ===');
      console.log('Show ID:', validId);
      console.log('Request URL:', `/api/tv-shows/${validId}`);
      console.log('Full URL:', `${window.location.origin}/api/tv-shows/${validId}`);
      
      const response = await fetch(`/api/tv-shows/${validId}`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      });
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to fetch show: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('=== RECEIVED SHOW DATA ===');
      console.log('Show data:', data);
      console.log('Show ID from response:', data?.id);
      console.log('Show name:', data?.name);
      console.log('Show image URL:', data?.imageUrl);
      console.log('Show description length:', data?.description?.length);
      console.log('==========================');
      
      return data;
    },
    enabled: id > 0
  });

  // Helper function to convert sensory level to percentage
  const getLevelPercentage = (level: string) => {
    if (!level) return 60;
    switch (level.toLowerCase()) {
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
      default: return 'Medium';
    }
  };

  const getStimulationColor = (score: number) => {
    switch (score) {
      case 1: return '#22c55e'; // Low - Green
      case 2: return '#84cc16'; // Low-Medium - Lime
      case 3: return '#eab308'; // Medium - Yellow
      case 4: return '#f97316'; // Medium-High - Orange
      case 5: return '#dc2626'; // High - Red
      default: return '#eab308'; // Default to Medium - Yellow
    }
  };

  const renderStimulationDots = (score: number) => {
    const dots = [];
    for (let i = 1; i <= 5; i++) {
      const isActive = i <= score;
      const colorClass = isActive ? 'bg-current' : 'bg-gray-300';
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
            <CardTitle className="text-center">Show Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Sorry, we couldn't find the show you're looking for.
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
      <CatalogNavbar />
      
      {/* DEBUG: Component verification banner */}
      <div className="bg-red-500 text-white text-center py-2 font-bold">
        ⚠️ CATALOG SHOW DETAIL PAGE COMPONENT IS LOADING ⚠️
      </div>
      
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
                      console.log('Image failed to load:', show.imageUrl);
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`text-center p-4 ${show.imageUrl ? 'hidden' : ''}`}>
                  <Play className="w-16 h-16 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500 font-medium">{show.name}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Show Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Basic Info */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{show.name}</h1>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary" className="text-sm">
                  <Users className="w-3 h-3 mr-1" />
                  Ages {show.ageRange}
                </Badge>
                <Badge variant="secondary" className="text-sm">
                  <Clock className="w-3 h-3 mr-1" />
                  {show.episodeLength} min episodes
                </Badge>
                {show.releaseYear && (
                  <Badge variant="secondary" className="text-sm">
                    <Calendar className="w-3 h-3 mr-1" />
                    {show.releaseYear}
                  </Badge>
                )}
              </div>
              
              {/* Stimulation Level */}
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="w-5 h-5" style={{ color: getStimulationColor(show.stimulationScore) }} />
                  <span className="font-semibold">
                    Stimulation Level: {getStimulationLabel(show.stimulationScore)}
                  </span>
                </div>
                <div className="flex items-center gap-2" style={{ color: getStimulationColor(show.stimulationScore) }}>
                  {renderStimulationDots(show.stimulationScore)}
                  <span className="text-sm ml-2">({show.stimulationScore}/5)</span>
                </div>
              </div>

              {show.description && (
                <p className="text-gray-700 leading-relaxed">{show.description}</p>
              )}
            </div>

            {/* Middle Ad Container - Rectangle */}
            <div className="my-8">
              <div className="bg-gradient-to-br from-green-100 to-teal-100 border-2 border-dashed border-green-400 rounded-lg p-6 text-center shadow-lg w-full max-w-sm mx-auto">
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                  <span className="text-lg font-bold text-green-700">MIDDLE AD SPACE</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                </div>
                <p className="text-green-600 font-medium">300x250 Rectangle Advertisement</p>
                <p className="text-sm text-green-500 mt-1">Ready for AdSense integration</p>
              </div>
            </div>

            {/* Production Details */}
            {(show.creator || show.releaseYear || show.endYear || show.isOngoing !== null) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Production Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {show.creator && (
                      <div>
                        <dt className="font-medium text-gray-500 mb-1">Creator</dt>
                        <dd className="text-gray-900">{show.creator}</dd>
                      </div>
                    )}
                    {show.releaseYear && (
                      <div>
                        <dt className="font-medium text-gray-500 mb-1">Release Year</dt>
                        <dd className="text-gray-900">{show.releaseYear}</dd>
                      </div>
                    )}
                    {show.endYear && (
                      <div>
                        <dt className="font-medium text-gray-500 mb-1">End Year</dt>
                        <dd className="text-gray-900">{show.endYear}</dd>
                      </div>
                    )}
                    {show.isOngoing !== null && (
                      <div>
                        <dt className="font-medium text-gray-500 mb-1">Status</dt>
                        <dd className="text-gray-900">
                          {show.isOngoing ? 'Ongoing' : 'Completed'}
                        </dd>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Middle Ad Container */}
            <div className="my-8">
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg flex items-center justify-center shadow-sm w-full max-w-sm h-64 mx-auto">
                <div className="text-center p-4">
                  <div className="text-sm text-blue-600 font-semibold uppercase tracking-wide">Advertisement</div>
                  <div className="text-sm text-blue-500 mt-1 font-medium">Ad Space Ready</div>
                  <div className="text-xs text-blue-400 mt-1">Size: rectangle</div>
                </div>
              </div>
            </div>

            {/* Sensory Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Sensory & Interaction Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {show.interactivityLevel && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Interactivity Level:</span>
                        <span className="text-sm text-gray-600">{show.interactivityLevel}</span>
                      </div>
                      <SensoryBar level={show.interactivityLevel} />
                    </div>
                  )}
                  {show.dialogueIntensity && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Dialogue Intensity:</span>
                        <span className="text-sm text-gray-600">{show.dialogueIntensity}</span>
                      </div>
                      <SensoryBar level={show.dialogueIntensity} />
                    </div>
                  )}
                  {show.soundEffectsLevel && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Sound Effects Level:</span>
                        <span className="text-sm text-gray-600">{show.soundEffectsLevel}</span>
                      </div>
                      <SensoryBar level={show.soundEffectsLevel} />
                    </div>
                  )}
                  {show.sceneFrequency && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Scene Change Frequency:</span>
                        <span className="text-sm text-gray-600">{show.sceneFrequency}</span>
                      </div>
                      <SensoryBar level={show.sceneFrequency} />
                    </div>
                  )}
                  {show.musicTempo && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Music Tempo:</span>
                        <span className="text-sm text-gray-600">{show.musicTempo}</span>
                      </div>
                      <SensoryBar level={show.musicTempo} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Availability */}
            {show.availableOn && show.availableOn.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Play className="w-5 h-5 mr-2" />
                    Where to Watch
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {show.availableOn.map((platform: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-sm">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

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

            {/* Bottom Ad Container - Rectangle */}
            <div className="mt-8 mb-6">
              <div className="bg-gradient-to-tr from-orange-100 to-red-100 border-2 border-dashed border-orange-400 rounded-lg p-6 text-center shadow-lg w-full max-w-sm mx-auto">
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="text-lg font-bold text-orange-700">BOTTOM AD SPACE</span>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                </div>
                <p className="text-orange-600 font-medium">300x250 Rectangle Advertisement</p>
                <p className="text-sm text-orange-500 mt-1">Ready for AdSense integration</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}