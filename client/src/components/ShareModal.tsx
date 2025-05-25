import { useState, useRef, useEffect } from "react";
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
import { 
  Copy, 
  Share2, 
  Check, 
  Facebook, 
  Twitter, 
  Mail, 
  Linkedin, 
  Instagram, 
  Camera,
  Download,
  Image
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import html2canvas from "html2canvas";

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
  const [imageDownloading, setImageDownloading] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Generate the share URL with referral parameter if user is logged in
  const { user } = useAuth();
  const shareUrl = user 
    ? `${window.location.origin}/share/${show.id}?ref=${user.id}` 
    : `${window.location.origin}/share/${show.id}`;
    
  // Short version of the URL for display in the image
  const shortShareUrl = `tvtantrum.app/s/${show.id}${user ? `?r=${user.id}` : ''}`;
  
  // Social media share URLs
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${show.name} on TV Tantrum! Stimulation Score: ${show.stimulationScore}/5`)}&url=${encodeURIComponent(shareUrl)}`;
  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  const emailShareUrl = `mailto:?subject=${encodeURIComponent(`Check out ${show.name} on TV Tantrum`)}&body=${encodeURIComponent(`I thought you might be interested in this show: ${show.name} on TV Tantrum. It has a stimulation score of ${show.stimulationScore}/5.\n\nCheck it out here: ${shareUrl}`)}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out ${show.name} on TV Tantrum! Stimulation score: ${show.stimulationScore}/5. ${shareUrl}`)}`;
  
  // Additional social platform share URLs
  const instagramShareText = `Check out ${show.name} on TV Tantrum! Stimulation score: ${show.stimulationScore}/5.\n\n${shareUrl}`;
  const snapchatShareUrl = `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(shareUrl)}`;
  const tiktokShareText = `#TVTantrum #KidsShows #${show.name.replace(/\s+/g, '')} ${shareUrl}`;
  
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
  
  // Create and download share card image
  const handleDownloadImage = async () => {
    if (!shareCardRef.current) return;
    
    try {
      setImageDownloading(true);
      
      const canvas = await html2canvas(shareCardRef.current, {
        scale: 2, // Higher resolution
        useCORS: true, // Allow cross-origin images
        backgroundColor: "#ffffff", // White background
        logging: false
      });
      
      // Convert the canvas to a data URL
      const imageData = canvas.toDataURL("image/png");
      
      // Create a link element to download the image
      const link = document.createElement("a");
      link.href = imageData;
      link.download = `${show.name.replace(/\s+/g, '_')}_TVTantrum.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Image downloaded!",
        description: "Share this image on social media with your referral link to earn points!",
      });
    } catch (err) {
      console.error("Image download failed:", err);
      toast({
        title: "Download failed",
        description: "Could not create image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setImageDownloading(false);
    }
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
        
        {/* Shareable image card - This will be captured for sharing */}
        <div 
          ref={shareCardRef} 
          className="border rounded-lg p-5 bg-white mb-4 mt-2"
        >
          <div className="flex flex-col items-center space-y-4">
            <h3 className="text-2xl font-semibold text-center">{show.name}</h3>
            
            {show.imageUrl ? (
              <div>
                <img 
                  src={show.imageUrl} 
                  alt={show.name} 
                  className="w-64 object-contain rounded-md" 
                />
              </div>
            ) : (
              <div className="w-64 h-64 bg-gray-200 flex items-center justify-center rounded-md">
                <i className="fas fa-tv text-gray-400 text-4xl"></i>
              </div>
            )}
            
            <div className="mt-2 w-full flex flex-col items-center">
              <Badge className={`${getStimulationLevelColor(show.stimulationScore)} px-3 py-1 pb-1.5 text-base mx-auto inline-flex items-center justify-center`}>
                {getStimulationLevelName(show.stimulationScore)} Stimulation
              </Badge>
              
              <div className="h-2 w-full max-w-56 bg-gray-200 rounded-full overflow-hidden flex mt-3">
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
            
            <div className="w-full mt-2 mb-2">
              <p className="text-sm text-gray-600 text-center leading-relaxed mx-auto">
                {getStimulationLevelText(show.stimulationScore)}
              </p>
            </div>
            
            <div className="text-xs text-gray-500 font-medium mt-1">
              tvtantrum.com
            </div>
          </div>
        </div>
        
        {/* Download shareable image button */}
        <div className="flex justify-center mb-4">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleDownloadImage}
            disabled={imageDownloading}
          >
            {imageDownloading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Image...
              </span>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download Image for Social Media
              </>
            )}
          </Button>
        </div>
        
        <div className="text-center text-xs text-gray-500 px-2 mb-4">
          Download this image to share on social media. Include your referral link in your post to earn points when others sign up!
        </div>
        
        {/* We've moved the share link input to the instruction section */}
        
        {/* Referral link explanation */}
        <div className="flex flex-col space-y-2 bg-gray-50 p-3 rounded-md">
          <p className="text-center text-sm font-medium">How to share and earn points</p>
          <ol className="text-xs text-gray-600 list-decimal pl-5">
            <li>Download the image above using the download button</li>
            <li>Share the image on your social media accounts</li>
            <li>Copy and include your referral link in your post:</li>
          </ol>
          <div className="flex mt-1 items-center">
            <Input
              value={shareUrl}
              readOnly
              className="text-xs h-8"
            />
            <Button size="sm" className="ml-2 h-8" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <DialogFooter className="flex justify-center mt-2">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}