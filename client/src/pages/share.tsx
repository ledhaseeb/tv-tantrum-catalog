import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TvShow } from "@shared/schema";
import { Share2, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";

export default function SharePage() {
  const { id } = useParams<{ id: string }>();
  const [_, setLocation] = useLocation();
  const { user } = useAuth();
  const [showId] = useState(parseInt(id || "0"));
  
  // Fetch show details
  const { data: show, isLoading, error } = useQuery<TvShow>({
    queryKey: [`/api/shows/${showId}`],
    enabled: !!showId,
  });

  // Track referral in localStorage if this is the first visit from this share
  useEffect(() => {
    if (show && !localStorage.getItem(`share_visited_${showId}`)) {
      // Mark as visited to prevent duplicate referral tracking
      localStorage.setItem(`share_visited_${showId}`, Date.now().toString());
      
      // Store referral info for registration
      localStorage.setItem('referral_show_id', showId.toString());
      
      // If URL has a referrer param, store it
      const urlParams = new URLSearchParams(window.location.search);
      const referrerId = urlParams.get('ref');
      if (referrerId) {
        localStorage.setItem('referrer_id', referrerId);
      }
    }
  }, [show, showId]);

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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <Skeleton className="h-48 w-full rounded-md" />
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !show) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Show Not Found</h2>
              <p className="text-gray-600 mb-6">
                We couldn't find the show you're looking for. It may have been removed or the link is invalid.
              </p>
              <Button onClick={() => setLocation("/")}>
                Go to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-bold">{show.name}</h2>
              <div className="flex items-center">
                <Share2 className="h-5 w-5 text-blue-500 mr-1" />
                <span className="text-sm text-blue-500">Shared with you</span>
              </div>
            </div>
            
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
            
            <div className="border-t border-gray-200 pt-4 mt-2">
              <h3 className="font-medium text-gray-700 mb-2">About TV Tantrum</h3>
              <p className="text-sm text-gray-600 mb-4">
                TV Tantrum helps parents make informed decisions about children's media with
                research-backed ratings and stimulation scores.
              </p>
              
              {user ? (
                // User is logged in, show view details button
                <div className="space-y-2">
                  <Button 
                    className="w-full" 
                    onClick={() => setLocation(`/shows/${show.id}`)}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Full Details
                  </Button>
                </div>
              ) : (
                // User is not logged in, show sign up and login buttons
                <div className="space-y-2">
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      // Get referrer ID from URL parameters
                      const urlParams = new URLSearchParams(window.location.search);
                      const referrerId = urlParams.get('ref');
                      
                      // Build GHL form URL with referral parameters
                      let ghlFormUrl = "https://www.uschooler.com/widget/form/k1oNtk7bxZaBfdLXDkek";
                      
                      // Add referral parameters as URL parameters that GHL can capture
                      const ghlParams = new URLSearchParams();
                      if (referrerId) {
                        ghlParams.set('referrer_id', referrerId);
                      }
                      ghlParams.set('referred_show_id', showId.toString());
                      
                      if (ghlParams.toString()) {
                        ghlFormUrl += `?${ghlParams.toString()}`;
                      }
                      
                      // Redirect to GHL form
                      window.location.href = ghlFormUrl;
                    }}
                  >
                    Join TV Tantrum for Free
                  </Button>
                  <p className="text-xs text-center text-gray-500 mt-1">
                    Already have an account?{" "}
                    <a 
                      className="text-blue-600 hover:underline" 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        setLocation("/auth?action=login");
                      }}
                    >
                      Log in
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-4 text-center text-xs text-gray-500">
        © 2025 TV Tantrum. All rights reserved.
      </div>
    </div>
  );
}