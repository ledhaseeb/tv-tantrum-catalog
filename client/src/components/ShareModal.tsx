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
import { Copy, Share2, Check, Facebook, Twitter, Mail, Linkedin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

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
  
  // Generate the share URL with referral parameter if user is logged in
  const { user } = useAuth();
  const shareUrl = user 
    ? `${window.location.origin}/share/${show.id}?ref=${user.id}` 
    : `${window.location.origin}/share/${show.id}`;
  
  // Social media share URLs
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${show.name} on TV Tantrum! Stimulation Score: ${show.stimulationScore}/5`)}&url=${encodeURIComponent(shareUrl)}`;
  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  const emailShareUrl = `mailto:?subject=${encodeURIComponent(`Check out ${show.name} on TV Tantrum`)}&body=${encodeURIComponent(`I thought you might be interested in this show: ${show.name} on TV Tantrum. It has a stimulation score of ${show.stimulationScore}/5.\n\nCheck it out here: ${shareUrl}`)}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out ${show.name} on TV Tantrum! Stimulation score: ${show.stimulationScore}/5. ${shareUrl}`)}`;
  
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
  
  // Open social media share in new window
  const openShareWindow = (url: string) => {
    window.open(url, '_blank', 'width=600,height=600');
    
    toast({
      title: "Opening share window",
      description: "Share window opened in a new tab",
    });
  };
  
  // Handle native device sharing
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out ${show.name} on TV Tantrum`,
          text: `Learn about ${show.name} and its stimulation level (${show.stimulationScore}/5) for kids on TV Tantrum!`,
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
        
        {/* Social Media Sharing Buttons */}
        <div className="flex flex-col space-y-4">
          <p className="text-center text-sm font-medium">Share on social media</p>
          <div className="flex justify-center space-x-3">
            <Button 
              variant="outline" 
              size="icon" 
              className="bg-blue-100 hover:bg-blue-200 rounded-full"
              onClick={() => openShareWindow(facebookShareUrl)}
              title="Share on Facebook"
            >
              <Facebook className="h-5 w-5 text-blue-600" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="bg-sky-100 hover:bg-sky-200 rounded-full"
              onClick={() => openShareWindow(twitterShareUrl)}
              title="Share on Twitter"
            >
              <Twitter className="h-5 w-5 text-sky-500" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="bg-blue-100 hover:bg-blue-200 rounded-full"
              onClick={() => openShareWindow(linkedinShareUrl)}
              title="Share on LinkedIn"
            >
              <Linkedin className="h-5 w-5 text-blue-800" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="bg-green-100 hover:bg-green-200 rounded-full"
              onClick={() => openShareWindow(whatsappShareUrl)}
              title="Share on WhatsApp"
            >
              <i className="fab fa-whatsapp text-green-600 text-lg"></i>
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="bg-gray-100 hover:bg-gray-200 rounded-full"
              onClick={() => openShareWindow(emailShareUrl)}
              title="Share via Email"
            >
              <Mail className="h-5 w-5 text-gray-600" />
            </Button>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:space-x-2 mt-2">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
          <Button onClick={handleNativeShare} className="mt-2 sm:mt-0">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}