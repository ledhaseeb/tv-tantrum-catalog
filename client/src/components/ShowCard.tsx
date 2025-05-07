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
  
  // Get stimulation score colors based on index
  const getStimulationDotColor = (index: number) => {
    // Match the colors from details page
    const bgColors = [
      'bg-green-500',    // green for 1
      'bg-yellow-500',   // yellow for 2
      'bg-orange-500',   // orange for 3
      'bg-orange-600',   // dark orange for 4
      'bg-red-500'       // red for 5
    ];
    
    const borderColors = [
      'border-green-500',    // green for 1
      'border-yellow-500',   // yellow for 2
      'border-orange-500',   // orange for 3
      'border-orange-600',   // dark orange for 4
      'border-red-500'       // red for 5
    ];
    
    return { bgColor: bgColors[index], borderColor: borderColors[index] };
  };
  
  // Render stimulation score dots
  const renderStimulationDots = () => {
    const dots = [];
    const score = show.stimulationScore;
    
    for (let i = 0; i < 5; i++) {
      const { bgColor, borderColor } = getStimulationDotColor(i);
      dots.push(
        <div 
          key={i} 
          className={`w-3 h-3 rounded-full mx-0.5 ${
            // Active dots show their own color
            i < score 
              ? bgColor 
              // Inactive dots are outlined with their corresponding color
              : `border-2 ${borderColor} bg-white`
          }`} 
        />
      );
    }
    return dots;
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
                <div className="flex items-center mr-2">
                  {renderStimulationDots()}
                </div>
                <span className="text-sm text-gray-600">
                  {show.stimulationScore <= 2 ? 'Low' : 
                  show.stimulationScore <= 4 ? 'Medium' : 
                  'High'} Stimulation
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
                <Button variant="default" size="sm" className="bg-secondary hover:bg-secondary/90 text-white font-bold">
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
              <div className="flex items-center scale-75 mr-1">
                {renderStimulationDots()}
              </div>
              <span className="text-xs text-gray-600">
                {show.stimulationScore <= 2 ? 'Low' : 
                 show.stimulationScore <= 4 ? 'Medium' : 
                 'High'} Stimulation
              </span>
            </div>
            <Button 
              variant="default" 
              size="sm" 
              className="bg-secondary hover:bg-secondary/90 text-white text-xs py-1 px-2 font-bold"
            >
              Learn More
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
