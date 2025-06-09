import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TvShow } from "@shared/schema";
import { TvShowCardImage } from "@/components/ui/tv-show-image";
import { Link } from "wouter";

interface BaseShowCardProps {
  show: TvShow;
  onClick?: () => void;
}

// Standardized card dimensions and styles
const CARD_VARIANTS = {
  // Mobile portrait cards - consistent 4:3 ratio
  mobileGrid: {
    container: "h-80 w-56", // Fixed dimensions
    image: "h-44", // ~55% of total height
    content: "h-36", // ~45% of total height
    title: "text-sm font-bold line-clamp-2",
    badge: "text-xs",
    themes: 1, // Max themes to show
  },
  
  // Desktop grid cards - true portrait ratio (taller than wide)
  desktopGrid: {
    container: "h-[500px] w-56", // Portrait: taller than wide
    image: "h-80", // Tall portrait image area
    content: "h-32", // Compact content area
    title: "text-sm font-bold line-clamp-2",
    badge: "text-xs",
    themes: 1, // Max themes to show in compact space
  },
  
  // List view cards - responsive horizontal layout
  list: {
    container: "min-h-32", // Flexible height
    image: "w-24 h-32 sm:w-28 sm:h-36", // Fixed image size
    content: "flex-grow",
    title: "text-lg font-bold",
    badge: "text-sm",
    themes: 4, // Max themes to show
  },
  
  // Category page cards - compact grid
  categoryGrid: {
    container: "h-72 w-48", // Smaller fixed dimensions
    image: "h-40", // ~55% of total height
    content: "h-32", // ~45% of total height
    title: "text-sm font-bold line-clamp-1",
    badge: "text-xs",
    themes: 1, // Max themes to show
  }
};

