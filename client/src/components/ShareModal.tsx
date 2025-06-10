import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Copy, Smartphone, Square, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  show: {
    id: number;
    name: string;
    description: string;
    stimulationScore?: number;
    imageUrl?: string;
  };
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, show }) => {
  const [aspectRatio, setAspectRatio] = useState<'portrait' | 'square'>('square');
  const [isGenerating, setIsGenerating] = useState(false);
  const shareContentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const getStimulationLabel = (score: number) => {
    switch (score) {
      case 1: return 'Very Calm';
      case 2: return 'Calm';
      case 3: return 'Moderate';
      case 4: return 'Active';
      case 5: return 'Very Active';
      default: return 'Unknown';
    }
  };

  const getStimulationDescription = (score: number) => {
    switch (score) {
      case 1: return 'Perfect for quiet time, bedtime routines, or when you need very gentle content';
      case 2: return 'Great for relaxed viewing, suitable for wind-down time and calm activities';
      case 3: return 'Balanced content that works well for regular viewing throughout the day';
      case 4: return 'Engaging and energetic content, perfect for active play and learning time';
      case 5: return 'High-energy content that will keep kids engaged and excited during active periods';
      default: return 'Stimulation level not available';
    }
  };

  const renderStimulationDots = (score: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <div
        key={i}
        className={`w-3 h-3 rounded-full ${
          i < score 
            ? score <= 2 
              ? 'bg-green-500' 
              : score <= 3 
                ? 'bg-yellow-500' 
                : 'bg-red-500'
            : 'bg-gray-200'
        }`}
      />
    ));
  };

  const generateImage = async () => {
    if (!shareContentRef.current) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(shareContentRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${show.name.replace(/[^a-zA-Z0-9]/g, '_')}_tvtantrum_${aspectRatio}.png`;
          link.click();
          URL.revokeObjectURL(url);
          
          toast({
            title: "Image Downloaded",
            description: `${show.name} share image saved successfully!`,
          });
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error",
        description: "Failed to generate share image. Please try again.",
        variant: "destructive",
      });
    }
    setIsGenerating(false);
  };

  const copyToClipboard = async () => {
    if (!shareContentRef.current) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(shareContentRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            toast({
              title: "Copied to Clipboard",
              description: "Share image copied successfully!",
            });
          } catch (err) {
            // Fallback for browsers that don't support clipboard API
            toast({
              title: "Use Download Instead",
              description: "Your browser doesn't support copying images. Use the download button instead.",
              variant: "destructive",
            });
          }
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error copying image:', error);
      toast({
        title: "Error",
        description: "Failed to copy image. Please try again.",
        variant: "destructive",
      });
    }
    setIsGenerating(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share {show.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Aspect Ratio Controls */}
          <div className="flex gap-2">
            <Button
              variant={aspectRatio === 'square' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAspectRatio('square')}
              className="flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              Square Post
            </Button>
            <Button
              variant={aspectRatio === 'portrait' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAspectRatio('portrait')}
              className="flex items-center gap-2"
            >
              <Smartphone className="w-4 h-4" />
              Story Format
            </Button>
          </div>

          {/* Shareable Content */}
          <div className="flex justify-center">
            <div
              ref={shareContentRef}
              className={`bg-white border-2 border-gray-200 rounded-xl overflow-hidden ${
                aspectRatio === 'portrait' 
                  ? 'w-80 h-[480px]' // 9:16 aspect ratio
                  : 'w-96 h-96' // 1:1 aspect ratio
              }`}
              style={{ 
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              }}
            >
              {/* Show Image */}
              <div className={`relative ${aspectRatio === 'portrait' ? 'h-48' : 'h-40'}`}>
                {show.imageUrl ? (
                  <img
                    src={show.imageUrl}
                    alt={show.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <span className="text-gray-500 text-lg font-medium">{show.name}</span>
                  </div>
                )}
                
                {/* TV Tantrum Brand */}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg">
                  <span className="text-xs font-bold text-gray-800">tvtantrum.com</span>
                </div>
              </div>

              {/* Content */}
              <div className={`p-4 ${aspectRatio === 'portrait' ? 'space-y-3' : 'space-y-2'}`}>
                {/* Show Title */}
                <h3 className={`font-bold text-gray-900 leading-tight ${
                  aspectRatio === 'portrait' ? 'text-lg' : 'text-base'
                }`}>
                  {show.name}
                </h3>

                {/* Stimulation Score */}
                {show.stimulationScore && (
                  <Card className="bg-gray-50">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-yellow-600" />
                        <span className="font-semibold text-sm">Stimulation Level</span>
                      </div>
                      
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex gap-1">
                          {renderStimulationDots(show.stimulationScore)}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {getStimulationLabel(show.stimulationScore)}
                        </Badge>
                      </div>
                      
                      <p className={`text-gray-600 leading-snug ${
                        aspectRatio === 'portrait' ? 'text-xs' : 'text-xs'
                      }`}>
                        {getStimulationDescription(show.stimulationScore)}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Bottom Branding */}
                <div className="text-center pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 font-medium">
                    Discover more shows at <span className="font-bold text-blue-600">tvtantrum.com</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-center">
            <Button
              onClick={generateImage}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {isGenerating ? 'Generating...' : 'Download Image'}
            </Button>
            <Button
              variant="outline"
              onClick={copyToClipboard}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy Image
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Perfect for sharing on Instagram, Facebook, Twitter, or any social platform!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;