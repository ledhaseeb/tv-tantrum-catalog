import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TvShow } from "@shared/schema";
import { TvShowCardImage } from "@/components/ui/tv-show-image";
import { Link } from "wouter";

interface DynamicShowCardProps {
  show: TvShow;
  onClick?: () => void;
  config: {
    totalHeight: string;
    totalWidth: string;
    imageHeight: string;
    contentHeight: string;
    contentPadding: string;
    titleSize: string;
    badgeSize: string;
    maxThemes: number;
  };
}

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

function StimulationIndicator({ score }: { score: number }) {
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
              className={`w-3 h-3 rounded-full ${dot <= normalizedScore ? bgColor : 'border border-gray-300'}`}
            />
          );
        })}
      </div>
      
      <div className="text-sm font-semibold text-center">
        {stimulationText}
      </div>
    </div>
  );
}

export function DynamicShowCard({ show, onClick, config }: DynamicShowCardProps) {
  const normalizedShow = normalizeShowData(show);
  
  return (
    <Link href={`/show/${show.id}`}>
      <Card className={`bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer flex flex-col hover:shadow-md transition-shadow ${config.totalHeight} ${config.totalWidth}`}>
        <div className={`relative ${config.imageHeight} overflow-hidden bg-gray-50`}>
          <TvShowCardImage
            showId={show.id}
            showName={show.name}
            originalUrl={normalizedShow.imageUrl}
            className="w-full h-full object-contain"
            isInteractive={false}
          />
        </div>
        
        <CardContent className={`${config.contentPadding} flex flex-col ${config.contentHeight}`}>
          <h3 className={`${config.titleSize} font-bold line-clamp-2 mb-3`}>{show.name}</h3>
          
          <Badge variant="outline" className={`bg-green-50 text-green-700 ${config.badgeSize} border-green-100 mb-3 w-fit`}>
            Ages {normalizedShow.ageRange}
          </Badge>
          
          {show.themes && show.themes.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {show.themes.slice(0, config.maxThemes).map((theme, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className={`${config.badgeSize} ${getThemeColor(theme)}`}
                >
                  {theme}
                </Badge>
              ))}
              {show.themes.length > config.maxThemes && (
                <Badge variant="outline" className={config.badgeSize}>
                  +{show.themes.length - config.maxThemes}
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