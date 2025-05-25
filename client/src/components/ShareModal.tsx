import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, Share2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  show: {
    id: number;
    name: string;
    imageUrl?: string;
    stimulationScore: number;
  };
}

export default function ShareModal({ open, onOpenChange, show }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  // Generate the share URL
  const shareUrl = `${window.location.origin}/share/${show.id}`;
  
  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      
      toast({
        title: "Link copied!",
        description: "Share link has been copied to clipboard",
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle social media sharing
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out ${show.name} on TV Tantrum`,
          text: `Learn about ${show.name} and its stimulation level for kids on TV Tantrum!`,
          url: shareUrl,
        });
        
        toast({
          title: "Shared successfully!",
          description: "Thanks for sharing TV Tantrum",
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      handleCopy();
    }
  };
  
  // Get stimulation level text
  const getStimulationLevelText = (score: number) => {
    switch (score) {
      case 1: return "Low stimulation shows have a calm pace with minimal scene changes, gentle audio, and simple visuals. These are excellent choices for sensitive viewers or children who need help focusing.";
      case 2: return "Low-Medium stimulation shows feature a relaxed pace with occasional increases in action or audio. These provide a gentle viewing experience while still keeping children engaged.";
      case 3: return "Medium stimulation shows balance engaging content with moderate pacing. These shows have varied scenes and audio that won't overwhelm most viewers.";
      case 4: return "Medium-High stimulation shows contain frequent scene changes, more dramatic audio shifts, and vibrant visuals. These are engaging but may be intense for sensitive viewers.";
      case 5: return "High stimulation shows feature rapid scene changes, loud or dramatic audio, and intense visual elements. These shows are very engaging but may not be suitable for sensitive viewers or before bedtime.";
      default: return "This show's stimulation level helps you understand its intensity in terms of visual pace, audio, and overall sensory input.";
    }
  };
  
  // Get stimulation level color
  const getStimulationLevelColor = (score: number) => {
    switch (score) {
      case 1: return "bg-green-100 text-green-800";
      case 2: return "bg-lime-100 text-lime-800";
      case 3: return "bg-yellow-100 text-yellow-800";
      case 4: return "bg-orange-100 text-orange-800";
      case 5: return "bg-red-100 text-red-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };
  
  // Get stimulation level name
  const getStimulationLevelName = (score: number) => {
    switch (score) {
      case 1: return "Low";
      case 2: return "Low-Medium";
      case 3: return "Medium";
      case 4: return "Medium-High";
      case 5: return "High";
      default: return "Medium";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share "{show.name}"</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col space-y-4 py-4">
          {/* Show image */}
          {show.imageUrl ? (
            <div className="flex justify-center">
              <img 
                src={show.imageUrl} 
                alt={show.name} 
                className="h-48 object-contain rounded-md" 
              />
            </div>
          ) : (
            <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-md">
              <i className="fas fa-tv text-gray-400 text-4xl"></i>
            </div>
          )}
          
          {/* Stimulation score */}
          <div className="flex flex-col items-center space-y-2">
            <Badge className={`${getStimulationLevelColor(show.stimulationScore)} px-3 py-1 text-sm`}>
              {getStimulationLevelName(show.stimulationScore)} Stimulation
            </Badge>
            
            <div className="h-2 w-full max-w-56 bg-gray-200 rounded-full overflow-hidden flex mt-1">
              {[1, 2, 3, 4, 5].map((segment) => {
                const color = 
                  segment === 1 ? 'bg-green-500' : 
                  segment === 2 ? 'bg-lime-500' : 
                  segment === 3 ? 'bg-yellow-500' : 
                  segment === 4 ? 'bg-orange-500' : 
                  'bg-red-500';
                
                return (
                  <div
                    key={segment}
                    className={`h-full w-1/5 ${segment <= show.stimulationScore ? color : 'bg-gray-200'}`}
                  />
                );
              })}
            </div>
          </div>
          
          {/* Stimulation description */}
          <p className="text-sm text-gray-600 text-center">
            {getStimulationLevelText(show.stimulationScore)}
          </p>
          
          {/* Share link input */}
          <div className="flex items-center space-x-2">
            <Input
              value={shareUrl}
              readOnly
              className="flex-1"
            />
            <Button size="icon" onClick={handleCopy} variant="outline">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:space-x-2">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
          <Button onClick={handleShare} className="mt-2 sm:mt-0">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}