import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import RatingBar from "@/components/RatingBar";
import { TvShow, TvShowReview } from "@shared/schema";

type ShowDetailResponse = TvShow & { reviews: TvShowReview[] };

export default function Detail() {
  const { id } = useParams<{ id: string }>();
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
                    {showDetail.availableOn.map((platform, index) => (
                      <Badge key={index} variant="outline" className="bg-gray-100 text-gray-800 text-sm font-medium">
                        {platform}
                      </Badge>
                    ))}
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
                    <span className="text-gray-700">Tantrum Factor</span>
                    <span className={`font-medium ${showDetail.tantrumFactor <= 3 ? 'text-green-600' : showDetail.tantrumFactor <= 7 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {showDetail.tantrumFactor}/10 ({showDetail.tantrumFactor <= 3 ? 'Low' : showDetail.tantrumFactor <= 7 ? 'Medium' : 'High'})
                    </span>
                  </div>
                  <RatingBar 
                    value={showDetail.tantrumFactor} 
                    max={10} 
                    colorClass={showDetail.tantrumFactor <= 3 ? 'green-rating' : showDetail.tantrumFactor <= 7 ? 'yellow-rating' : 'red-rating'}
                  />
                  <p className="mt-1 text-sm text-gray-600">
                    {showDetail.tantrumFactor <= 3 
                      ? "Children are unlikely to throw tantrums when this show ends." 
                      : showDetail.tantrumFactor <= 7 
                        ? "May cause some resistance when it's time to turn off the TV."
                        : "High likelihood of meltdowns when the show is over."}
                  </p>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-700">Educational Value</span>
                    <span className={`font-medium ${showDetail.educationalValue >= 8 ? 'text-primary-600' : showDetail.educationalValue >= 5 ? 'text-secondary-600' : 'text-red-600'}`}>
                      {showDetail.educationalValue}/10 ({showDetail.educationalValue >= 8 ? 'High' : showDetail.educationalValue >= 5 ? 'Medium' : 'Low'})
                    </span>
                  </div>
                  <RatingBar 
                    value={showDetail.educationalValue} 
                    max={10} 
                    colorClass={showDetail.educationalValue >= 8 ? 'purple-rating' : showDetail.educationalValue >= 5 ? 'yellow-rating' : 'red-rating'}
                  />
                  <p className="mt-1 text-sm text-gray-600">
                    {showDetail.educationalValue >= 8 
                      ? "Excellent educational content that teaches valuable skills and concepts."
                      : showDetail.educationalValue >= 5 
                        ? "Contains some educational elements mixed with entertainment."
                        : "Primarily entertainment with limited educational content."}
                  </p>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-700">Parent Enjoyment</span>
                    <span className={`font-medium ${showDetail.parentEnjoyment >= 8 ? 'text-primary-600' : showDetail.parentEnjoyment >= 5 ? 'text-secondary-600' : 'text-red-600'}`}>
                      {showDetail.parentEnjoyment}/10 ({showDetail.parentEnjoyment >= 8 ? 'High' : showDetail.parentEnjoyment >= 5 ? 'Medium' : 'Low'})
                    </span>
                  </div>
                  <RatingBar 
                    value={showDetail.parentEnjoyment} 
                    max={10} 
                    colorClass={showDetail.parentEnjoyment >= 8 ? 'purple-rating' : showDetail.parentEnjoyment >= 5 ? 'yellow-rating' : 'red-rating'}
                  />
                  <p className="mt-1 text-sm text-gray-600">
                    {showDetail.parentEnjoyment >= 8 
                      ? "Includes humor and themes that adults can enjoy along with their children."
                      : showDetail.parentEnjoyment >= 5 
                        ? "Moderately entertaining for adults, with some enjoyable elements."
                        : "Parents may find this show difficult to watch repeatedly."}
                  </p>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-700">Repeat Watchability</span>
                    <span className={`font-medium ${showDetail.repeatWatchability >= 8 ? 'text-primary-600' : showDetail.repeatWatchability >= 5 ? 'text-secondary-600' : 'text-red-600'}`}>
                      {showDetail.repeatWatchability}/10 ({showDetail.repeatWatchability >= 8 ? 'High' : showDetail.repeatWatchability >= 5 ? 'Medium' : 'Low'})
                    </span>
                  </div>
                  <RatingBar 
                    value={showDetail.repeatWatchability} 
                    max={10} 
                    colorClass={showDetail.repeatWatchability >= 8 ? 'purple-rating' : showDetail.repeatWatchability >= 5 ? 'yellow-rating' : 'red-rating'}
                  />
                  <p className="mt-1 text-sm text-gray-600">
                    {showDetail.repeatWatchability >= 8 
                      ? "Episodes remain entertaining even after multiple viewings."
                      : showDetail.repeatWatchability >= 5 
                        ? "Can be watched multiple times without significant parent fatigue."
                        : "May become tiresome for parents after repeated viewings."}
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
