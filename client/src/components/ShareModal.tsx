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
              {aspectRatio === 'portrait' ? (
                // Portrait Layout - Vertical Stack with Better Space Usage
                <>
                  {/* Show Image - Larger */}
                  <div className="relative h-64 bg-gray-50">
                    {show.imageUrl ? (
                      <img
                        src={show.imageUrl}
                        alt={show.name}
                        className="w-full h-full object-contain"
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

                  {/* Content - Compact */}
                  <div className="p-4 flex-1 flex flex-col">
                    {/* Show Title */}
                    <h3 className="font-bold text-gray-900 leading-tight text-lg mb-3">
                      {show.name}
                    </h3>

                    {/* Stimulation Score - Condensed */}
                    {show.stimulationScore && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3 flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-yellow-600" />
                            <span className="font-semibold text-sm">Stimulation Level</span>
                          </div>
                          <span className="font-bold text-lg text-gray-900">{show.stimulationScore}/5</span>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div 
                            className="bg-gradient-to-r from-green-400 to-yellow-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(show.stimulationScore / 5) * 100}%` }}
                          ></div>
                        </div>
                        
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {getStimulationDescription(show.stimulationScore)}
                        </p>
                      </div>
                    )}

                    {/* Age Range */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <Users className="w-4 h-4" />
                      <span>Ages {show.ageRange}</span>
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-auto">
                      <p className="text-xs text-gray-500 font-medium">
                        Discover more shows at <span className="font-bold text-blue-600">tvtantrum.com</span>
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                // Square Layout - Side by Side
                <div className="flex h-full">
                  {/* Left Side - Image (60% width) */}
                  <div className="relative w-3/5 bg-gray-50">
                    {show.imageUrl ? (
                      <img
                        src={show.imageUrl}
                        alt={show.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                        <span className="text-gray-500 text-sm font-medium text-center px-2">{show.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Right Side - Content (40% width) */}
                  <div className="w-2/5 p-3 flex flex-col relative">
                    {/* TV Tantrum Brand - Top Right */}
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
                      <span className="text-xs font-bold text-gray-800">tvtantrum.com</span>
                    </div>

                    {/* Show Title */}
                    <h3 className="font-bold text-gray-900 leading-tight text-sm mb-3 mt-6 pr-16">
                      {show.name}
                    </h3>

                    {/* Stimulation Score - Very Compact */}
                    {show.stimulationScore && (
                      <div className="bg-gray-50 rounded-lg p-2 mb-3 flex-1">
                        <div className="flex items-center gap-1 mb-1">
                          <Zap className="w-3 h-3 text-yellow-600" />
                          <span className="font-semibold text-xs">Stimulation</span>
                          <span className="font-bold text-sm text-gray-900 ml-auto">{show.stimulationScore}/5</span>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                          <div 
                            className="bg-gradient-to-r from-green-400 to-yellow-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${(show.stimulationScore / 5) * 100}%` }}
                          ></div>
                        </div>
                        
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {getStimulationDescription(show.stimulationScore)}
                        </p>
                      </div>
                    )}

                    {/* Age Range */}
                    <div className="flex items-center gap-1 text-xs text-gray-600 mb-3">
                      <Users className="w-3 h-3" />
                      <span>Ages {show.ageRange}</span>
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-auto">
                      <p className="text-xs text-gray-500 font-medium">
                        More at <span className="font-bold text-blue-600">tvtantrum.com</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
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