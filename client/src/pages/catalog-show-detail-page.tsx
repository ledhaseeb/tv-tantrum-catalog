import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useEffect, useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
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
  Share2,
  Copy,
  Download
} from "lucide-react";
import type { TvShow } from "@shared/schema";
import CatalogNavbar from "@/components/CatalogNavbar";
import Footer from "@/components/Footer";
import SensoryBar from "@/components/SensoryBar";

export default function CatalogShowDetailPage() {
  console.log('🔥 CATALOG SHOW DETAIL PAGE COMPONENT LOADED 🔥');
  
  const params = useParams();
  const id = parseInt(params.id || "0");
  const { toast } = useToast();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);
  
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

  // Loading and error states
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    console.error('Error in CatalogShowDetailPage:', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Show</CardTitle>
          </CardHeader>
          <CardContent>
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
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-red-600">Show Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              The requested show could not be found.
            </p>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Return to Browse
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  const getStimulationDescription = (score: number): string => {
    switch (score) {
      case 1: return "Perfect for quiet time, bedtime routines, or when children need to wind down. Features gentle pacing, soft sounds, and minimal visual stimulation.";
      case 2: return "Great for relaxed viewing that maintains attention without overstimulation. Balanced content that's engaging yet soothing.";
      case 3: return "Ideal for regular playtime with moderate energy levels. Balanced stimulation that keeps children engaged and entertained.";
      case 4: return "Perfect for active play and learning. Higher energy content that encourages movement and excitement.";
      case 5: return "High-energy content designed for active engagement. Features fast-paced action, vibrant visuals, and dynamic audio.";
      default: return "This show's stimulation level helps you understand its intensity in terms of visual pace, audio, and overall sensory input.";
    }
  };

  const copyShowLink = async () => {
    const url = `${window.location.origin}/shows/${show?.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied!",
        description: "Share link has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the URL manually from your browser.",
        variant: "destructive",
      });
    }
  };

  const shareToSocial = (platform: string) => {
    const url = `${window.location.origin}/shows/${show?.id}`;
    const text = `Check out "${show?.name}" - ${getStimulationLabel(show?.stimulationScore || 0)} stimulation content perfect for kids! 📺✨`;
    
    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
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

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Show Image - Reduced Size */}
              <div className="lg:col-span-1">
                <Card className="overflow-hidden max-w-xs mx-auto lg:mx-0">
                  <div className="aspect-[2/3] bg-gray-200 flex items-center justify-center w-full max-w-[240px] mx-auto">
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

              {/* Show Details - Expanded */}
              <div className="lg:col-span-3 space-y-6">
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

                {/* Large Share Button */}
                <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-semibold">
                      <Share2 className="w-6 h-6 mr-3" />
                      Share This Show
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Share "{show.name}"</DialogTitle>
                    </DialogHeader>
                    
                    {/* Shareable Card Preview */}
                    <div 
                      ref={shareRef}
                      className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg border-2 border-blue-200 mx-auto"
                      style={{ width: '400px' }}
                    >
                      <div className="flex items-start gap-4">
                        {/* Show Image */}
                        <div className="flex-shrink-0">
                          {show.imageUrl ? (
                            <img 
                              src={show.imageUrl} 
                              alt={show.name}
                              className="w-20 h-28 object-cover rounded-lg border-2 border-white shadow-md"
                            />
                          ) : (
                            <div className="w-20 h-28 bg-gray-300 rounded-lg flex items-center justify-center border-2 border-white shadow-md">
                              <Play className="w-8 h-8 text-gray-500" />
                            </div>
                          )}
                        </div>
                        
                        {/* Show Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">{show.name}</h3>
                          
                          {/* Stimulation Level Display */}
                          <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                            <div className="text-sm font-medium text-gray-700 mb-2">Stimulation Level</div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex gap-1">
                                {renderStimulationDots(show.stimulationScore || 0)}
                              </div>
                              <span className="font-semibold text-gray-900">
                                {getStimulationLabel(show.stimulationScore || 0)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {getStimulationDescription(show.stimulationScore || 0)}
                            </p>
                          </div>
                          
                          {/* Branding */}
                          <div className="mt-3 text-center">
                            <div className="text-sm font-semibold text-blue-600">TV Tantrum</div>
                            <div className="text-xs text-gray-500">Find perfect shows for your kids</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Share Options */}
                    <div className="space-y-4 mt-6">
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant="outline"
                          onClick={() => shareToSocial('twitter')}
                          className="flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                          </svg>
                          Twitter
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => shareToSocial('facebook')}
                          className="flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                          Facebook
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => shareToSocial('whatsapp')}
                          className="flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                          </svg>
                          WhatsApp
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => shareToSocial('telegram')}
                          className="flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                          </svg>
                          Telegram
                        </Button>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={copyShowLink}
                          className="flex-1 flex items-center gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          Copy Link
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

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