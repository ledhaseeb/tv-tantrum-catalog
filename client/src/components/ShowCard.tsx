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
                <div className="flex items-center flex-wrap gap-2 mb-2">
                  <Badge variant="outline" className="bg-green-100 text-green-800 text-xs font-medium">
                    Ages {show.ageRange}
                  </Badge>
                  {show.availableOn && show.availableOn.length > 0 && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs font-medium">
                      {show.availableOn[0]}{show.availableOn.length > 1 ? "+" : ""}
                    </Badge>
                  )}
                </div>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                  {show.description}
                </p>
                
                {/* Theme tags */}
                {show.themes && show.themes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2 mb-3">
                    {show.themes.slice(0, 5).map((theme, index) => {
                      // Assign different colors based on theme
                      const themeColors = {
                        "Educational": "bg-indigo-100 text-indigo-800",
                        "Adventure": "bg-amber-100 text-amber-800",
                        "Fantasy": "bg-purple-100 text-purple-800",
                        "Comedy": "bg-green-100 text-green-800",
                        "Music": "bg-pink-100 text-pink-800",
                      };
                      
                      const colorClass = themeColors[theme as keyof typeof themeColors] || "bg-gray-100 text-gray-800";
                      
                      return (
                        <Badge key={index} variant="outline" className={`${colorClass} text-xs`}>
                          {theme}
                        </Badge>
                      );
                    })}
                    {show.themes.length > 5 && (
                      <Badge variant="outline" className="bg-gray-100 text-gray-800 text-xs">
                        +{show.themes.length - 5}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-1 ${
                    show.stimulationScore <= 2 ? 'bg-green-500' : 
                    show.stimulationScore <= 4 ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }`}></div>
                  <span className="text-sm text-gray-600">
                    {show.stimulationScore <= 2 ? 'Low' : 
                    show.stimulationScore <= 4 ? 'Medium' : 
                    'High'} Stimulation
                  </span>
                </div>
                
                <div className="flex items-center">
                  <i className="fas fa-star text-secondary-500 text-sm mr-1"></i>
                  <span className="text-sm font-medium">{show.overallRating}/5</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={`${isFavorite ? 'text-secondary-500' : 'text-gray-400 hover:text-secondary-500'}`}
                  onClick={toggleFavorite}
                >
                  <i className={`${isFavorite ? 'fas' : 'far'} fa-heart mr-1`}></i>
                  Save
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="bg-primary-600 hover:bg-primary-700 text-white"
                >
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
    <Card className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full" onClick={onClick}>
      <div className="relative">
        {show.imageUrl ? (
          <img 
            className="h-44 w-full object-cover"
            src={show.imageUrl}
            alt={show.name}
          />
        ) : (
          <div className="h-44 w-full bg-gray-200 flex items-center justify-center">
            <i className="fas fa-tv text-gray-400 text-4xl"></i>
          </div>
        )}
      </div>
      
      <CardContent className="p-3 pb-4">
        <h3 className="text-md font-heading font-bold mb-1 line-clamp-1">{show.name}</h3>
        
        <div className="flex items-center space-x-2 mb-2">
          <Badge variant="outline" className="bg-green-100 text-green-800 text-xs font-medium">
            Ages {show.ageRange}
          </Badge>
          {/* Platform info */}
          {show.availableOn && show.availableOn.length > 0 && (
            <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs font-medium">
              {show.availableOn[0]}{show.availableOn.length > 1 ? "+" : ""}
            </Badge>
          )}
        </div>
        
        {/* Theme tags */}
        {show.themes && show.themes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {show.themes.slice(0, 3).map((theme, index) => {
              // Assign different colors based on theme
              const themeColors = {
                "Educational": "bg-indigo-100 text-indigo-800",
                "Adventure": "bg-amber-100 text-amber-800",
                "Fantasy": "bg-purple-100 text-purple-800",
                "Comedy": "bg-green-100 text-green-800",
                "Music": "bg-pink-100 text-pink-800",
              };
              
              const colorClass = themeColors[theme as keyof typeof themeColors] || "bg-gray-100 text-gray-800";
              
              return (
                <Badge key={index} variant="outline" className={`${colorClass} text-xs`}>
                  {theme}
                </Badge>
              );
            })}
            {show.themes.length > 3 && (
              <Badge variant="outline" className="bg-gray-100 text-gray-800 text-xs">
                +{show.themes.length - 3}
              </Badge>
            )}
          </div>
        )}
        
        {/* Rating section at bottom */}
        <div className="flex justify-between items-center mt-auto">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-1 ${
              show.stimulationScore <= 2 ? 'bg-green-500' : 
              show.stimulationScore <= 4 ? 'bg-yellow-500' : 
              'bg-red-500'
            }`}></div>
            <span className="text-xs text-gray-600">
              {show.stimulationScore <= 2 ? 'Low' : 
               show.stimulationScore <= 4 ? 'Medium' : 
               'High'} Stim
            </span>
          </div>
          
          <div className="flex items-center">
            <i className="fas fa-star text-secondary-500 text-xs mr-1"></i>
            <span className="text-xs font-medium">{show.overallRating}/5</span>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            className={`${isFavorite ? 'text-secondary-500' : 'text-gray-400 hover:text-secondary-500'} p-1`}
            onClick={toggleFavorite}
          >
            <i className={`${isFavorite ? 'fas' : 'far'} fa-heart text-xs`}></i>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
