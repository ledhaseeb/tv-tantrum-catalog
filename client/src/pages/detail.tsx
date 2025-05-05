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
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center">
        <Button variant="ghost" className="mr-4 text-primary" onClick={handleBackClick}>
          <i className="fas fa-arrow-left mr-2"></i> Back to Shows
        </Button>
        <h2 className="text-2xl font-heading font-bold">Show Details</h2>
      </div>
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="md:flex">
          <div className="md:flex-shrink-0 md:w-1/3">
            {showDetail.imageUrl ? (
              <img 
                className="h-64 w-full object-cover md:h-full" 
                src={showDetail.imageUrl} 
                alt={showDetail.name}
              />
            ) : (
              <div className="h-64 w-full md:h-full bg-gray-200 flex items-center justify-center">
                <i className="fas fa-tv text-gray-400 text-4xl"></i>
              </div>
            )}
          </div>
          
          <div className="p-6 md:w-2/3">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-heading font-bold text-gray-900">{showDetail.name}</h2>
                <p className="text-gray-600">
                  {showDetail.creator && `Created by ${showDetail.creator}`} 
                  {showDetail.startYear && `(${showDetail.startYear}${showDetail.isOngoing ? "-Present" : showDetail.endYear ? `-${showDetail.endYear}` : ""})`}
                </p>
              </div>
              <div className="flex items-center">
                <Badge variant="outline" className="bg-green-100 text-green-800 text-sm font-medium">
                  Ages {showDetail.ageRange}
                </Badge>
                <div className="ml-4 flex items-center bg-secondary-100 px-3 py-1 rounded-full">
                  <i className="fas fa-star text-secondary-500 mr-1"></i>
                  <span className="font-bold">{showDetail.overallRating}/5</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <p className="text-gray-700">
                {showDetail.description}
              </p>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-heading font-bold text-gray-900">Available On</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {showDetail.availableOn && showDetail.availableOn.length > 0 ? (
                      showDetail.availableOn.map((platform, index) => (
                        <Badge key={index} variant="outline" className="bg-gray-100 text-gray-800 text-sm font-medium">
                          {platform}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-500">No platform information available</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-heading font-bold text-gray-900">Episode Length</h3>
                  <p className="text-gray-700">{showDetail.episodeLength} minutes</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="font-heading font-bold text-gray-900 mb-4">Key Metrics</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-700">Stimulation Score</span>
                    <span className={`font-medium ${showDetail.stimulationScore <= 2 ? 'text-green-600' : showDetail.stimulationScore <= 4 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {showDetail.stimulationScore}/5 ({showDetail.stimulationScore <= 2 ? 'Low' : showDetail.stimulationScore <= 4 ? 'Medium' : 'High'})
                    </span>
                  </div>
                  <RatingBar 
                    value={showDetail.stimulationScore} 
                    max={5} 
                    colorClass={showDetail.stimulationScore <= 2 ? 'green-rating' : showDetail.stimulationScore <= 4 ? 'yellow-rating' : 'red-rating'}
                  />
                  <p className="mt-1 text-sm text-gray-600">
                    {showDetail.stimulationScore <= 2 
                      ? "Low stimulation - calming content with gentle pacing." 
                      : showDetail.stimulationScore <= 4 
                        ? "Medium stimulation - balanced content with moderate energy."
                        : "High stimulation - energetic content that may be overstimulating for some children."}
                  </p>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-700">Interactivity Level</span>
                    <span className="font-medium text-primary-600">
                      {showDetail.interactivityLevel || 'Moderate'}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full purple-rating`} 
                      style={{ 
                        width: `${
                          showDetail.interactivityLevel === 'Low' ? '20%' :
                          showDetail.interactivityLevel === 'Moderate-Low' ? '40%' :
                          showDetail.interactivityLevel === 'Moderate' ? '60%' :
                          showDetail.interactivityLevel === 'Moderate-High' ? '80%' :
                          showDetail.interactivityLevel === 'High' ? '100%' : '60%'
                        }`
                      }}
                    ></div>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {showDetail.interactivityLevel === 'Low'
                      ? "Minimal audience interaction, children mostly observe passively."
                      : showDetail.interactivityLevel === 'Moderate-Low'
                        ? "Some audience engagement, primarily through questions or simple responses."
                        : showDetail.interactivityLevel === 'Moderate'
                          ? "Balanced audience engagement with regular interaction throughout the show."
                          : showDetail.interactivityLevel === 'Moderate-High'
                            ? "Frequent audience engagement with multiple interactive elements."
                            : showDetail.interactivityLevel === 'High'
                              ? "Very interactive format that encourages active participation throughout."
                              : "Moderate level of interactivity."}
                  </p>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-700">Dialogue Intensity</span>
                    <span className="font-medium text-primary-600">
                      {showDetail.dialogueIntensity || 'Moderate'}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full yellow-rating`} 
                      style={{ 
                        width: `${
                          showDetail.dialogueIntensity === 'Low' ? '20%' :
                          showDetail.dialogueIntensity === 'Moderate-Low' ? '40%' :
                          showDetail.dialogueIntensity === 'Moderate' ? '60%' :
                          showDetail.dialogueIntensity === 'Moderate-High' ? '80%' :
                          showDetail.dialogueIntensity === 'High' ? '100%' : '60%'
                        }`
                      }}
                    ></div>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {showDetail.dialogueIntensity === 'Low'
                      ? "Minimal dialogue, relies more on visuals and music."
                      : showDetail.dialogueIntensity === 'Moderate-Low'
                        ? "Simple dialogue with plenty of pauses and visual storytelling."
                        : showDetail.dialogueIntensity === 'Moderate'
                          ? "Balanced dialogue that's appropriate for the target age group."
                          : showDetail.dialogueIntensity === 'Moderate-High'
                            ? "Conversation-heavy with more complex language patterns."
                            : showDetail.dialogueIntensity === 'High'
                              ? "Very dialogue-rich content with complex vocabulary or frequent conversations."
                              : "Moderate level of dialogue."}
                  </p>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-700">Sound Effects Level</span>
                    <span className="font-medium text-primary-600">
                      {showDetail.soundEffectsLevel || 'Moderate'}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full red-rating`} 
                      style={{ 
                        width: `${
                          showDetail.soundEffectsLevel === 'Low' ? '20%' :
                          showDetail.soundEffectsLevel === 'Moderate-Low' ? '40%' :
                          showDetail.soundEffectsLevel === 'Moderate' ? '60%' :
                          showDetail.soundEffectsLevel === 'Moderate-High' ? '80%' :
                          showDetail.soundEffectsLevel === 'High' ? '100%' : '60%'
                        }`
                      }}
                    ></div>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {showDetail.soundEffectsLevel === 'Low'
                      ? "Minimal sound effects, creating a calm viewing experience."
                      : showDetail.soundEffectsLevel === 'Moderate-Low'
                        ? "Gentle sound effects that enhance the content without overwhelming."
                        : showDetail.soundEffectsLevel === 'Moderate'
                          ? "Balanced use of sound effects to support the storytelling."
                          : showDetail.soundEffectsLevel === 'Moderate-High'
                            ? "Frequent sound effects that play a significant role in the experience."
                            : showDetail.soundEffectsLevel === 'High'
                              ? "Sound effect-heavy show with prominent audio elements throughout."
                              : "Moderate level of sound effects."}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-between items-center">
              <div>
                <Button className="bg-primary-600 hover:bg-primary-700" onClick={handleCompareClick}>
                  Add to Comparison
                </Button>
                <Button variant="outline" className="ml-2">
                  <i className="far fa-heart mr-1"></i> Save
                </Button>
              </div>
              
              <div className="flex space-x-1">
                <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full">
                  <i className="fas fa-share-alt"></i>
                </Button>
                <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full">
                  <i className="fas fa-print"></i>
                </Button>
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
    </main>
  );
}
