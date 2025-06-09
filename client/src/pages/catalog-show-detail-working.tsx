import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useEffect, useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
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
  Copy
} from "lucide-react";

interface CatalogShowDetailWorkingProps {
  showId?: string;
}

export default function CatalogShowDetailWorking({ showId: propShowId }: CatalogShowDetailWorkingProps = {}) {
  const params = useParams();
  const id = parseInt(propShowId || params.id || "0");
  const { toast } = useToast();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  console.log('[ShowDetail] Component loaded, ID:', id, 'Params:', params);

  // Fetch show details
  const { data: show, isLoading, error } = useQuery({
    queryKey: ['catalog-tv-show', id],
    queryFn: async () => {
      console.log('[ShowDetail] Fetching show with ID:', id);
      const response = await fetch(`/api/tv-shows/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch show details');
      }
      const rawData = await response.json();
      console.log('[ShowDetail] Raw data received:', rawData);
      
      // Normalize the data structure
      const normalizedData = {
        id: rawData.id,
        name: rawData.name || rawData.title,
        description: rawData.description,
        ageRange: rawData.age_range || rawData.ageRange,
        stimulationScore: rawData.stimulation_score || rawData.stimulationScore || 3,
        imageUrl: rawData.image_url || rawData.imageUrl,
        themes: rawData.themes || [],
        creator: rawData.creator,
        releaseYear: rawData.release_year || rawData.releaseYear,
        episodeLength: rawData.episode_length || rawData.episodeLength,
        availableOn: rawData.available_on || rawData.availableOn || [],
        interactivityLevel: rawData.interactivity_level || rawData.interactivityLevel,
        dialogueIntensity: rawData.dialogue_intensity || rawData.dialogueIntensity,
        soundEffectsLevel: rawData.sound_effects_level || rawData.soundEffectsLevel,
        sceneFrequency: rawData.scene_frequency || rawData.sceneFrequency,
        musicTempo: rawData.music_tempo || rawData.musicTempo,
        tantrumFactor: rawData.tantrum_factor || rawData.tantrumFactor,
        isFeatured: rawData.is_featured || rawData.isFeatured || false,
        endYear: rawData.end_year || rawData.endYear,
        isOngoing: rawData.is_ongoing || rawData.isOngoing,
        hasYoutubeData: rawData.has_youtube_data || rawData.hasYoutubeData,
      };
      
      console.log('[ShowDetail] Normalized data:', normalizedData);
      return normalizedData;
    },
    enabled: !!id && id > 0,
  });

  console.log('[ShowDetail] Query state - isLoading:', isLoading, 'error:', error, 'show:', !!show);

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
      'bg-red-700',      // 5 - High
    ];

    for (let i = 1; i <= 5; i++) {
      const isActive = i <= score;
      const colorClass = isActive ? colors[i - 1] : 'bg-gray-300';
      
      dots.push(
        <div
          key={i}
          className={`w-3 h-3 rounded-full ${colorClass}`}
        />
      );
    }
    return dots;
  };

  // Loading state
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

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Show</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Failed to load show details. Please try again later.
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

  // Show not found
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

  console.log('[ShowDetail] About to render, show exists:', !!show);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">


        {/* Back Button */}
        <Link href="/">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Shows
          </Button>
        </Link>

        {/* Test Share Button - Visible */}
        <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-lg">
          <p className="text-sm text-green-800 mb-2">Share Button Test:</p>
          <Button 
            onClick={() => setShareDialogOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Test Share Button
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Show Image */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden max-w-xs mx-auto lg:mx-0">
              <CardContent className="p-0">
                {show.imageUrl ? (
                  <img 
                    src={show.imageUrl} 
                    alt={show.name}
                    className="w-full h-auto object-cover"
                  />
                ) : (
                  <div className="aspect-[2/3] bg-gray-300 flex items-center justify-center">
                    <Play className="w-12 h-12 text-gray-500" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Show Details */}
          <div className="lg:col-span-3 space-y-6">
            {/* Title and Basic Info */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{show.name}</h1>
              <p className="text-gray-700 leading-relaxed mb-4">{show.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary">{show.ageRange}</Badge>
                {show.creator && <Badge variant="outline">{show.creator}</Badge>}
                {show.releaseYear && <Badge variant="outline">{show.releaseYear}</Badge>}
              </div>
            </div>

            {/* Stimulation Level */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Stimulation Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
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
                <p className="text-sm text-gray-600 leading-relaxed">
                  {getStimulationDescription(show.stimulationScore || 0)}
                </p>
              </CardContent>
            </Card>

            {/* CRITICAL TEST - SIMPLE DIV */}
            <div className="w-full mb-6 p-8 border-4 border-red-500 bg-yellow-100">
              <h2 className="text-red-800 font-bold text-2xl mb-4">🚨 TEST SECTION - SHOULD BE VISIBLE 🚨</h2>
              <p className="text-red-800 font-bold mb-4">If you see this, the component structure works</p>
              <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-semibold">
                <Share2 className="w-6 h-6 mr-3" />
                BASIC SHARE BUTTON TEST
              </Button>
            </div>


            {/* Show Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Episode Length
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg">{show.episodeLength || 'Not specified'} minutes</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Age Range
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg">{show.ageRange}</p>
                </CardContent>
              </Card>
            </div>

            {/* Themes */}
            {show.themes && show.themes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="w-5 h-5 mr-2" />
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