import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Share2, Copy, Check, Facebook, Twitter, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareButtonProps {
  title: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  type?: 'show' | 'category' | 'site';
}

export function ShareButton({ title, description, url, imageUrl, type = 'show' }: ShareButtonProps) {
  const [showEmbedDialog, setShowEmbedDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const shareUrl = url || window.location.href;
  const shareTitle = `${title} - TV Tantrum`;
  const shareDescription = description || `Discover ${title} on TV Tantrum - helping parents find appropriate children's content with detailed stimulation ratings and sensory information.`;

  const copyToClipboard = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: message,
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const shareToSocial = (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(shareTitle);
    const encodedDescription = encodeURIComponent(shareDescription);

    let shareLink = '';
    
    switch (platform) {
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}&hashtags=TVTantrum,ChildrensTV,ParentingTips`;
        break;
      case 'whatsapp':
        shareLink = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
        break;
      case 'email':
        shareLink = `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`;
        break;
    }

    if (shareLink) {
      window.open(shareLink, '_blank', 'width=600,height=400');
    }
  };

  const generateEmbedCode = () => {
    if (type === 'show') {
      return `<iframe src="${shareUrl}?embed=true" width="400" height="600" frameborder="0"></iframe>`;
    } else if (type === 'category') {
      return `<iframe src="${shareUrl}?embed=true" width="800" height="400" frameborder="0"></iframe>`;
    }
    return `<iframe src="${shareUrl}" width="800" height="600" frameborder="0"></iframe>`;
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => copyToClipboard(shareUrl, "Link copied to clipboard")}>
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            Copy Link
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => shareToSocial('facebook')}>
            <Facebook className="w-4 h-4 mr-2" />
            Share on Facebook
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => shareToSocial('twitter')}>
            <Twitter className="w-4 h-4 mr-2" />
            Share on Twitter
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => shareToSocial('whatsapp')}>
            <MessageCircle className="w-4 h-4 mr-2" />
            Share on WhatsApp
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => shareToSocial('email')}>
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            Share via Email
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setShowEmbedDialog(true)}>
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Get Embed Code
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showEmbedDialog} onOpenChange={setShowEmbedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Embed {type === 'show' ? 'Show' : type === 'category' ? 'Category' : 'Content'}</DialogTitle>
            <DialogDescription>
              Copy this code to embed {title} on your website or blog.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Embed Code:</label>
              <div className="mt-2 p-3 bg-gray-100 rounded border font-mono text-sm break-all">
                {generateEmbedCode()}
              </div>
            </div>
            <Button 
              onClick={() => copyToClipboard(generateEmbedCode(), "Embed code copied to clipboard")}
              className="w-full"
            >
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              Copy Embed Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}