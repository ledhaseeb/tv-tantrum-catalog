import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TvShow } from "@shared/schema";
import { Link } from "wouter";
import { Heart, Star } from "lucide-react";

interface DesktopShowCardProps {
  show: TvShow;
  onClick?: () => void;
}

export default function DesktopShowCard({ show, onClick }: DesktopShowCardProps) {
  // Ensure we have valid show data
  if (!show || !show.id) {
    return null;
  }
  
  // Normalize show data to handle API response field naming differences
  const normalizedShow = {
    ...show,
    imageUrl: show.imageUrl || (show as any).image_url,
    ageRange: show.ageRange || (show as any).age_range || 'Unknown',
    stimulationScore: show.stimulationScore || (show as any).stimulation_score || 0
  };

  // Get stimulation level text and color
  const getStimulationInfo = (score: number) => {
    switch (score) {
      case 1: return { text: 'Low', color: 'text-green-600' };
      case 2: return { text: 'Low-Medium', color: 'text-yellow-600' };
      case 3: return { text: 'Medium', color: 'text-orange-600' };
      case 4: return { text: 'Medium-High', color: 'text-red-600' };
      case 5: return { text: 'High', color: 'text-red-700' };
      default: return { text: 'Unknown', color: 'text-gray-600' };
    }
  };

  // Render stimulation dots
  const renderStimulationDots = (score: number) => {
    const dots = [];
    const colors = [
      'bg-green-500',    // 1 - Low
      'bg-yellow-500',   // 2 - Low-Medium  
      'bg-orange-500',   // 3 - Medium
      'bg-red-500',      // 4 - Medium-High
      'bg-red-700'       // 5 - High
    ];
    
    for (let i = 1; i <= 5; i++) {
      const isActive = i <= score;
      const colorClass = isActive ? colors[i - 1] : 'bg-gray-300';
      
      dots.push(
        <div
          key={i}
          className={`w-3 h-3 rounded-full ${colorClass}`}
        />
      );
    }
    return dots;
  };

  const stimulationInfo = getStimulationInfo(normalizedShow.stimulationScore);

  return (
    <div className="relative group">
      {/* Favorite heart icon */}
      <button className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
        <Heart className="w-4 h-4 text-gray-600 hover:text-red-500" />
      </button>

      <Link href={`/show/${show.id}`}>
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 border-0 bg-white overflow-hidden"
          onClick={onClick}
        >
          <CardContent className="p-0">
            {/* Show Image */}
            <div className="aspect-[3/4] relative bg-gray-100">
              {normalizedShow.imageUrl ? (
                <img
                  src={normalizedShow.imageUrl}
                  alt={`${show.name} poster`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400"
                style={{ display: normalizedShow.imageUrl ? 'none' : 'flex' }}
              >
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/>
                </svg>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Show Name */}
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight">
                {show.name}
              </h3>

              {/* Age Range */}
              <div className="text-sm text-gray-600 mb-2">
                Ages {normalizedShow.ageRange}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-3">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className="w-4 h-4 text-yellow-400 fill-yellow-400" 
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600 ml-1">5 (1 review)</span>
              </div>

              {/* Stimulation Dots */}
              <div className="flex gap-1 mb-2">
                {renderStimulationDots(normalizedShow.stimulationScore)}
              </div>

              {/* Stimulation Level Text */}
              <div className={`text-sm font-medium ${stimulationInfo.color} mb-3`}>
                {stimulationInfo.text}
              </div>

              {/* Themes */}
              {show.themes && show.themes.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {show.themes.slice(0, 2).map((theme, index) => (
                    <Badge 
                      key={index}
                      variant="secondary" 
                      className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-100"
                    >
                      {theme}
                    </Badge>
                  ))}
                  {show.themes.length > 2 && (
                    <span className="text-xs text-gray-500">+{show.themes.length - 2}</span>
                  )}
                </div>
              )}

              {/* Action Button */}
              <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium py-2 px-4 rounded text-sm transition-colors">
                Learn More
              </button>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}