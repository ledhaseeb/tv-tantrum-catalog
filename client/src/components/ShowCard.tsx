import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TvShow } from "@shared/schema";
import { Star } from "lucide-react";
import { TvShowCardImage } from "@/components/ui/tv-show-image";
import { Link } from "wouter";

interface ShowCardProps {
  show: TvShow & {
    averageRating?: number;
    reviewCount?: number;
  };
  viewMode: "grid" | "list";
  onClick: () => void;
  isMobile?: boolean;
}

export default function ShowCard({ show, viewMode, onClick, isMobile = false }: ShowCardProps) {
  const [reviewStats, setReviewStats] = useState<{reviewCount: number, avgRating: number} | null>(null);
  
  // Ensure we have valid show data
  if (!show || !show.id) {
    return null;
  }
  
  // Normalize show data to handle API response field naming differences
  const normalizedShow = {
    ...show,
    // Handle both camelCase and snake_case field naming from database
    imageUrl: show.imageUrl || (show as any).image_url,
    ageRange: show.ageRange || (show as any).age_range || 'Unknown',
    stimulationScore: show.stimulationScore || (show as any).stimulation_score || 0
  };
  
  // Catalog version doesn't use reviews - set default values
  useEffect(() => {
    setReviewStats({ reviewCount: 0, avgRating: 0 });
  }, []);
  
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
    if (lowerTheme.includes('family')) return 'bg-green-100 text-green-800';
    if (lowerTheme.includes('adventure')) return 'bg-orange-100 text-orange-800';
    if (lowerTheme.includes('music')) return 'bg-purple-100 text-purple-800';
    if (lowerTheme.includes('science')) return 'bg-blue-100 text-blue-800';
    if (lowerTheme.includes('art')) return 'bg-pink-100 text-pink-800';
    if (lowerTheme.includes('problem')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };
  
  // Get stimulation text
  const getStimulationText = (score: number) => {
    switch (score) {
      case 1: return 'Very Calm';
      case 2: return 'Calm';
      case 3: return 'Moderate';
      case 4: return 'Active';
      case 5: return 'High Energy';
      default: return 'Unknown';
    }
  };

  // Render stimulation dots
  const renderStimulationDots = () => {
    const dots = [];
    for (let i = 1; i <= 5; i++) {
      dots.push(
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full mx-0.5 ${
            i <= normalizedShow.stimulationScore 
              ? 'bg-orange-500' 
              : 'bg-gray-300'
          }`}
        />
      );
    }
    return dots;
  };

  // Mobile portrait style card - clean design without favorite buttons
  if (isMobile && viewMode === "grid") {
    const stimulationLabel = getStimulationText(normalizedShow.stimulationScore);
    
    return (
      <Link href={`/show/${show.id}`}>
        <Card className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer h-full flex flex-col hover:shadow-md transition-shadow">
          {/* Image */}
          <div className="relative">
            <TvShowCardImage
              showId={show.id}
              showName={show.name}
              originalUrl={normalizedShow.imageUrl}
              className="w-full aspect-[2/3]"
              isInteractive={false}
            />
          </div>
          
          <CardContent className="p-3 flex flex-col flex-grow">
            {/* Title with ellipsis */}
            <h3 className="text-sm font-bold line-clamp-1 mb-2">{show.name}</h3>
            
            {/* Review Statistics */}
            {reviewStats && reviewStats.reviewCount > 0 && (
              <div className="flex items-center gap-1 mb-2 text-xs">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{reviewStats.avgRating}</span>
                <span className="text-gray-500">({reviewStats.reviewCount} review{reviewStats.reviewCount !== 1 ? 's' : ''})</span>
              </div>
            )}
            
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
      </Link>
    );
  }

  // List view card
  if (viewMode === "list") {
    return (
      <Link href={`/show/${show.id}`}>
        <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Show image */}
              <div className="flex-shrink-0">
                <TvShowCardImage
                  showId={show.id}
                  showName={show.name}
                  originalUrl={normalizedShow.imageUrl}
                  className="w-full sm:w-24 h-32 sm:h-36"
                  isInteractive={false}
                />
              </div>
              
              {/* Show details */}
              <div className="flex-grow min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{show.name}</h3>
                  <div className="flex items-center gap-2">
                    {/* Age badge */}
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100">
                      Ages {normalizedShow.ageRange}
                    </Badge>
                  </div>
                </div>
                
                {/* Creator and year */}
                <p className="text-sm text-gray-600 mb-2">
                  {show.creator && (
                    <span>Created by {show.creator}</span>
                  )}
                  {show.creator && releaseYears && <span> • </span>}
                  {releaseYears && <span>{releaseYears}</span>}
                </p>
                
                {/* Description */}
                <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                  {show.description}
                </p>
                
                {/* Stimulation and episode info */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 mb-3">
                  <div className="flex items-center">
                    <span className="mr-1">Stimulation:</span>
                    <div className="flex items-center mr-1">
                      {renderStimulationDots()}
                    </div>
                    <span>{getStimulationText(normalizedShow.stimulationScore)}</span>
                  </div>
                  <span>•</span>
                  <span>{show.episodeLength} min episodes</span>
                </div>
                
                {/* Themes */}
                {show.themes && show.themes.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {show.themes.slice(0, 4).map((theme, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className={`text-xs ${getThemeColor(theme)}`}
                      >
                        {theme}
                      </Badge>
                    ))}
                    {show.themes.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{show.themes.length - 4} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  // Default grid view card
  return (
    <Link href={`/show/${show.id}`}>
      <Card className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer h-full flex flex-col hover:shadow-md transition-shadow">
        {/* Image */}
        <div className="relative">
          <TvShowCardImage
            showId={show.id}
            showName={show.name}
            originalUrl={normalizedShow.imageUrl}
            className="w-full aspect-[2/3]"
            isInteractive={false}
          />
        </div>
        
        <CardContent className="p-4 flex flex-col flex-grow">
          {/* Title */}
          <h3 className="text-sm font-bold mb-2 line-clamp-2">{show.name}</h3>
          
          {/* Creator and year */}
          {(show.creator || releaseYears) && (
            <p className="text-xs text-gray-600 mb-2">
              {show.creator && <span>By {show.creator}</span>}
              {show.creator && releaseYears && <span> • </span>}
              {releaseYears}
            </p>
          )}
          
          {/* Age and episode length */}
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 text-xs border-green-100">
              Ages {normalizedShow.ageRange}
            </Badge>
            <span className="text-xs text-gray-600">{show.episodeLength} min</span>
          </div>
          
          {/* Stimulation score */}
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Stimulation</span>
              <div className="flex items-center">
                {renderStimulationDots()}
              </div>
            </div>
            <div className="text-xs text-gray-600 text-center">
              {getStimulationText(normalizedShow.stimulationScore)}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}