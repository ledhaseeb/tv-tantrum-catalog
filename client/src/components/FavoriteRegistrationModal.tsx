import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

interface FavoriteRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  showName?: string;
}

export function FavoriteRegistrationModal({ isOpen, onClose, showName }: FavoriteRegistrationModalProps) {
  const [, navigate] = useLocation();

  const handleRegister = () => {
    onClose();
    navigate("/auth");
  };

  const handleMaybeLater = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Save to Favorites</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {showName ? `To save "${showName}" to your favorites, ` : "To save shows to your favorites, "}
            you'll need to create a free account.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          <h4 className="font-medium text-sm">With a free account, you can:</h4>
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm">Save favorites and create watchlists</p>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm">Get personalized recommendations</p>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm">Access research summaries</p>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm">Leave reviews</p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={handleMaybeLater}
            className="w-full sm:w-auto"
          >
            Maybe Later
          </Button>
          <Button 
            onClick={handleRegister}
            className="w-full sm:w-auto"
          >
            Yes, Register for Free
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}