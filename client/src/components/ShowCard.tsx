import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import RatingBar from "@/components/RatingBar";
import { TvShow } from "@shared/schema";
import { getStimulationScoreColor } from "@/lib/showUtils";
import { useAuth } from "@/hooks/use-auth";
import { Heart } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface ShowCardProps {
  show: TvShow;
  viewMode: "grid" | "list";
  onClick: () => void;
  isMobile?: boolean;
}

export default function ShowCard({ show, viewMode, onClick, isMobile = false }: ShowCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { user, toggleFavorite: toggleFav } = useAuth();
  
  // Debug show data
  console.log('ShowCard received show data:', show);
  
  // Normalize show data to handle API response field naming differences
  const normalizedShow = {
    ...show,
    // Type-safe normalization for field names that might come in different formats
    imageUrl: show.imageUrl || '',
    ageRange: show.ageRange || '',
    stimulationScore: show.stimulationScore || 0
  };
  
  // Check if show is in favorites when component mounts or user changes
  useEffect(() => {
    // Reset favorite status when user logs out
    if (!user) {
      setIsFavorite(false);
      return;
    }
    
    const checkFavoriteStatus = async () => {
      if (user && show.id) {
        try {
          const res = await fetch(`/api/favorites/${show.id}`, {
            credentials: "include" // Ensure cookies are sent for authentication
          });
          
          if (!res.ok) {
            // If request failed, set to false and return
            setIsFavorite(false);
            return;
          }
          
          const data = await res.json();
          setIsFavorite(!!data.isFavorite); // Convert to boolean with !!
        } catch (error) {
          console.error("Failed to check favorite status:", error);
          setIsFavorite(false); // Set to false on error to be safe
        }
      } else {
        // If no user or no show.id, ensure favorite is false
        setIsFavorite(false);
      }
    };
    
    checkFavoriteStatus();
  }, [user, show.id]);
  
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Check if user is logged in
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in or register to save shows to your favorites.",
        variant: "default",
      });
      navigate("/auth");
      return;
    }
    
    // Use the auth context toggle favorite function
    toggleFav(show.id).then(() => {
      // Update local state (optimistic update)
      setIsFavorite(!isFavorite);
      
      toast({
        title: isFavorite ? "Removed from favorites" : "Added to favorites",
        description: isFavorite ? `${show.name} has been removed from your favorites.` : `${show.name} has been added to your favorites.`,
        variant: "default",
      });
    }).catch(error => {
      toast({
        title: "Error",
        description: "There was an error updating your favorites. Please try again.",
        variant: "destructive",
      });
      console.error("Error toggling favorite:", error);
    });
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
    const score = normalizedShow.stimulationScore;
    
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
  
  // Get the stimulation score text representation
  const getStimulationText = (score: number) => {
    return score === 1 ? 'Low' : 
           score === 2 ? 'Low-Medium' : 
           score === 3 ? 'Medium' : 
           score === 4 ? 'Medium-High' : 
           'High';
  };
  
  // Format the stimulation score text (used for circular badge in mobile view)
  const getStimulationScoreText = (score: number) => {
    return `${score}/5`;
  };
  
  // Get color for circular stimulation score
  const getStimulationCircleColor = (score: number) => {
    if (score <= 1) return 'border-green-500 text-green-500';
    if (score <= 2) return 'border-green-400 text-green-500';
    if (score <= 3) return 'border-yellow-500 text-yellow-600';
    if (score <= 4) return 'border-orange-500 text-orange-600';
    return 'border-red-500 text-red-600';
  };

  // Mobile portrait style card - clean design as in screenshot
  if (isMobile && viewMode === "grid") {
    const stimulationLabel = getStimulationText(normalizedShow.stimulationScore);
    
    return (
      <Card 
        className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer h-full flex flex-col" 
        onClick={() => {
          // Scroll to top before triggering the onClick action
          window.scrollTo(0, 0);
          onClick();
        }}
      >
        {/* Image */}
        <div className="relative">
          {normalizedShow.imageUrl && !imageError ? (
            <div className="w-full aspect-[2/3] bg-gray-100 overflow-hidden">
              <img 
                className="w-full h-full object-cover"
                src={normalizedShow.imageUrl}
                alt={show.name}
                style={{ objectPosition: 'center top' }}
                onError={() => {
                  // If image fails to load, set state to show placeholder
                  setImageError(true);
                }}
              />
            </div>
          ) : (
            <div className="w-full aspect-[2/3] bg-gray-200 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-gray-400">
                <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
                <polyline points="17 2 12 7 7 2"></polyline>
              </svg>
            </div>
          )}
          
          {/* Favorite button */}
          <Button 
            variant="ghost" 
            size="sm"
            className={`absolute top-1 right-1 p-1 bg-black/30 text-white rounded-full hover:bg-black/50 h-7 w-7 flex items-center justify-center`}
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(e);
            }}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </div>
        
        <CardContent className="p-3 flex flex-col flex-grow">
          {/* Title with ellipsis */}
          <h3 className="text-sm font-bold line-clamp-1 mb-2">{show.name}</h3>
          
          {/* Age Badge */}
          <Badge variant="outline" className="bg-green-50 text-green-700 text-xs border-green-100 mb-2 w-fit">
            Ages {normalizedShow.ageRange}
          </Badge>
          
          {/* Stimulation score dots and label */}
          <div className="mt-auto">
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center mb-1">
                {renderStimulationDots()}
              </div>
              <div className="text-xs text-gray-600 text-center">
                {stimulationLabel} Stimulation
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Original list view card
  if (viewMode === "list") {
    return (
      <Card 
        className="hover:shadow-lg transition-shadow duration-300 cursor-pointer" 
        onClick={() => {
          // Scroll to top before triggering the onClick action
          window.scrollTo(0, 0);
          onClick();
        }}>
        <div className="flex">
          <div className="flex-shrink-0 w-32 sm:w-48">
            {show.imageUrl ? (
              <div className="h-full w-full bg-gray-100 overflow-hidden flex items-center justify-center">
                <div className="w-full h-full relative">
                  <img 
                    className="absolute inset-0 w-full h-full object-cover"
                    src={show.imageUrl}
                    alt={show.name}
                    style={{ objectPosition: 'center top' }}
                  />
                </div>
              </div>
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
                  {getStimulationText(show.stimulationScore)} Stimulation
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={`${isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                  onClick={toggleFavorite}
                >
                  <Heart className={`w-4 h-4 mr-1 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                  {isFavorite ? 'Saved' : 'Save'}
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="bg-secondary hover:bg-secondary/90 text-white"
                  style={{fontWeight: 'bold'}}
                >
                  Learn More
                </Button>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }
  
  // Default card view (grid) - smaller portrait style
  return (
    <Card 
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full flex flex-col" 
      onClick={() => {
        // Scroll to top before triggering the onClick action
        window.scrollTo(0, 0);
        onClick();
      }}>
      <div className="relative">
        {normalizedShow.imageUrl && !imageError ? (
          <div className="w-full aspect-[2/3] bg-gray-100 overflow-hidden flex items-center justify-center">
            <div className="w-full h-full relative">
              <img 
                className="absolute inset-0 w-full h-full object-cover"
                src={normalizedShow.imageUrl}
                alt={show.name}
                style={{ objectPosition: 'center top' }}
                onError={() => {
                  // If image fails to load, set state to show placeholder
                  setImageError(true);
                }}
              />
            </div>
          </div>
        ) : (
          <div className="w-full aspect-[2/3] bg-gray-200 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-gray-400">
              <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
              <polyline points="17 2 12 7 7 2"></polyline>
            </svg>
          </div>
        )}
        
        {/* Favorite button overlay */}
        <Button 
          variant="ghost" 
          size="sm"
          className={`absolute top-1 right-1 p-0.5 bg-black/30 text-white rounded-full hover:bg-black/50 h-6 w-6 flex items-center justify-center`}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(e);
          }}
        >
          <Heart className={`w-3 h-3 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
        </Button>
      </div>
      
      <CardContent className="p-2 flex-grow flex flex-col">
        <div className="flex-grow space-y-1">
          {/* Title and age */}
          <div>
            <h3 className="text-sm font-semibold line-clamp-1">{show.name}</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xs text-gray-500">Ages {normalizedShow.ageRange}</span>
            </div>
          </div>
          
          {/* Stimulation score indicator */}
          <div className="flex items-center gap-1">
            <div className="flex items-center scale-75">
              {renderStimulationDots()}
            </div>
            <span className="text-xs text-gray-600">
              {getStimulationText(normalizedShow.stimulationScore)}
            </span>
          </div>
          
          {/* Theme tags - limited to 1 for smaller cards */}
          {show.themes && show.themes.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {show.themes.slice(0, 1).map((theme, index) => (
                <Badge key={index} variant="outline" className={`${getThemeColor(theme)} text-xs py-0 px-1.5`}>
                  {theme}
                </Badge>
              ))}
              {show.themes.length > 1 && (
                <Badge variant="outline" className="bg-gray-100 text-gray-600 text-xs py-0 px-1.5">
                  +{show.themes.length - 1}
                </Badge>
              )}
            </div>
          )}
        </div>
        
        {/* Learn More button */}
        <div className="mt-auto pt-1">
          <Button 
            variant="default" 
            size="sm" 
            className="w-full bg-secondary hover:bg-secondary/90 text-white text-xs py-0.5 h-7"
            style={{fontWeight: 'bold'}}
          >
            Learn More
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
