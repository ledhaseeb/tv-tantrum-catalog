import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import RatingBar from "@/components/RatingBar";
import { TvShow, TvShowReview } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { Heart, Share2 } from "lucide-react";
import ShareModal from "@/components/ShareModal";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import ShowCard from "@/components/ShowCard";
import { Link } from "wouter";

// Define OMDb data type
interface OmdbData {
  runtime: string;
  rated: string;
  totalSeasons: string;
  language: string;
  country: string;
  director: string;
  writer: string;
  imdbRating: string;
  awards: string;
  poster: string;
  imdbId: string;
}

interface YouTubeData {
  title: string;
  description: string;
  subscriberCount: string;
  videoCount: string;
  viewCount: string;
  publishedAt: string;
  thumbnailUrl: string;
  channelId: string;
}

// Enhanced review type with upvotes
interface EnhancedReview extends TvShowReview {
  upvoteCount?: number;
  userHasUpvoted?: boolean;
}

type ShowDetailResponse = TvShow & { 
  reviews: EnhancedReview[];
  omdb?: OmdbData | null;
  youtube?: YouTubeData | null;
  externalData?: {
    omdb?: OmdbData | null;
    youtube?: YouTubeData | null;
  }
};

type DetailProps = {
  id: number;
}

// Review form schema
const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  review: z.string().min(5, "Review must be at least 5 characters").max(1000, "Review must be less than 1000 characters"),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

