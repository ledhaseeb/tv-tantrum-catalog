import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import RatingBar from "@/components/RatingBar";
import { TvShow } from "@shared/schema";

interface ShowCardProps {
  show: TvShow;
  viewMode: "grid" | "list";
  onClick: () => void;
}

export default function ShowCard({ show, viewMode, onClick }: ShowCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  
  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };
  
  if (viewMode === "list") {
    return (
      <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer" onClick={onClick}>
        <div className="flex">
          <div className="flex-shrink-0 w-32 sm:w-48">
            {show.imageUrl ? (
              <img 
                className="h-full w-full object-cover"
                src={show.imageUrl}
                alt={show.name}
              />
            ) : (
              <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                <i className="fas fa-tv text-gray-400 text-2xl"></i>
              </div>
            )}
          </div>
          
          <CardContent className="p-4 w-full">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-heading font-bold mb-1">{show.name}</h3>
                <Badge variant="outline" className="bg-green-100 text-green-800 text-xs font-medium mb-2">
                  Ages {show.ageRange}
                </Badge>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                  {show.description}
                </p>
              </div>
              
              <div className="flex items-center bg-white bg-opacity-90 px-2 py-1 rounded-full shadow-sm">
                <i className="fas fa-star text-secondary-500 mr-1"></i>
                <span className="font-bold text-sm">{show.overallRating}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Tantrum Factor</span>
                  <span className="ml-2 text-sm font-medium">{show.tantrumFactor}/10</span>
                </div>
                <RatingBar 
                  value={show.tantrumFactor} 
                  max={10}
                  colorClass={show.tantrumFactor <= 3 ? 'green-rating' : show.tantrumFactor <= 7 ? 'yellow-rating' : 'red-rating'}
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Educational Value</span>
                  <span className="ml-2 text-sm font-medium">{show.educationalValue}/10</span>
                </div>
                <RatingBar 
                  value={show.educationalValue} 
                  max={10}
                  colorClass={show.educationalValue >= 8 ? 'purple-rating' : show.educationalValue >= 5 ? 'yellow-rating' : 'red-rating'}
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Parent Enjoyment</span>
                  <span className="ml-2 text-sm font-medium">{show.parentEnjoyment}/10</span>
                </div>
                <RatingBar 
                  value={show.parentEnjoyment} 
                  max={10}
                  colorClass={show.parentEnjoyment >= 8 ? 'purple-rating' : show.parentEnjoyment >= 5 ? 'yellow-rating' : 'red-rating'}
                />
              </div>
              
              <div className="flex items-center mt-auto">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`${isFavorite ? 'text-secondary-500' : 'text-gray-500 hover:text-secondary-500'}`}
                  onClick={toggleFavorite}
                >
                  <i className={`${isFavorite ? 'fas' : 'far'} fa-heart`}></i>
                </Button>
                <Button variant="link" size="sm" className="text-primary-600 hover:text-primary-800 ml-auto">
                  View Details
                </Button>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer" onClick={onClick}>
      <div className="relative">
        {show.imageUrl ? (
          <img 
            className="h-48 w-full object-cover"
            src={show.imageUrl}
            alt={show.name}
          />
        ) : (
          <div className="h-48 w-full bg-gray-200 flex items-center justify-center">
            <i className="fas fa-tv text-gray-400 text-4xl"></i>
          </div>
        )}
        <div className="absolute top-2 right-2 flex items-center bg-white bg-opacity-90 px-2 py-1 rounded-full">
          <i className="fas fa-star text-secondary-500 mr-1"></i>
          <span className="font-bold text-sm">{show.overallRating}</span>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-heading font-bold">{show.name}</h3>
          <Badge variant="outline" className="bg-green-100 text-green-800 text-xs font-medium">
            Ages {show.ageRange}
          </Badge>
        </div>
        
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Tantrum Factor</span>
            <div className="flex items-center">
              <RatingBar 
                value={show.tantrumFactor} 
                max={10}
                colorClass={show.tantrumFactor <= 3 ? 'green-rating' : show.tantrumFactor <= 7 ? 'yellow-rating' : 'red-rating'}
              />
              <span className="ml-2 text-sm font-medium">{show.tantrumFactor}/10</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Educational Value</span>
            <div className="flex items-center">
              <RatingBar 
                value={show.educationalValue} 
                max={10}
                colorClass={show.educationalValue >= 8 ? 'purple-rating' : show.educationalValue >= 5 ? 'yellow-rating' : 'red-rating'}
              />
              <span className="ml-2 text-sm font-medium">{show.educationalValue}/10</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Parent Enjoyment</span>
            <div className="flex items-center">
              <RatingBar 
                value={show.parentEnjoyment} 
                max={10}
                colorClass={show.parentEnjoyment >= 8 ? 'purple-rating' : show.parentEnjoyment >= 5 ? 'yellow-rating' : 'red-rating'}
              />
              <span className="ml-2 text-sm font-medium">{show.parentEnjoyment}/10</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex justify-between">
          <Button variant="link" className="text-primary-600 hover:text-primary-800 text-sm font-medium p-0">
            View Details
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`${isFavorite ? 'text-secondary-500' : 'text-gray-500 hover:text-secondary-500'}`}
            onClick={toggleFavorite}
          >
            <i className={`${isFavorite ? 'fas' : 'far'} fa-heart`}></i>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