export function MobileGridShowCard({ show, onClick }: BaseShowCardProps) {
  const variant = CARD_VARIANTS.mobileGrid;
  const normalizedShow = normalizeShowData(show);
  
  return (
    <Link href={`/show/${show.id}`}>
      <Card className={`bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer flex flex-col hover:shadow-md transition-shadow ${variant.container} flex-shrink-0`}>
        <div className={`relative ${variant.image} overflow-hidden bg-gray-50`}>
          <TvShowCardImage
            showId={show.id}
            showName={show.name}
            originalUrl={normalizedShow.imageUrl}
            className="w-full h-full object-contain"
            isInteractive={false}
          />
        </div>
        
        <CardContent className={`p-3 flex flex-col ${variant.content}`}>
          <h3 className={`${variant.title} mb-2`}>{show.name}</h3>
          
          <Badge variant="outline" className={`bg-green-50 text-green-700 ${variant.badge} border-green-100 mb-2 w-fit`}>
            Ages {normalizedShow.ageRange}
          </Badge>
          
          {show.themes && show.themes.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {show.themes.slice(0, variant.themes).map((theme, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className={`${variant.badge} ${getThemeColor(theme)}`}
                >
                  {theme}
                </Badge>
              ))}
              {show.themes.length > variant.themes && (
                <Badge variant="outline" className={variant.badge}>
                  +{show.themes.length - variant.themes}
                </Badge>
              )}
            </div>
          )}
          
          <div className="mt-auto">
            <StimulationIndicator score={normalizedShow.stimulationScore} compact />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function DesktopGridShowCard({ show, onClick }: BaseShowCardProps) {
  const variant = CARD_VARIANTS.desktopGrid;
  const normalizedShow = normalizeShowData(show);
  
  return (
    <Link href={`/show/${show.id}`}>
      <Card className={`bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer flex flex-col hover:shadow-md transition-shadow ${variant.container}`}>
        <div className={`relative ${variant.image} overflow-hidden bg-gray-50`}>
          <TvShowCardImage
            showId={show.id}
            showName={show.name}
            originalUrl={normalizedShow.imageUrl}
            className="w-full h-full object-contain"
            isInteractive={false}
          />
        </div>
        
        <CardContent className={`p-4 flex flex-col ${variant.content}`}>
          <h3 className={`${variant.title} mb-3`}>{show.name}</h3>
          
          <Badge variant="outline" className={`bg-green-50 text-green-700 ${variant.badge} border-green-100 mb-3 w-fit`}>
            Ages {normalizedShow.ageRange}
          </Badge>
          
          {show.themes && show.themes.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {show.themes.slice(0, variant.themes).map((theme, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className={`${variant.badge} ${getThemeColor(theme)}`}
                >
                  {theme}
                </Badge>
              ))}
              {show.themes.length > variant.themes && (
                <Badge variant="outline" className={variant.badge}>
                  +{show.themes.length - variant.themes}
                </Badge>
              )}
            </div>
          )}
          
          <div className="mt-auto">
            <StimulationIndicator score={normalizedShow.stimulationScore} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function ListViewShowCard({ show, onClick }: BaseShowCardProps) {
  const variant = CARD_VARIANTS.list;
  const normalizedShow = normalizeShowData(show);
  
  return (
    <Link href={`/show/${show.id}`}>
      <Card className={`hover:shadow-lg transition-shadow duration-300 cursor-pointer ${variant.container}`}>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-shrink-0">
              <TvShowCardImage
                showId={show.id}
                showName={show.name}
                originalUrl={normalizedShow.imageUrl}
                className={variant.image}
                isInteractive={false}
              />
            </div>
            
            <div className={`${variant.content} min-w-0`}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2">
                <h3 className={`${variant.title} text-gray-900 mb-1`}>{show.name}</h3>
                <Badge variant="outline" className={`bg-green-50 text-green-700 ${variant.badge} border-green-100`}>
                  Ages {normalizedShow.ageRange}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                {show.description}
              </p>
              
              {show.themes && show.themes.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {show.themes.slice(0, variant.themes).map((theme, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className={`text-xs ${getThemeColor(theme)}`}
                    >
                      {theme}
                    </Badge>
                  ))}
                  {show.themes.length > variant.themes && (
                    <Badge variant="outline" className="text-xs">
                      +{show.themes.length - variant.themes} more
                    </Badge>
                  )}
                </div>
              )}
              
              <div className="mt-auto">
                <StimulationIndicator score={normalizedShow.stimulationScore} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function CategoryGridShowCard({ show, onClick }: BaseShowCardProps) {
  const variant = CARD_VARIANTS.categoryGrid;
  const normalizedShow = normalizeShowData(show);
  
  return (
    <Link href={`/show/${show.id}`}>
      <Card className={`bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer flex flex-col hover:shadow-md transition-shadow ${variant.container}`}>
        <div className={`relative ${variant.image} overflow-hidden bg-gray-50`}>
          <TvShowCardImage
            showId={show.id}
            showName={show.name}
            originalUrl={normalizedShow.imageUrl}
            className="w-full h-full object-contain"
            isInteractive={false}
          />
        </div>
        
        <CardContent className={`p-3 flex flex-col ${variant.content}`}>
          <h3 className={`${variant.title} mb-2`}>{show.name}</h3>
          
          <Badge variant="outline" className={`bg-green-50 text-green-700 ${variant.badge} border-green-100 mb-2 w-fit`}>
            Ages {normalizedShow.ageRange}
          </Badge>
          
          <div className="mt-auto">
            <StimulationIndicator score={normalizedShow.stimulationScore} compact />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Shared utility functions
function normalizeShowData(show: TvShow) {
  return {
    ...show,
    imageUrl: show.imageUrl || (show as any).image_url,
    ageRange: show.ageRange || (show as any).age_range || 'Unknown',
    stimulationScore: show.stimulationScore || (show as any).stimulation_score || 0
  };
}

function getThemeColor(theme: string) {
  const lowerTheme = theme.toLowerCase();
  if (lowerTheme.includes('friendship')) return 'bg-cyan-100 text-cyan-800';
  if (lowerTheme.includes('family')) return 'bg-green-100 text-green-800';
  if (lowerTheme.includes('adventure')) return 'bg-orange-100 text-orange-800';
  if (lowerTheme.includes('music')) return 'bg-purple-100 text-purple-800';
  if (lowerTheme.includes('science')) return 'bg-blue-100 text-blue-800';
  if (lowerTheme.includes('art')) return 'bg-pink-100 text-pink-800';
  if (lowerTheme.includes('problem')) return 'bg-yellow-100 text-yellow-800';
  return 'bg-gray-100 text-gray-800';
}

interface StimulationIndicatorProps {
  score: number;
  compact?: boolean;
}

function StimulationIndicator({ score, compact = false }: StimulationIndicatorProps) {
  const getStimulationText = (score: number) => {
    switch (score) {
      case 1: return 'Low';
      case 2: return 'Low-Mid';
      case 3: return 'Medium';
      case 4: return 'Mid-High';
      case 5: return 'High';
      default: return 'Unknown';
    }
  };

  const stimulationText = getStimulationText(score || 3);
  const normalizedScore = score || 3;
  
  return (
    <div className="w-full">
      {!compact && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-bold text-gray-800">Stimulation Level</span>
        </div>
      )}
      
      <div className="flex justify-center gap-1 mb-1">
        {[1, 2, 3, 4, 5].map((dot) => {
          let bgColor = '';
          if (dot === 1) bgColor = 'bg-green-500';
          else if (dot === 2) bgColor = 'bg-green-400';
          else if (dot === 3) bgColor = 'bg-yellow-500';
          else if (dot === 4) bgColor = 'bg-orange-500';
          else bgColor = 'bg-red-500';
          
          return (
            <div 
              key={dot} 
              className={`${compact ? 'w-2 h-2' : 'w-3 h-3'} rounded-full ${dot <= normalizedScore ? bgColor : 'border border-gray-300'}`}
            />
          );
        })}
      </div>
      
      <div className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-center`}>
        {stimulationText}
      </div>
    </div>
  );
}

// Legacy ShowCard component that maintains backward compatibility
interface LegacyShowCardProps {
  show: TvShow;
  viewMode: "grid" | "list";
  onClick: () => void;
  isMobile?: boolean;
}

export default function ShowCard({ show, viewMode, onClick, isMobile = false }: LegacyShowCardProps) {
  if (isMobile && viewMode === "grid") {
    return <MobileGridShowCard show={show} onClick={onClick} />;
  }
  
  if (viewMode === "list") {
    return <ListViewShowCard show={show} onClick={onClick} />;
  }
  
  // Desktop grid
  return <DesktopGridShowCard show={show} onClick={onClick} />;
}