export default function Detail({ id }: DetailProps) {
  const [_, setLocation] = useLocation();
  const { user, toggleFavorite: toggleFav } = useAuth();
  const { toast } = useToast();
  const [isMobile, setIsMobile] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  
  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      const mobileWidth = 768;
      const width = window.innerWidth;
      setIsMobile(width < mobileWidth);
      console.log("Detail page - Window width:", width, "isMobile:", width < mobileWidth);
    };
    
    // Check on mount
    checkIfMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  // Check if show is in favorites when component mounts or user changes
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (user && id) {
        try {
          const isFav = await fetch(`/api/favorites/${id}`)
            .then(res => res.json())
            .then(data => data.isFavorite);
          setIsFavorite(isFav);
        } catch (error) {
          console.error("Failed to check favorite status:", error);
        }
      }
    };
    
    checkFavoriteStatus();
  }, [user, id]);
  
  const { data: showDetail, isLoading, error } = useQuery<ShowDetailResponse>({
    queryKey: [`/api/shows/${id}`],
  });
  
  // Review form
  const reviewForm = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      review: "",
    },
  });
  
  // Stars selection
  const [selectedRating, setSelectedRating] = useState(5);
  
  // Delete review mutation
  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: number) => {
      return await apiRequest("DELETE", `/api/admin/reviews/${reviewId}`);
    },
    onSuccess: (data) => {
      toast({
        title: "Review deleted",
        description: `Successfully removed review. ${data.pointsDeducted} points have been deducted.`,
        variant: "destructive",
      });
      
      // Refresh show data to update reviews
      queryClient.invalidateQueries({ queryKey: [`/api/shows/${id}`] });
    },
    onError: (error) => {
      console.error("Error deleting review:", error);
      toast({
        title: "Error",
        description: "Failed to delete review. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Handle delete review
  const handleDeleteReview = (reviewId: number) => {
    if (window.confirm("Are you sure you want to delete this review? This will also deduct the points awarded to the user.")) {
      deleteReviewMutation.mutate(reviewId);
    }
  };
  
  // Upvote review mutation with optimistic updates
  const upvoteReviewMutation = useMutation({
    mutationFn: async (reviewId: number) => {
      const response = await apiRequest("POST", `/api/reviews/${reviewId}/upvote`);
      if (!response.ok) {
        throw new Error("Failed to upvote review");
      }
      const data = await response.json();
      return data;
    },
    onMutate: async (reviewId) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: [`/api/shows/${id}`] });
      
      // Snapshot the previous value
      const previousData = queryClient.getQueryData([`/api/shows/${id}`]);
      
      // Optimistically update to the new value
      queryClient.setQueryData([`/api/shows/${id}`], (old: any) => {
        if (!old) return old;
        
        return {
          ...old,
          reviews: old.reviews.map((review: any) => 
            review.id === reviewId
              ? { 
                  ...review, 
                  upvoteCount: (review.upvoteCount || 0) + 1,
                  userHasUpvoted: true
                }
              : review
          )
        };
      });
      
      // Return a context object with the snapshot
      return { previousData };
    },
    onSuccess: (data) => {
      // Only show toast if we actually upvoted (not if it was already upvoted)
      if (!data.already_upvoted) {
        toast({
          title: "Upvoted",
          description: "You've upvoted this review. Thank you for the feedback!",
        });
      }
      
      // Also update the user dashboard to reflect points earned
      queryClient.invalidateQueries({ queryKey: ["/api/user/dashboard"] });
    },
    onError: (error: any, _, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        queryClient.setQueryData([`/api/shows/${id}`], context.previousData);
      }
      
      toast({
        title: "Error",
        description: error?.message || "Failed to upvote review. Please try again.",
        variant: "destructive",
      });
    },
    // Deliberately not refetching after success to preserve optimistic update
  });
  
  // Remove upvote mutation with optimistic updates
  const removeUpvoteMutation = useMutation({
    mutationFn: async (reviewId: number) => {
      const response = await apiRequest("DELETE", `/api/reviews/${reviewId}/upvote`);
      if (!response.ok) {
        throw new Error("Failed to remove upvote");
      }
      const data = await response.json();
      return data;
    },
    onMutate: async (reviewId) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: [`/api/shows/${id}`] });
      
      // Snapshot the previous value
      const previousData = queryClient.getQueryData([`/api/shows/${id}`]);
      
      // Optimistically update to the new value
      queryClient.setQueryData([`/api/shows/${id}`], (old: any) => {
        if (!old) return old;
        
        return {
          ...old,
          reviews: old.reviews.map((review: any) => 
            review.id === reviewId
              ? { 
                  ...review, 
                  upvoteCount: Math.max((review.upvoteCount || 0) - 1, 0),
                  userHasUpvoted: false
                }
              : review
          )
        };
      });
      
      // Return a context object with the snapshot
      return { previousData };
    },
    onSuccess: () => {
      toast({
        title: "Upvote removed",
        description: "Your upvote has been removed.",
      });
      
      // Also update the user dashboard to reflect points changes
      queryClient.invalidateQueries({ queryKey: ["/api/user/dashboard"] });
    },
    onError: (error, _, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        queryClient.setQueryData([`/api/shows/${id}`], context.previousData);
      }
      
      toast({
        title: "Error",
        description: "Failed to remove upvote. Please try again.",
        variant: "destructive",
      });
    },
    // Deliberately not refetching to preserve optimistic update
  });
  
  // Handle toggling upvote status
  const handleToggleUpvote = (reviewId: number, hasUpvoted: boolean) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "You need to be signed in to upvote reviews.",
        variant: "default",
      });
      return;
    }
    
    if (hasUpvoted) {
      removeUpvoteMutation.mutate(reviewId);
    } else {
      upvoteReviewMutation.mutate(reviewId);
    }
  };
  
  // Add review mutation
  const addReviewMutation = useMutation({
    mutationFn: async (data: ReviewFormValues) => {
      return await apiRequest("POST", `/api/shows/${id}/reviews`, {
        ...data,
        userName: user?.username || "Anonymous",
        tvShowId: id,
      });
    },
    onSuccess: () => {
      toast({
        title: "Review added",
        description: "Your review has been added successfully! You earned 5 points for your review.",
      });
      reviewForm.reset();
      setSelectedRating(5);
      
      // Refresh both the show details and the user dashboard
      queryClient.invalidateQueries({ queryKey: [`/api/shows/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/dashboard'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add review. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Toggle favorite function
  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Check if user is logged in
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in or register to save shows to your favorites.",
        variant: "default",
      });
      setLocation("/auth");
      return;
    }
    
    // Use the auth context toggle favorite function
    try {
      await toggleFav(parseInt(id));
      // Update local state (optimistic update)
      setIsFavorite(!isFavorite);
      
      toast({
        title: isFavorite ? "Removed from favorites" : "Added to favorites",
        description: isFavorite 
          ? `${showDetail?.name} has been removed from your favorites.` 
          : `${showDetail?.name} has been added to your favorites.`,
        variant: "default",
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["/api/user/favorites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/dashboard"] });
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      
      // Check if it's an authentication error
      if (error?.message?.includes("401") || error?.message?.includes("Not authenticated") || error?.message?.includes("must be logged in")) {
        toast({
          title: "Authentication required",
          description: "Please log in or register to save shows to your favorites.",
          variant: "default",
        });
        setLocation("/auth");
      } else {
        toast({
          title: "Error",
          description: "Failed to update favorites. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleBackClick = () => {
    setLocation("/");
  };

  const handleCompareClick = () => {
    // Add to comparison and redirect to compare page
    // For now, just navigate to the compare page
    setLocation("/compare");
  };

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center">
          <Button variant="ghost" className="mr-4 text-primary" onClick={handleBackClick}>
            <i className="fas fa-arrow-left mr-2"></i> Back to Shows
          </Button>
          <Skeleton className="h-8 w-56" />
        </div>
        
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="md:flex">
            <div className="md:flex-shrink-0 md:w-1/3">
              <Skeleton className="h-64 w-full md:h-full" />
            </div>
            
            <div className="p-6 md:w-2/3">
              <div className="flex justify-between items-start">
                <div>
                  <Skeleton className="h-8 w-40 mb-2" />
                  <Skeleton className="h-4 w-60" />
                </div>
              </div>
              
              <div className="mt-6">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !showDetail) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center">
          <Button variant="ghost" className="mr-4 text-primary" onClick={handleBackClick}>
            <i className="fas fa-arrow-left mr-2"></i> Back to Shows
          </Button>
          <h2 className="text-2xl font-heading font-bold">Error</h2>
        </div>
        
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>Failed to load show details. Please try again later.</p>
          <Button variant="outline" onClick={handleBackClick} className="mt-2">
            Return to Browse
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50">
      <div className="mb-4 flex items-center">
        <Button variant="ghost" className="text-primary hover:text-primary-700" onClick={handleBackClick}>
          <i className="fas fa-arrow-left mr-2"></i> Back to Catalog
        </Button>
      </div>
      
      <div className="bg-white rounded-md shadow overflow-hidden mb-8">
        <div className="md:flex p-6">
          {/* Left column - Show image and key info */}
          <div className="md:w-1/4 flex-shrink-0 mb-4 md:mb-0 md:mr-6">
            {/* Use OMDb poster if available, otherwise use our image or placeholder */}
            {showDetail.omdb?.poster && showDetail.omdb.poster !== 'N/A' ? (
              <div className="mb-4 rounded border border-gray-200 overflow-hidden" style={{ maxHeight: '400px' }}>
                <img 
                  className="w-full h-full object-contain" 
                  src={showDetail.omdb.poster} 
                  alt={showDetail.name}
                />
              </div>
            ) : showDetail.imageUrl ? (
              <div className="mb-4 rounded border border-gray-200 overflow-hidden" style={{ maxHeight: '400px' }}>
                <img 
                  className="w-full h-full object-contain" 
                  src={showDetail.imageUrl} 
                  alt={showDetail.name}
                />
              </div>
            ) : (
              <div className="w-full h-auto aspect-square mb-4 bg-gray-200 flex items-center justify-center rounded border border-gray-200">
                <i className="fas fa-tv text-gray-400 text-4xl"></i>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Key Information</h3>
                <div className="mt-2 space-y-2">
                  <div>
                    <div className="text-sm font-medium text-gray-600">Target Age Range:</div>
                    <div className="text-sm">{showDetail.ageRange || '10-14'}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-600">Platform(s):</div>
                    <div className="text-sm">{showDetail.availableOn?.join(", ") || 'TV'}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-600">Avg. Episode Length:</div>
                    <div className="text-sm">{showDetail.episodeLength ? `${showDetail.episodeLength} min` : 'Long (20-30m)'}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-600">Seasons:</div>
                    <div className="text-sm">{showDetail.seasons || '4 seasons'}</div>
                  </div>
                </div>
              </div>
              
              {/* IMDb Data Section */}
              {(showDetail.omdb || showDetail.externalData?.omdb) && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                    <img src="https://m.media-amazon.com/images/G/01/imdb/images/desktop-favicon-2165806970._CB485933742_.ico" 
                         alt="IMDb" 
                         className="w-4 h-4 mr-1" />
                    IMDb Information
                  </h3>
                  <div className="mt-2 space-y-2">
                    {/* IMDb Rating */}
                    {showDetail.externalData?.omdb?.imdbRating && (
                      <div>
                        <div className="text-sm font-medium text-gray-600">IMDb Rating:</div>
                        <div className="text-sm flex items-center">
                          <span className="text-yellow-500 mr-1">★</span>
                          {showDetail.externalData.omdb.imdbRating}/10
                        </div>
                      </div>
                    )}
                    
                    {/* Rated */}
                    {showDetail.externalData?.omdb?.rated && (
                      <div>
                        <div className="text-sm font-medium text-gray-600">Rated:</div>
                        <div className="text-sm">
                          {showDetail.externalData.omdb.rated}
                        </div>
                      </div>
                    )}
                    
                    {/* Runtime */}
                    {showDetail.externalData?.omdb?.runtime && (
                      <div>
                        <div className="text-sm font-medium text-gray-600">Runtime:</div>
                        <div className="text-sm">
                          {showDetail.externalData.omdb.runtime}
                        </div>
                      </div>
                    )}
                    
                    {/* Seasons */}
                    {showDetail.externalData?.omdb?.totalSeasons && (
                      <div>
                        <div className="text-sm font-medium text-gray-600">Seasons:</div>
                        <div className="text-sm">
                          {showDetail.externalData.omdb.totalSeasons}
                        </div>
                      </div>
                    )}
                    
                    {/* Language */}
                    {showDetail.externalData?.omdb?.language && (
                      <div>
                        <div className="text-sm font-medium text-gray-600">Language:</div>
                        <div className="text-sm">
                          {showDetail.externalData.omdb.language}
                        </div>
                      </div>
                    )}
                    
                    {/* Country */}
                    {showDetail.externalData?.omdb?.country && (
                      <div>
                        <div className="text-sm font-medium text-gray-600">Country:</div>
                        <div className="text-sm">
                          {showDetail.externalData.omdb.country}
                        </div>
                      </div>
                    )}
                    
                    {/* Writer */}
                    {showDetail.externalData?.omdb?.writer && (
                      <div>
                        <div className="text-sm font-medium text-gray-600">Writer:</div>
                        <div className="text-sm">
                          {showDetail.externalData.omdb.writer}
                        </div>
                      </div>
                    )}
                    
                    {/* Awards */}
                    {showDetail.externalData?.omdb?.awards && (
                      <div>
                        <div className="text-sm font-medium text-gray-600">Awards:</div>
                        <div className="text-sm">
                          {showDetail.externalData.omdb.awards}
                        </div>
                      </div>
                    )}
                    
                    {/* Show IMDb link if ID is available from either source */}
                    {(showDetail.omdb?.imdbId || showDetail.externalData?.omdb?.imdbId) && (
                      <div className="mt-2">
                        <a 
                          href={`https://www.imdb.com/title/${showDetail.omdb?.imdbId || showDetail.externalData?.omdb?.imdbId}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          View on IMDb 
                          <i className="fas fa-external-link-alt ml-1"></i>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* YouTube Data Section */}
              {(showDetail.isYouTubeChannel || showDetail.subscriberCount || 
                showDetail.videoCount || showDetail.externalData?.youtube) && (
                <div className="mt-4 border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                    <i className="fab fa-youtube text-red-600 mr-1"></i>
                    YouTube Channel Information
                  </h3>
                  <div className="mt-2 space-y-2">
                    {/* Subscriber count - from either source */}
                    {(showDetail.subscriberCount || showDetail.externalData?.youtube?.subscriberCount) && (
                      <div>
                        <div className="text-sm font-medium text-gray-600">Subscribers:</div>
                        <div className="text-sm">
                          {parseInt(showDetail.subscriberCount || 
                            showDetail.externalData?.youtube?.subscriberCount || '0').toLocaleString()}
                        </div>
                      </div>
                    )}
                    
                    {/* Video count - from either source */}
                    {(showDetail.videoCount || showDetail.externalData?.youtube?.videoCount) && (
                      <div>
                        <div className="text-sm font-medium text-gray-600">Videos:</div>
                        <div className="text-sm">
                          {parseInt(showDetail.videoCount || 
                            showDetail.externalData?.youtube?.videoCount || '0').toLocaleString()}
                        </div>
                      </div>
                    )}
                    
                    {/* Channel creation date - from either source */}
                    {(showDetail.publishedAt || showDetail.externalData?.youtube?.publishedAt) && (
                      <div>
                        <div className="text-sm font-medium text-gray-600">Channel Since:</div>
                        <div className="text-sm">
                          {new Date(showDetail.publishedAt || 
                            showDetail.externalData?.youtube?.publishedAt || '').toLocaleDateString()}
                        </div>
                      </div>
                    )}
                    
                    {/* Show YouTube link if channel ID is available from either source */}
                    {(showDetail.channelId || showDetail.externalData?.youtube?.channelId) && (
                      <div className="mt-2">
                        <a 
                          href={`https://www.youtube.com/channel/${showDetail.channelId || showDetail.externalData?.youtube?.channelId}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-red-600 hover:text-red-800 flex items-center"
                        >
                          View on YouTube 
                          <i className="fas fa-external-link-alt ml-1"></i>
                        </a>
                      </div>
                    )}
                    
                    {/* Add search link when no direct channel ID is available */}
                    {!showDetail.channelId && !showDetail.externalData?.youtube?.channelId && (
                      <div className="mt-2">
                        <a 
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(showDetail.name)}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-red-600 hover:text-red-800 flex items-center"
                        >
                          Search on YouTube 
                          <i className="fas fa-search ml-1"></i>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Overall Stimulation Score:</h3>
                <div className="flex items-center space-x-2 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const score = i + 1; // 1-5 score range
                    const bgColor = 
                      score === 1 ? 'bg-green-500' : // green for 1
                      score === 2 ? 'bg-yellow-500' : // yellow for 2
                      score === 3 ? 'bg-orange-500' : // orange for 3
                      score === 4 ? 'bg-orange-600' : // redish orange for 4
                      'bg-red-500'; // red for 5
                    
                    const borderColor = 
                      score === 1 ? 'border-green-500' : // green for 1
                      score === 2 ? 'border-yellow-500' : // yellow for 2
                      score === 3 ? 'border-orange-500' : // orange for 3
                      score === 4 ? 'border-orange-600' : // redish orange for 4
                      'border-red-500'; // red for 5
                    
                    return (
                      <div 
                        key={i} 
                        className={`w-4 h-4 rounded-full ${
                          // Active dots show their own color
                          i < showDetail.stimulationScore 
                            ? bgColor 
                            // Inactive dots are outlined with their corresponding color
                            : `border-2 ${borderColor} bg-white`
                        }`} 
                      />
                    );
                  })}
                  <span className="text-sm font-medium">{showDetail.stimulationScore}/5</span>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Themes:</h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {showDetail.themes && showDetail.themes.length > 0 ? (
                    showDetail.themes.map((theme, index) => (
                      <Badge 
                        key={index} 
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-md"
                      >
                        {theme}
                      </Badge>
                    ))
                  ) : (
                    <>
                      <Badge className="px-2 py-1 text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-md">Courage</Badge>
                      <Badge className="px-2 py-1 text-xs bg-purple-100 text-purple-800 hover:bg-purple-200 rounded-md">Creativity & Imagination</Badge>
                      <Badge className="px-2 py-1 text-xs bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-md">Dark Themes</Badge>
                      <Badge className="px-2 py-1 text-xs bg-green-100 text-green-800 hover:bg-green-200 rounded-md">Entertainment</Badge>
                      <Badge className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-200 rounded-md">Humor</Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column - Title and content */}
          <div className="md:w-3/4">
            <div>
              <h1 className="text-3xl font-bold text-teal-700 mb-2">
                {showDetail.name}
                {(showDetail.releaseYear || showDetail.endYear) && 
                  <span className="text-gray-600 font-normal text-xl ml-2">
                    ({showDetail.releaseYear || "Unknown"}-{showDetail.isOngoing ? "present" : (showDetail.endYear || "Unknown")})
                  </span>
                }
              </h1>
              <div className="mb-4 flex space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={`px-2 py-1 ${isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                  onClick={(e) => toggleFavorite(e)}
                >
                  <Heart className={`w-5 h-5 mr-1 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                  {isFavorite ? 'Saved' : 'Add to Favorites'}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-2 py-1 text-blue-500"
                  onClick={() => setShareModalOpen(true)}
                >
                  <Share2 className="w-5 h-5 mr-1" />
                  Share
                </Button>
              </div>
              
              {/* Sensory Details Section */}
              <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">Sensory Details</h2>
                
                <div className="space-y-5">
                  {/* Dialogue Intensity Bar */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <div className="text-gray-600">Dialogue Intensity:</div>
                      <div className="font-medium">{showDetail.dialogueIntensity || 'Moderate'}</div>
                    </div>
                    <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden flex">
                      {[1, 2, 3, 4, 5].map((segment) => {
                        let level = 3; // Default level
                        
                        // Handle all possible rating values from the spreadsheet
                        if (showDetail.dialogueIntensity) {
                          if (showDetail.dialogueIntensity.includes('Low-Moderate') || 
                              showDetail.dialogueIntensity.includes('Low to Moderate')) {
                            level = 2;
                          } else if (showDetail.dialogueIntensity.includes('Moderate-Low')) {
                            level = 2;
                          } else if (showDetail.dialogueIntensity.includes('Moderate-High') || 
                                    showDetail.dialogueIntensity.includes('Moderate to High')) {
                            level = 4;
                          } else if (showDetail.dialogueIntensity.includes('Mod-High')) {
                            level = 4;
                          } else if (showDetail.dialogueIntensity === 'Low') {
                            level = 1;
                          } else if (showDetail.dialogueIntensity === 'Moderate') {
                            level = 3;
                          } else if (showDetail.dialogueIntensity === 'High') {
                            level = 5;
                          }
                        }
                          
                        const color = 
                          segment === 1 ? 'bg-green-500' : 
                          segment === 2 ? 'bg-yellow-500' : 
                          segment === 3 ? 'bg-orange-500' : 
                          segment === 4 ? 'bg-orange-600' : 
                          'bg-red-500';
                        
                        return (
                          <div
                            key={segment}
                            className={`h-full w-1/5 ${segment <= level ? color : 'bg-gray-200'}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Scene Frequency Bar */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <div className="text-gray-600">Scene Frequency:</div>
                      <div className="font-medium">{showDetail.sceneFrequency || 'Moderate'}</div>
                    </div>
                    <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden flex">
                      {[1, 2, 3, 4, 5].map((segment) => {
                        let level = 3; // Default to moderate
                        
                        // Handle all possible rating values from the spreadsheet
                        if (showDetail.sceneFrequency) {
                          if (showDetail.sceneFrequency.includes('Low-Moderate') || 
                              showDetail.sceneFrequency.includes('Low to Moderate')) {
                            level = 2;
                          } else if (showDetail.sceneFrequency.includes('Moderate-Low')) {
                            level = 2;
                          } else if (showDetail.sceneFrequency.includes('Moderate-High') || 
                                     showDetail.sceneFrequency.includes('Moderate to High')) {
                            level = 4;
                          } else if (showDetail.sceneFrequency.includes('Mod-High')) {
                            level = 4;
                          } else if (showDetail.sceneFrequency === 'Low') {
                            level = 1;
                          } else if (showDetail.sceneFrequency === 'Moderate') {
                            level = 3;
                          } else if (showDetail.sceneFrequency === 'High') {
                            level = 5;
                          } else if (showDetail.sceneFrequency === 'Limited') {
                            level = 1;
                          } else if (showDetail.sceneFrequency === 'Minimal') {
                            level = 1;
                          }
                        }
                          
                        const color = 
                          segment === 1 ? 'bg-green-500' : 
                          segment === 2 ? 'bg-yellow-500' : 
                          segment === 3 ? 'bg-orange-500' : 
                          segment === 4 ? 'bg-orange-600' : 
                          'bg-red-500';
                        
                        return (
                          <div
                            key={segment}
                            className={`h-full w-1/5 ${segment <= level ? color : 'bg-gray-200'}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Sound Effects Level Bar */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <div className="text-gray-600">Sound Effects Level:</div>
                      <div className="font-medium">{showDetail.soundEffectsLevel || 'Moderate'}</div>
                    </div>
                    <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden flex">
                      {[1, 2, 3, 4, 5].map((segment) => {
                        let level = 3; // Default to moderate
                        
                        // Handle all possible rating values from the spreadsheet
                        if (showDetail.soundEffectsLevel) {
                          if (showDetail.soundEffectsLevel.includes('Low-Moderate') || 
                              showDetail.soundEffectsLevel.includes('Low to Moderate')) {
                            level = 2;
                          } else if (showDetail.soundEffectsLevel.includes('Moderate-Low')) {
                            level = 2;
                          } else if (showDetail.soundEffectsLevel.includes('Moderate-High') || 
                                     showDetail.soundEffectsLevel.includes('Moderate to High')) {
                            level = 4;
                          } else if (showDetail.soundEffectsLevel.includes('Mod-High')) {
                            level = 4;
                          } else if (showDetail.soundEffectsLevel === 'Low') {
                            level = 1;
                          } else if (showDetail.soundEffectsLevel === 'Moderate') {
                            level = 3;
                          } else if (showDetail.soundEffectsLevel === 'High') {
                            level = 5;
                          } else if (showDetail.soundEffectsLevel === 'Limited') {
                            level = 1;
                          } else if (showDetail.soundEffectsLevel === 'Minimal') {
                            level = 1;
                          }
                        }
                          
                        const color = 
                          segment === 1 ? 'bg-green-500' : 
                          segment === 2 ? 'bg-yellow-500' : 
                          segment === 3 ? 'bg-orange-500' : 
                          segment === 4 ? 'bg-orange-600' : 
                          'bg-red-500';
                        
                        return (
                          <div
                            key={segment}
                            className={`h-full w-1/5 ${segment <= level ? color : 'bg-gray-200'}`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Total Sound Effect Time Level Bar */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <div className="text-gray-600">Total Sound Effect Time:</div>
                      <div className="font-medium">{showDetail.totalSoundEffectTimeLevel || 'Moderate'}</div>
                    </div>
                    <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden flex">
                      {[1, 2, 3, 4, 5].map((segment) => {
                        let level = 3; // Default to moderate
                        
                        // Handle all possible rating values from the spreadsheet
                        if (showDetail.totalSoundEffectTimeLevel) {
                          if (showDetail.totalSoundEffectTimeLevel.includes('Low-Moderate') || 
                              showDetail.totalSoundEffectTimeLevel.includes('Low to Moderate')) {
                            level = 2;
                          } else if (showDetail.totalSoundEffectTimeLevel.includes('Moderate-Low')) {
                            level = 2;
                          } else if (showDetail.totalSoundEffectTimeLevel.includes('Moderate-High') || 
                                     showDetail.totalSoundEffectTimeLevel.includes('Moderate to High')) {
                            level = 4;
                          } else if (showDetail.totalSoundEffectTimeLevel.includes('Mod-High')) {
                            level = 4;
                          } else if (showDetail.totalSoundEffectTimeLevel === 'Low') {
                            level = 1;
                          } else if (showDetail.totalSoundEffectTimeLevel === 'Moderate') {
                            level = 3;
                          } else if (showDetail.totalSoundEffectTimeLevel === 'High') {
                            level = 5;
                          } else if (showDetail.totalSoundEffectTimeLevel === 'Limited') {
                            level = 1;
                          } else if (showDetail.totalSoundEffectTimeLevel === 'Minimal') {
                            level = 1;
                          }
                        }
                          
                        const color = 
                          segment === 1 ? 'bg-green-500' : 
                          segment === 2 ? 'bg-yellow-500' : 
                          segment === 3 ? 'bg-orange-500' : 
                          segment === 4 ? 'bg-orange-600' : 
                          'bg-red-500';
                        
                        return (
                          <div
                            key={segment}
                            className={`h-full w-1/5 ${segment <= level ? color : 'bg-gray-200'}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Music Tempo Bar */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <div className="text-gray-600">Music Tempo:</div>
                      <div className="font-medium">{showDetail.musicTempo || 'Varies'}</div>
                    </div>
                    {showDetail.musicTempo === 'Varies' ? (
                      <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
                          style={{ width: '100%' }}
                        ></div>
                      </div>
                    ) : (
                      <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden flex">
                        {[1, 2, 3, 4, 5].map((segment) => {
                          let level = 3; // Default to moderate
                        
                          // Handle all possible rating values from the spreadsheet
                          if (showDetail.musicTempo) {
                            if (showDetail.musicTempo.includes('Low-Moderate') || 
                                showDetail.musicTempo.includes('Low to Moderate')) {
                              level = 2;
                            } else if (showDetail.musicTempo.includes('Moderate-Low')) {
                              level = 2;
                            } else if (showDetail.musicTempo.includes('Moderate-High') || 
                                       showDetail.musicTempo.includes('Moderate to High')) {
                              level = 4;
                            } else if (showDetail.musicTempo.includes('Mod-High')) {
                              level = 4;
                            } else if (showDetail.musicTempo === 'Low') {
                              level = 1;
                            } else if (showDetail.musicTempo === 'Moderate') {
                              level = 3;
                            } else if (showDetail.musicTempo === 'High') {
                              level = 5;
                            } else if (showDetail.musicTempo === 'Limited') {
                              level = 1;
                            } else if (showDetail.musicTempo === 'Minimal') {
                              level = 1;
                            }
                          }
                            
                          const color = 
                            segment === 1 ? 'bg-green-500' : 
                            segment === 2 ? 'bg-yellow-500' : 
                            segment === 3 ? 'bg-orange-500' : 
                            segment === 4 ? 'bg-orange-600' : 
                            'bg-red-500';
                          
                          return (
                            <div
                              key={segment}
                              className={`h-full w-1/5 ${segment <= level ? color : 'bg-gray-200'}`}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  {/* Total Music Level Bar */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <div className="text-gray-600">Total Music Level:</div>
                      <div className="font-medium">{showDetail.totalMusicLevel || 'Moderate'}</div>
                    </div>
                    <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden flex">
                      {[1, 2, 3, 4, 5].map((segment) => {
                        let level = 3; // Default to moderate
                        
                        // Handle all possible rating values from the spreadsheet
                        if (showDetail.totalMusicLevel) {
                          if (showDetail.totalMusicLevel.includes('Low-Moderate') || 
                              showDetail.totalMusicLevel.includes('Low to Moderate')) {
                            level = 2;
                          } else if (showDetail.totalMusicLevel.includes('Moderate-Low')) {
                            level = 2;
                          } else if (showDetail.totalMusicLevel.includes('Moderate-High') || 
                                     showDetail.totalMusicLevel.includes('Moderate to High')) {
                            level = 4;
                          } else if (showDetail.totalMusicLevel.includes('Mod-High')) {
                            level = 4;
                          } else if (showDetail.totalMusicLevel === 'Low') {
                            level = 1;
                          } else if (showDetail.totalMusicLevel === 'Moderate') {
                            level = 3;
                          } else if (showDetail.totalMusicLevel === 'High') {
                            level = 5;
                          } else if (showDetail.totalMusicLevel === 'Limited') {
                            level = 1;
                          } else if (showDetail.totalMusicLevel === 'Minimal') {
                            level = 1;
                          }
                        }
                          
                        const color = 
                          segment === 1 ? 'bg-green-500' : 
                          segment === 2 ? 'bg-yellow-500' : 
                          segment === 3 ? 'bg-orange-500' : 
                          segment === 4 ? 'bg-orange-600' : 
                          'bg-red-500';
                        
                        return (
                          <div
                            key={segment}
                            className={`h-full w-1/5 ${segment <= level ? color : 'bg-gray-200'}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Interaction Level Bar */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <div className="text-gray-600">Interaction Level:</div>
                      <div className="font-medium">{showDetail.interactivityLevel || 'Moderate'}</div>
                    </div>
                    <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden flex">
                      {[1, 2, 3, 4, 5].map((segment) => {
                        let level = 3; // Default to moderate
                        
                        // Handle all possible rating values from the spreadsheet
                        if (showDetail.interactivityLevel) {
                          if (showDetail.interactivityLevel.includes('Low-Moderate') || 
                              showDetail.interactivityLevel.includes('Low to Moderate')) {
                            level = 2;
                          } else if (showDetail.interactivityLevel.includes('Moderate-Low')) {
                            level = 2;
                          } else if (showDetail.interactivityLevel.includes('Moderate-High') || 
                                    showDetail.interactivityLevel.includes('Moderate to High')) {
                            level = 4;
                          } else if (showDetail.interactivityLevel.includes('Mod-High')) {
                            level = 4;
                          } else if (showDetail.interactivityLevel === 'Low') {
                            level = 1;
                          } else if (showDetail.interactivityLevel === 'Moderate') {
                            level = 3;
                          } else if (showDetail.interactivityLevel === 'High') {
                            level = 5;
                          } else if (showDetail.interactivityLevel === 'Limited') {
                            level = 1;
                          } else if (showDetail.interactivityLevel === 'Minimal') {
                            level = 1;
                          }
                        }
                          
                        const color = 
                          segment === 1 ? 'bg-green-500' : 
                          segment === 2 ? 'bg-yellow-500' : 
                          segment === 3 ? 'bg-orange-500' : 
                          segment === 4 ? 'bg-orange-600' : 
                          'bg-red-500';
                        
                        return (
                          <div
                            key={segment}
                            className={`h-full w-1/5 ${segment <= level ? color : 'bg-gray-200'}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Animation Style */}
                  <div className="grid grid-cols-1">
                    <div className="text-gray-600 mb-1">Animation Style:</div>
                    <div className="font-medium">
                      {showDetail.animationStyle || 'Traditional 2D Animation with surreal and sometimes dark visuals. Color Palette: Varied colors with contrasting dark and bright tones.'}
                    </div>
                  </div>
                </div>
              </div>
              

            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 p-6">
          <h3 className="font-heading font-bold text-gray-900 mb-4">Parent Reviews</h3>
          
          {/* Add review form - only shown to logged-in users */}
          {user ? (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h4 className="font-medium text-gray-800 mb-4">Share Your Experience</h4>
              <Form {...reviewForm}>
                <form onSubmit={reviewForm.handleSubmit((data) => addReviewMutation.mutate(data))} className="space-y-4">
                  {/* Rating stars */}
                  <div>
                    <FormLabel>Rating</FormLabel>
                    <div className="flex items-center gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            setSelectedRating(value);
                            reviewForm.setValue('rating', value);
                          }}
                          className="text-2xl focus:outline-none"
                        >
                          {value <= selectedRating ? (
                            <i className="fas fa-star text-yellow-500"></i>
                          ) : (
                            <i className="far fa-star text-gray-400"></i>
                          )}
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-gray-500">
                        {selectedRating} out of 5 stars
                      </span>
                    </div>
                    {reviewForm.formState.errors.rating && (
                      <p className="text-red-500 text-sm mt-1">{reviewForm.formState.errors.rating.message}</p>
                    )}
                  </div>
                  
                  {/* Review text */}
                  <FormField
                    control={reviewForm.control}
                    name="review"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Review</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Share your thoughts about this show..." 
                            {...field} 
                            className="h-24"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    disabled={addReviewMutation.isPending}
                    className="bg-primary text-white hover:bg-primary-600"
                  >
                    {addReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                  </Button>
                </form>
              </Form>
            </div>
          ) : (
            <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
              <p className="text-blue-800">
                <Link href={`/auth?redirect=/detail/${id}`} className="font-medium underline">
                  Sign in or register
                </Link> to leave a review and help other parents choose appropriate shows for their children.
              </p>
            </div>
          )}
          
          {/* Existing reviews section */}
          {showDetail.reviews && showDetail.reviews.length > 0 ? (
            <div className="space-y-4">
              {showDetail.reviews.map((review, index) => (
                <div key={index} className="flex p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                  <div className="flex-shrink-0 mr-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="font-medium text-primary-600">
                        {review.userName.split(' ').map(name => name[0]).join('')}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center">
                        <h4 className="font-medium">{review.userName}</h4>
                        <div className="ml-2 flex">
                          {[...Array(5)].map((_, i) => (
                            <i key={i} className={`${i < review.rating ? 'fas' : 'far'} fa-star text-yellow-500`}></i>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Only show upvote button if user is logged in and not the review author */}
                        {user && user.id !== review.userId && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className={`${review.userHasUpvoted ? 'text-blue-600' : 'text-gray-500'} hover:text-blue-700 hover:bg-blue-50`}
                            onClick={() => handleToggleUpvote(review.id, review.userHasUpvoted)}
                          >
                            <i className={`${review.userHasUpvoted ? 'fas' : 'far'} fa-thumbs-up mr-1`}></i>
                            {review.upvoteCount || 0}
                          </Button>
                        )}
                        
                        {/* If user is the review author, show upvote count without button */}
                        {user && user.id === review.userId && review.upvoteCount > 0 && (
                          <div className="text-gray-500 text-sm flex items-center">
                            <i className="fas fa-thumbs-up mr-1 text-blue-400"></i>
                            {review.upvoteCount}
                          </div>
                        )}
                        
                        {/* Admin delete button */}
                        {user?.isAdmin && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteReview(review.id)}
                          >
                            <i className="fas fa-trash-alt mr-1"></i>
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-700">{review.review}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500 italic">No reviews yet. Be the first to share your thoughts!</p>
            </div>
          )}
          
          {showDetail.reviews && showDetail.reviews.length > 3 && (
            <Button variant="link" className="mt-4 text-primary-600 hover:text-primary-800">
              Show more reviews
            </Button>
          )}
        </div>
      </div>
      
      {/* Similar Shows Section */}
      <SimilarShows showId={id} />
      
      <div className="text-center text-xs text-gray-500 mt-8">
        © 2025 Sensory Screen Time Guide. All rights reserved.
      </div>
      
      {/* Share Modal */}
      {showDetail && (
        <ShareModal
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          show={{
            id: showDetail.id,
            name: showDetail.name,
            imageUrl: showDetail.imageUrl || showDetail.omdb?.poster,
            stimulationScore: showDetail.stimulationScore || 3,
          }}
        />
      )}
    </main>
  );
}

// Similar Shows Component
function SimilarShows({ showId }: { showId: number }) {
  const { data: similarShows, isLoading, error } = useQuery<TvShow[]>({
    queryKey: [`/api/shows/${showId}/similar`],
    enabled: !!showId,
    refetchOnWindowFocus: false
  });
  
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      const mobileWidth = 768;
      const width = window.innerWidth;
      setIsMobile(width < mobileWidth);
    };
    
    // Check on mount
    checkIfMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  const [_, setLocation] = useLocation();
  
  if (isLoading) {
    return (
      <div className="mt-8 bg-white rounded-md shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">You might also like...</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-md border border-gray-200 overflow-hidden">
              <Skeleton className="w-full h-40" />
              <div className="p-3">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    console.error("Error loading similar shows:", error);
    return null;
  }
  
  if (!similarShows || similarShows.length === 0) {
    console.log("No similar shows found or data empty");
    // Show empty state instead of hiding completely
    return (
      <div className="mt-8 bg-white rounded-md shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">You might also like...</h2>
        <p className="text-center py-4 text-gray-500">No similar shows found for this title.</p>
      </div>
    );
  }
  
  // Handle navigation to show detail
  const navigateToShow = (showId: number) => {
    window.scrollTo(0, 0);
    setLocation(`/shows/${showId}`);
  };
  
  return (
    <div className="mt-8 bg-white rounded-md shadow p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">You might also like...</h2>
      
      {isMobile ? (
        // Mobile carousel with portrait cards using ShowCard component
        <div className="relative">
          <Carousel
            opts={{
              align: "start",
              loop: true,
              dragFree: true,
              containScroll: "trimSnaps"
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {similarShows.map((show) => (
                <CarouselItem key={show.id} className="pl-2 md:pl-4 basis-1/2">
                  <ShowCard 
                    show={show} 
                    viewMode="grid" 
                    isMobile={true}
                    onClick={() => navigateToShow(show.id)} 
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-center gap-2 mt-4">
              <CarouselPrevious className="static translate-y-0 mr-0" />
              <CarouselNext className="static translate-y-0" />
            </div>
          </Carousel>
        </div>
      ) : (
        // Desktop grid layout using the same ShowCard component as the browse page
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {similarShows.map((show) => (
            <ShowCard 
              key={show.id}
              show={show} 
              viewMode="grid" 
              onClick={() => navigateToShow(show.id)} 
            />
          ))}
        </div>
      )}
    </div>
  );
}