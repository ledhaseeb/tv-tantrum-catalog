import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TvShow } from "@shared/schema";
import { Link } from "wouter";

interface MobileShowCardProps {
  show: TvShow;
  onClick?: () => void;
}

export default function MobileShowCard({ show, onClick }: MobileShowCardProps) {
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

  // Get stimulation level text
  const getStimulationLabel = (score: number) => {
    switch (score) {
      case 1: return 'Low Stimulation';
      case 2: return 'Low-Medium Stimulation';
      case 3: return 'Medium Stimulation';
      case 4: return 'Medium-High Stimulation';
      case 5: return 'High Stimulation';
      default: return 'Unknown Stimulation';
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
          className={`w-2 h-2 rounded-full ${colorClass}`}
        />
      );
    }
    return dots;
  };

  return (
    <Link href={`/show/${show.id}`}>
      <Card 
        className="w-32 flex-shrink-0 cursor-pointer hover:shadow-md transition-shadow duration-200 border-0 bg-white"
        onClick={onClick}
      >
        <CardContent className="p-2">
          {/* Show Image */}
          <div className="aspect-[3/4] relative mb-2 rounded-lg overflow-hidden bg-gray-100">
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
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/>
              </svg>
            </div>
          </div>

          {/* Show Name */}
          <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2 leading-tight">
            {show.name}
          </h3>

          {/* Age Range Badge */}
          <Badge 
            variant="secondary" 
            className="text-xs mb-2 bg-green-100 text-green-800 hover:bg-green-100 px-2 py-0.5"
          >
            Ages {normalizedShow.ageRange}
          </Badge>

          {/* Stimulation Dots */}
          <div className="flex gap-1 mb-1">
            {renderStimulationDots(normalizedShow.stimulationScore)}
          </div>

          {/* Stimulation Level Text */}
          <p className="text-xs text-gray-600 leading-tight">
            {getStimulationLabel(normalizedShow.stimulationScore)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}