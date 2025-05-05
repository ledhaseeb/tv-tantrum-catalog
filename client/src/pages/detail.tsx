import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import RatingBar from "@/components/RatingBar";
import { TvShow, TvShowReview } from "@shared/schema";

type ShowDetailResponse = TvShow & { reviews: TvShowReview[] };

type DetailProps = {
  id: number;
}

export default function Detail({ id }: DetailProps) {
  const [_, setLocation] = useLocation();
  
  const { data: showDetail, isLoading, error } = useQuery<ShowDetailResponse>({
    queryKey: [`/api/shows/${id}`],
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
            {showDetail.imageUrl ? (
              <img 
                className="w-full h-auto mb-4 rounded border border-gray-200" 
                src={showDetail.imageUrl} 
                alt={showDetail.name}
              />
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
              
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Overall Stimulation Score:</h3>
                <div className="flex items-center space-x-2 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-4 h-4 rounded-full ${i < showDetail.stimulationScore ? 'bg-red-500' : 'bg-gray-200'}`} 
                    />
                  ))}
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
                    ({showDetail.releaseYear || "1999"}-{showDetail.endYear || "2002"})
                  </span>
                }
              </h1>
              
              {/* Sensory Details Section */}
              <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">Sensory Details</h2>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2">
                    <div className="text-gray-600">Dialogue Intensity:</div>
                    <div className="font-medium">
                      {showDetail.dialogueIntensity || 'Moderate'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2">
                    <div className="text-gray-600">Scene Frequency:</div>
                    <div className="font-medium">
                      {showDetail.sceneFrequency || 'High'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2">
                    <div className="text-gray-600">Sound Effects Level:</div>
                    <div className="font-medium">
                      {showDetail.soundEffectsLevel || 'High'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2">
                    <div className="text-gray-600">Music Tempo:</div>
                    <div className="font-medium">
                      {showDetail.musicTempo || 'Varies'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2">
                    <div className="text-gray-600">Total Music Level:</div>
                    <div className="font-medium">
                      {showDetail.totalMusicLevel || 'High'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2">
                    <div className="text-gray-600">Interaction Level:</div>
                    <div className="font-medium">
                      {showDetail.interactivityLevel || 'Limited direct interaction, perhaps some songs or simple call-outs.'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2">
                    <div className="text-gray-600">Animation Style:</div>
                    <div className="font-medium">
                      {showDetail.animationStyle || 'Traditional 2D Animation with surreal and sometimes dark visuals. Color Palette: Varied colors with contrasting dark and bright tones.'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Visual Breakdown Section */}
              <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">Visual Breakdown</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left chart - Factor Contribution */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Factor Contribution</h3>
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="w-full h-52 flex items-center justify-center">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ddd" strokeWidth="20" />
                          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#38bdf8" strokeWidth="20" strokeDasharray="251" strokeDashoffset="188" />
                          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#fb7185" strokeWidth="20" strokeDasharray="251" strokeDashoffset="126" transform="rotate(90 50 50)" />
                          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#fb923c" strokeWidth="20" strokeDasharray="251" strokeDashoffset="172" transform="rotate(180 50 50)" />
                          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#4ade80" strokeWidth="20" strokeDasharray="251" strokeDashoffset="189" transform="rotate(270 50 50)" />
                        </svg>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-blue-400 rounded-full mr-1"></div>
                          <span className="text-xs">Dialogue</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-red-400 rounded-full mr-1"></div>
                          <span className="text-xs">Scene Pace</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-orange-400 rounded-full mr-1"></div>
                          <span className="text-xs">Sound FX</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-400 rounded-full mr-1"></div>
                          <span className="text-xs">Music</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right chart - Factor Scores */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Factor Scores (0-5)</h3>
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="w-full h-52 flex flex-col justify-between">
                        <div className="flex items-end h-full space-x-8">
                          <div className="flex flex-col items-center w-1/4">
                            <div className="bg-blue-400 w-full" style={{ height: '60%' }}></div>
                            <span className="text-xs mt-1">Dialogue</span>
                          </div>
                          <div className="flex flex-col items-center w-1/4">
                            <div className="bg-red-400 w-full" style={{ height: '100%' }}></div>
                            <span className="text-xs mt-1">Scene Pace</span>
                          </div>
                          <div className="flex flex-col items-center w-1/4">
                            <div className="bg-orange-400 w-full" style={{ height: '90%' }}></div>
                            <span className="text-xs mt-1">Sound FX</span>
                          </div>
                          <div className="flex flex-col items-center w-1/4">
                            <div className="bg-green-400 w-full" style={{ height: '80%' }}></div>
                            <span className="text-xs mt-1">Music</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-6 w-full">
                          <div className="text-xs text-center">0</div>
                          <div className="text-xs text-center">1</div>
                          <div className="text-xs text-center">2</div>
                          <div className="text-xs text-center">3</div>
                          <div className="text-xs text-center">4</div>
                          <div className="text-xs text-center">5</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 p-6">
          <h3 className="font-heading font-bold text-gray-900 mb-4">Parent Reviews</h3>
          
          {showDetail.reviews && showDetail.reviews.length > 0 ? (
            <div className="space-y-4">
              {showDetail.reviews.map((review, index) => (
                <div key={index} className="flex">
                  <div className="flex-shrink-0 mr-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="font-medium text-primary-600">
                        {review.userName.split(' ').map(name => name[0]).join('')}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center mb-1">
                      <h4 className="font-medium">{review.userName}</h4>
                      <div className="ml-2 flex">
                        {[...Array(5)].map((_, i) => (
                          <i key={i} className={`${i < review.rating ? 'fas' : 'far'} fa-star text-secondary-500`}></i>
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-700">{review.review}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No reviews yet. Be the first to share your thoughts!</p>
          )}
          
          {showDetail.reviews && showDetail.reviews.length > 3 && (
            <Button variant="link" className="mt-4 text-primary-600 hover:text-primary-800">
              Show more reviews
            </Button>
          )}
        </div>
      </div>
      
      <div className="text-center text-xs text-gray-500 mt-8">
        © 2025 Sensory Screen Time Guide. All rights reserved.
      </div>
    </main>
  );
}