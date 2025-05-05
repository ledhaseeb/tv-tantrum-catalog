import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import RatingBar from "@/components/RatingBar";
import { TvShow } from "@shared/schema";
import { getStimulationScoreColor } from "@/lib/showUtils";

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
  
  // Format release year range
  const releaseYears = show.releaseYear ? (
    show.endYear && show.endYear !== show.releaseYear 
      ? `(${show.releaseYear}-${show.endYear})` 
      : `(${show.releaseYear})`
  ) : '';
  
  // Theme colors based on categories
  const getThemeColor = (theme: string) => {
    const lowerTheme = theme.toLowerCase();
    if (lowerTheme.includes('friendship')) return 'bg-cyan-100 text-cyan-800';
    if (lowerTheme.includes('problem solving')) return 'bg-green-100 text-green-800';
    if (lowerTheme.includes('emotional intelligence')) return 'bg-rose-100 text-rose-800';
    if (lowerTheme.includes('creativity') || lowerTheme.includes('imagination')) return 'bg-purple-100 text-purple-800';
    if (lowerTheme.includes('adventure')) return 'bg-amber-100 text-amber-800';
    if (lowerTheme.includes('science') || lowerTheme.includes('stem')) return 'bg-sky-100 text-sky-800';
    if (lowerTheme.includes('nature')) return 'bg-emerald-100 text-emerald-800';
    if (lowerTheme.includes('mechanic') || lowerTheme.includes('engineering')) return 'bg-orange-100 text-orange-800';
    if (lowerTheme.includes('cultural') || lowerTheme.includes('social')) return 'bg-pink-100 text-pink-800';
    if (lowerTheme.includes('entertainment')) return 'bg-indigo-100 text-indigo-800';
    return 'bg-gray-100 text-gray-800';
  };
  
  // Get stimulation score color
  const getStimRatingColorClass = () => {
    const scoreColors = ["bg-green-500", "bg-green-500", "bg-yellow-500", "bg-yellow-500", "bg-red-500"];
    return scoreColors[Math.min(Math.floor(show.stimulationScore), 5) - 1] || "bg-gray-400";
  };
  
  // Get rating circles based on score
  const renderRatingCircles = (score: number, maxScore: number = 5) => {
    const circles = [];
    const scoreColors = ["bg-orange-500", "bg-orange-400", "bg-orange-300", "bg-gray-300", "bg-gray-300"];
    
    for (let i = 0; i < maxScore; i++) {
      circles.push(
        <div 
          key={i} 
          className={`h-2 w-2 rounded-full mx-0.5 ${i < score ? scoreColors[i] : 'bg-gray-200'}`}
        ></div>
      );
    }
    return circles;
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
                    {show.themes.slice(0, 5).map((theme, index) => (
                      <Badge key={index} variant="outline" className={`${getThemeColor(theme)} text-xs`}>
                        {theme}
                      </Badge>
                    ))}
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
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-1 ${getStimRatingColorClass()}`}></div>
                <span className="text-sm text-gray-600">
                  {show.stimulationScore <= 2 ? 'Low' : 
                  show.stimulationScore <= 4 ? 'Medium' : 
                  'High'} Stimulation ({show.stimulationScore}/5)
                </span>
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
                <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                  Learn More
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
      
      <CardContent className="p-4">
        <div className="space-y-2">
          {/* Title and age */}
          <div>
            <h3 className="text-md font-bold mb-1 line-clamp-1">{show.name} {releaseYears}</h3>
            <div className="text-sm text-gray-500">Age: {show.ageRange}</div>
          </div>
          
          {/* Theme tags */}
          {show.themes && show.themes.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {show.themes.slice(0, 3).map((theme, index) => (
                <Badge key={index} variant="outline" className={`${getThemeColor(theme)} text-xs`}>
                  {theme}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Stimulation score indicator */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded-full ${getStimRatingColorClass()}`}></div>
              <span className="text-xs text-gray-600">
                {show.stimulationScore <= 2 ? 'Low' : 
                 show.stimulationScore <= 4 ? 'Medium' : 
                 'High'} Stimulation ({show.stimulationScore}/5)
              </span>
            </div>
            <Button 
              variant="default" 
              size="sm" 
              className="bg-green-600 hover:bg-green-700 text-white text-xs py-1 px-2"
            >
              Learn More
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
