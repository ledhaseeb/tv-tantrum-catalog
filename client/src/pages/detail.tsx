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

type ShowDetailResponse = TvShow & { 
  reviews: TvShowReview[];
  omdb?: OmdbData | null; 
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
  const { user } = useAuth();
  const { toast } = useToast();
  const [isMobile, setIsMobile] = useState(false);
  
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
        description: "Your review has been added successfully!",
      });
      reviewForm.reset();
      setSelectedRating(5);
      queryClient.invalidateQueries({ queryKey: [`/api/shows/${id}`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add review. Please try again.",
        variant: "destructive",
      });
    },
  });

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
              {showDetail.omdb && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                    <img src="https://m.media-amazon.com/images/G/01/imdb/images/desktop-favicon-2165806970._CB485933742_.ico" 
                         alt="IMDb" 
                         className="w-4 h-4 mr-1" />
                    IMDb Information
                  </h3>
                  <div className="mt-2 space-y-2">
                    {showDetail.omdb.imdbRating !== 'N/A' && (
                      <div>
                        <div className="text-sm font-medium text-gray-600">IMDb Rating:</div>
                        <div className="text-sm flex items-center">
                          <span className="text-yellow-500 mr-1">★</span>
                          {showDetail.omdb.imdbRating}/10
                        </div>
                      </div>
                    )}
                    
                    {showDetail.omdb.rated !== 'N/A' && (
                      <div>
                        <div className="text-sm font-medium text-gray-600">Rated:</div>
                        <div className="text-sm">{showDetail.omdb.rated}</div>
                      </div>
                    )}
                    
                    {showDetail.omdb.runtime !== 'N/A' && (
                      <div>
                        <div className="text-sm font-medium text-gray-600">Runtime:</div>
                        <div className="text-sm">{showDetail.omdb.runtime}</div>
                      </div>
                    )}
                    
                    {showDetail.omdb.totalSeasons !== 'N/A' && (
                      <div>
                        <div className="text-sm font-medium text-gray-600">Seasons:</div>
                        <div className="text-sm">{showDetail.omdb.totalSeasons}</div>
                      </div>
                    )}
                    
                    {showDetail.omdb.language !== 'N/A' && (
                      <div>
                        <div className="text-sm font-medium text-gray-600">Language:</div>
                        <div className="text-sm">{showDetail.omdb.language}</div>
                      </div>
                    )}
                    
                    {showDetail.omdb.country !== 'N/A' && (
                      <div>
                        <div className="text-sm font-medium text-gray-600">Country:</div>
                        <div className="text-sm">{showDetail.omdb.country}</div>
                      </div>
                    )}
                    
                    {showDetail.omdb.director !== 'N/A' && (
                      <div>
                        <div className="text-sm font-medium text-gray-600">Director:</div>
                        <div className="text-sm">{showDetail.omdb.director}</div>
                      </div>
                    )}
                    
                    {showDetail.omdb.writer !== 'N/A' && (
                      <div>
                        <div className="text-sm font-medium text-gray-600">Writer:</div>
                        <div className="text-sm">{showDetail.omdb.writer}</div>
                      </div>
                    )}
                    
                    {showDetail.omdb.awards !== 'N/A' && (
                      <div>
                        <div className="text-sm font-medium text-gray-600">Awards:</div>
                        <div className="text-sm">{showDetail.omdb.awards}</div>
                      </div>
                    )}
                    
                    {showDetail.omdb.imdbId && (
                      <div className="mt-2">
                        <a 
                          href={`https://www.imdb.com/title/${showDetail.omdb.imdbId}`} 
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
              <h1 className="text-3xl font-bold text-teal-700 mb-1">
                {showDetail.name}
                {(showDetail.releaseYear || showDetail.endYear) && 
                  <span className="text-gray-600 font-normal text-xl ml-2">
                    ({showDetail.releaseYear || "Unknown"}-{showDetail.isOngoing ? "present" : (showDetail.endYear || "Unknown")})
                  </span>
                }
              </h1>
              
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
                      <div className="font-medium">{showDetail.sceneFrequency || 'High'}</div>
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
                      <div className="font-medium">{showDetail.totalMusicLevel || 'High'}</div>
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
                    <div className="flex items-center mb-1">
                      <h4 className="font-medium">{review.userName}</h4>
                      <div className="ml-2 flex">
                        {[...Array(5)].map((_, i) => (
                          <i key={i} className={`${i < review.rating ? 'fas' : 'far'} fa-star text-yellow-500`}></i>
                        ))}
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
      console.log("SimilarShows component - Window width:", width, "isMobile:", width < mobileWidth);
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
  
  return (
    <div className="mt-8 bg-white rounded-md shadow p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">You might also like...</h2>
      
      {isMobile ? (
        // Mobile carousel with portrait cards
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
                <CarouselItem key={show.id} className="pl-2 md:pl-4 basis-1/3">
                  <div 
                    className="cursor-pointer relative pb-[150%] overflow-hidden rounded-lg border border-gray-200"
                    onClick={() => {
                      // Scroll to top first, then navigate
                      window.scrollTo(0, 0);
                      setLocation(`/shows/${show.id}`);
                    }}
                  >
                    {show.imageUrl ? (
                      <img 
                        src={show.imageUrl} 
                        alt={show.name} 
                        className="absolute top-0 left-0 w-full h-full object-contain bg-gray-100"
                      />
                    ) : (
                      <div className="absolute top-0 left-0 w-full h-full bg-gray-200 flex items-center justify-center">
                        <i className="fas fa-tv text-gray-400 text-2xl"></i>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-2 text-white">
                      <h3 className="text-sm font-medium truncate">{show.name}</h3>
                      <div className="flex items-center mt-1">
                        <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                          show.stimulationScore <= 2 ? 'bg-green-500' : 
                          show.stimulationScore === 3 ? 'bg-yellow-500' : 
                          'bg-orange-500'
                        }`}></span>
                        <span className="text-xs">
                          {show.stimulationScore <= 2 ? 'Low' : 
                           show.stimulationScore === 3 ? 'Moderate' : 
                           'High'} Stimulation
                        </span>
                      </div>
                    </div>
                  </div>
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
        // Desktop grid layout
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {similarShows.map((show) => (
            <div 
              key={show.id} 
              className="rounded-md border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-200"
              onClick={() => {
                // Scroll to top first, then navigate
                window.scrollTo(0, 0);
                setLocation(`/shows/${show.id}`);
              }}
            >
              {show.imageUrl ? (
                <div className="w-full h-40 bg-gray-100 overflow-hidden">
                  <img 
                    src={show.imageUrl} 
                    alt={show.name} 
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
                  <i className="fas fa-tv text-gray-400 text-2xl"></i>
                </div>
              )}
              <div className="p-3">
                <h3 className="font-medium text-teal-700">{show.name}</h3>
                <p className="text-sm text-gray-600 flex items-center mt-1">
                  <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                    show.stimulationScore <= 2 ? 'bg-green-500' : 
                    show.stimulationScore === 3 ? 'bg-yellow-500' : 
                    'bg-orange-500'
                  }`}></span>
                  Stimulation: {show.stimulationScore}/5
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}