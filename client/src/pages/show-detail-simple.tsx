import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { 
  ArrowLeft,
  Share2,
  Copy,
  Zap
} from "lucide-react";

interface ShowDetailSimpleProps {
  showId?: string;
}

export default function ShowDetailSimple({ showId: propShowId }: ShowDetailSimpleProps = {}) {
  const params = useParams();
  const id = parseInt(propShowId || params.id || "0");
  const { toast } = useToast();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const { data: show, isLoading } = useQuery({
    queryKey: ['tv-show', id],
    queryFn: async () => {
      const response = await fetch(`/api/tv-shows/${id}`);
      if (!response.ok) throw new Error('Failed to fetch show');
      const data = await response.json();
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        ageRange: data.age_range || data.ageRange,
        stimulationScore: data.stimulation_score || data.stimulationScore || 3,
        imageUrl: data.image_url || data.imageUrl,
        themes: data.themes || [],
        creator: data.creator,
        releaseYear: data.release_year || data.releaseYear,
        episodeLength: data.episode_length || data.episodeLength
      };
    },
    enabled: id > 0
  });

  const shareUrl = `${window.location.origin}/show/${id}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: show?.name,
          text: `Check out ${show?.name} on TV Tantrum`,
          url: shareUrl
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      setShareDialogOpen(true);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Share link has been copied to clipboard."
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy link to clipboard.",
        variant: "destructive"
      });
    }
  };

  const getStimulationLabel = (score: number) => {
    if (score <= 1) return "Very Low";
    if (score <= 2) return "Low";
    if (score <= 3) return "Medium";
    if (score <= 4) return "Medium-High";
    return "High";
  };

  const renderStimulationDots = (score: number) => {
    const dots = [];
    for (let i = 1; i <= 5; i++) {
      let color = "#E5E7EB"; // Gray for empty
      if (i <= score) {
        if (i <= 2) color = "#10B981"; // Green
        else if (i <= 3) color = "#F59E0B"; // Yellow
        else color = "#EF4444"; // Red
      }
      dots.push(
        <div
          key={i}
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
      );
    }
    return dots;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading show details...</div>
        </div>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Show not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Shows
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Show Image */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {show.imageUrl ? (
                  <img 
                    src={show.imageUrl} 
                    alt={show.name}
                    className="w-full h-auto object-cover"
                  />
                ) : (
                  <div className="w-full aspect-[3/4] bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">No Image</span>
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
                    {renderStimulationDots(show.stimulationScore)}
                  </div>
                  <span className="text-lg font-medium">
                    {getStimulationLabel(show.stimulationScore)}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({show.stimulationScore}/5)
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* SHARE BUTTON - LARGE AND PROMINENT */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">Share This Show</h3>
                  <Button 
                    onClick={handleShare}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold"
                  >
                    <Share2 className="w-6 h-6 mr-3" />
                    Share Show
                  </Button>
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

        {/* Share Dialog */}
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share {show.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Share URL:</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <Button onClick={copyToClipboard} size="sm">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}