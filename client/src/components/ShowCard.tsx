import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TvShow } from "@shared/schema";
import { Star } from "lucide-react";
import { TvShowCardImage } from "@/components/ui/tv-show-image";
import { Link } from "wouter";

// Helper function to create slug from show name
const createShowSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
};

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
    if (lowerTheme.includes('learning')) return 'bg-blue-100 text-blue-800';
    if (lowerTheme.includes('creativity')) return 'bg-purple-100 text-purple-800';
    if (lowerTheme.includes('problem')) return 'bg-red-100 text-red-800';
    if (lowerTheme.includes('music')) return 'bg-pink-100 text-pink-800';
    if (lowerTheme.includes('science')) return 'bg-teal-100 text-teal-800';
    if (lowerTheme.includes('nature')) return 'bg-emerald-100 text-emerald-800';
    if (lowerTheme.includes('social')) return 'bg-violet-100 text-violet-800';
    if (lowerTheme.includes('emotional')) return 'bg-rose-100 text-rose-800';
    if (lowerTheme.includes('entertainment')) return 'bg-indigo-100 text-indigo-800';
    return 'bg-gray-100 text-gray-800';
  };
  
  // Get stimulation score colors based on index
  const getStimulationDotColor = (index: number) => {
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

  const showSlug = createShowSlug(show.name);

  // Mobile portrait style card - clean design without favorite buttons
  if (isMobile && viewMode === "grid") {
    const stimulationLabel = getStimulationText(normalizedShow.stimulationScore);
    
    return (
      <Link href={`/show/${showSlug}`} className="block h-full">
        <Card 
          className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer h-full flex flex-col hover:shadow-md transition-shadow duration-200" 
        >
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

  // List view card without favorite buttons
  if (viewMode === "list") {
    return (
      <Link href={`/show/${showSlug}`} className="block">
        <Card 
          className="hover:shadow-lg transition-shadow duration-300 cursor-pointer" 
        >
          <div className="flex">
            <div className="flex-shrink-0 w-32 sm:w-48">
              <TvShowCardImage
                showId={show.id}
                showName={show.name}
                originalUrl={normalizedShow.imageUrl}
                className="w-full h-full object-cover"
                isInteractive={false}
              />
            </div>
            
            <CardContent className="flex-1 p-4 sm:p-6">
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2 flex-1">
                      {show.name} {releaseYears}
                    </h3>
                  </div>
                  
                  {/* Review Statistics */}
                  {reviewStats && reviewStats.reviewCount > 0 && (
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium text-sm">{reviewStats.avgRating}</span>
                      <span className="text-gray-500 text-sm">({reviewStats.reviewCount} review{reviewStats.reviewCount !== 1 ? 's' : ''})</span>
                    </div>
                  )}
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{show.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100">
                      Ages {normalizedShow.ageRange}
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
                      {show.episodeLength} min
                    </Badge>
                  </div>
                  
                  {/* Themes - Show first 3 on mobile, first 4 on desktop */}
                  {show.themes && show.themes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {show.themes.slice(0, isMobile ? 2 : 3).map((theme, index) => (
                        <Badge key={index} variant="secondary" className={`text-xs ${getThemeColor(theme)}`}>
                          {theme}
                        </Badge>
                      ))}
                      {show.themes.length > (isMobile ? 2 : 3) && (
                        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                          +{show.themes.length - (isMobile ? 2 : 3)} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Stimulation Score */}
                <div className="flex items-center">
                  <div className="flex items-center mr-2">
                    {renderStimulationDots()}
                  </div>
                  <span className="text-sm text-gray-600">
                    {getStimulationText(show.stimulationScore)} Stimulation
                  </span>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      </Link>
    );
  }

  // Desktop grid view
  return (
    <Link href={`/show/${showSlug}`} className="block h-full">
      <Card 
        className="hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full flex flex-col bg-white" 
      >
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
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-base font-bold text-gray-900 line-clamp-2 flex-1">
              {show.name}
            </h3>
          </div>
          
          {/* Review Statistics */}
          {reviewStats && reviewStats.reviewCount > 0 && (
            <div className="flex items-center gap-1 mb-3">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-sm">{reviewStats.avgRating}</span>
              <span className="text-gray-500 text-sm">({reviewStats.reviewCount})</span>
            </div>
          )}
          
          <p className="text-gray-600 text-sm mb-3 line-clamp-2 flex-grow">{show.description}</p>
          
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100 text-xs">
              Ages {normalizedShow.ageRange}
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 text-xs">
              {show.episodeLength} min
            </Badge>
          </div>
          
          {/* Themes - Show first 2 themes */}
          {show.themes && show.themes.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {show.themes.slice(0, 2).map((theme, index) => (
                <Badge key={index} variant="secondary" className={`text-xs ${getThemeColor(theme)}`}>
                  {theme}
                </Badge>
              ))}
              {show.themes.length > 2 && (
                <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                  +{show.themes.length - 2} more
                </Badge>
              )}
            </div>
          )}
          
          {/* Stimulation Score at bottom */}
          <div className="mt-auto flex flex-col items-center">
            <div className="flex items-center justify-center mb-1">
              {renderStimulationDots()}
            </div>
            <span className="text-sm text-gray-600">
              {getStimulationText(show.stimulationScore)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}