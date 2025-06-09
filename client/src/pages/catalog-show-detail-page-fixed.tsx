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

import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SensoryBar from "@/components/SensoryBar";
import { 
  ArrowLeft, 
  User, 
  Users, 
  Clock, 
  Calendar, 
  BookOpen, 
  Tag, 
  Activity, 
  Heart 
} from "lucide-react";
import { useEffect, useState } from "react";

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
  const { id } = useParams();
  const [relatedShows, setRelatedShows] = useState<TvShow[]>([]);

  const { data: show, isLoading, error } = useQuery<TvShow>({
    queryKey: [`/api/catalog/shows/${id}`],
    enabled: !!id,
  });

  useEffect(() => {
    if (show) {
      const fetchRelatedShows = async () => {
        try {
          let allShows: TvShow[] = [];
          const existingIds = new Set<number>();

          // Fetch by age range
          if (show.ageRange) {
            const ageResponse = await fetch(`/api/catalog/shows/by-age-range?ageRange=${encodeURIComponent(show.ageRange)}&limit=20`);
            if (ageResponse.ok) {
              const ageShows = await ageResponse.json();
              ageShows.forEach((s: TvShow) => {
                if (!existingIds.has(s.id)) {
                  allShows.push(s);
                  existingIds.add(s.id);
                }
              });
            }
          }

          // Fetch by themes if available
          if (show.themes && show.themes.length > 0) {
            for (const theme of show.themes.slice(0, 2)) {
              const themeResponse = await fetch(`/api/catalog/shows/by-theme?theme=${encodeURIComponent(theme)}&limit=15`);
              if (themeResponse.ok) {
                const themeShows = await themeResponse.json();
                themeShows.forEach((s: TvShow) => {
                  if (!existingIds.has(s.id)) {
                    allShows.push(s);
                    existingIds.add(s.id);
                  }
                });
              }
            }
          }

          // Fetch by stimulation score if available
          if (show.stimulationScore) {
            const stimResponse = await fetch(`/api/catalog/shows/by-stimulation?score=${show.stimulationScore}&limit=15`);
            if (stimResponse.ok) {
              const stimShows = await stimResponse.json();
              stimShows.forEach((s: TvShow) => {
                if (!existingIds.has(s.id)) {
                  allShows.push(s);
                  existingIds.add(s.id);
                }
              });
            }
          }

          // Get general shows if we don't have enough
          if (allShows.length < 10) {
            const generalResponse = await fetch('/api/catalog/shows?limit=20');
            if (generalResponse.ok) {
              const moreShows = await generalResponse.json();
              moreShows.forEach((s: TvShow) => {
                if (!existingIds.has(s.id)) {
                  allShows.push(s);
                  existingIds.add(s.id);
                }
              });
            }
          }

          // Filter out the current show and shuffle
          const filteredShows = allShows.filter((relatedShow: TvShow) => relatedShow.id !== show.id);
          const shuffled = filteredShows.sort(() => 0.5 - Math.random());
          setRelatedShows(shuffled.slice(0, 8));
        } catch (error) {
          console.error('Error fetching related shows:', error);
        }
      };

      fetchRelatedShows();
    }
  }, [show]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading show details...</p>
        </div>
      </div>
    );
  }

  if (error || !show) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Show Not Found</h1>
          <p className="text-gray-600 mb-6">The show you're looking for doesn't exist.</p>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Shows
            </Button>
          </Link>
        </div>
      </div>
    );
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

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Column - Image */}
          <div className="flex justify-center lg:justify-start">
            <Card className="overflow-hidden shadow-lg max-w-md w-full">
              <div className="aspect-[3/4] relative">
                <img
                  src={show.imageUrl || '/placeholder-tv-show.jpg'}
                  alt={show.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </Card>
          </div>

          {/* Right Column - Basic Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                  {show.name}
                </CardTitle>
                <div className="space-y-3">
                  {show.creator && (
                    <div className="flex items-center text-gray-600">
                      <User className="w-4 h-4 mr-2" />
                      <span>Created by {show.creator}</span>
                    </div>
                  )}
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span>Ages {show.ageRange}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{show.episodeLength} minute episodes</span>
                  </div>
                  {(show.releaseYear || show.endYear) && (
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>
                        {show.releaseYear}
                        {show.endYear && show.endYear !== show.releaseYear && ` - ${show.endYear}`}
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Stimulation Score */}
                {show.stimulationScore && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Stimulation Level</span>
                      <span className="text-sm font-bold text-gray-900">{show.stimulationScore}/5</span>
                    </div>
                    <SensoryBar score={show.stimulationScore} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Single Column Content Below */}
        <div className="space-y-6">
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
                  {show.themes.map((theme, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {theme}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sensory Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Sensory Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {show.dialogueIntensity && (
                  <div>
                    <span className="font-medium text-gray-700">Dialogue Intensity:</span>
                    <span className="ml-2 text-gray-600">{show.dialogueIntensity}</span>
                  </div>
                )}
                {show.soundEffectsLevel && (
                  <div>
                    <span className="font-medium text-gray-700">Sound Effects:</span>
                    <span className="ml-2 text-gray-600">{show.soundEffectsLevel}</span>
                  </div>
                )}
                {show.musicTempo && (
                  <div>
                    <span className="font-medium text-gray-700">Music Tempo:</span>
                    <span className="ml-2 text-gray-600">{show.musicTempo}</span>
                  </div>
                )}
                {show.sceneFrequency && (
                  <div>
                    <span className="font-medium text-gray-700">Scene Changes:</span>
                    <span className="ml-2 text-gray-600">{show.sceneFrequency}</span>
                  </div>
                )}
                {show.interactivityLevel && (
                  <div>
                    <span className="font-medium text-gray-700">Interactivity:</span>
                    <span className="ml-2 text-gray-600">{show.interactivityLevel}</span>
                  </div>
                )}
                {show.animationStyle && (
                  <div>
                    <span className="font-medium text-gray-700">Animation Style:</span>
                    <span className="ml-2 text-gray-600">{show.animationStyle}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Related Shows */}
          {relatedShows.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="w-5 h-5 mr-2" />
                  You Might Also Like
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {relatedShows.slice(0, 4).map((relatedShow: TvShow) => (
                    <Link key={relatedShow.id} href={`/show/${relatedShow.id}`}>
                      <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                        <div className="aspect-[3/4] relative">
                          <img
                            src={relatedShow.imageUrl || '/placeholder-tv-show.jpg'}
                            alt={relatedShow.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-3">
                          <h4 className="font-medium text-sm line-clamp-2">{relatedShow.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">Ages {relatedShow.ageRange}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
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
    </div>
  );
}