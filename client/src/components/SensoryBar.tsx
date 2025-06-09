interface SensoryBarProps {
  level: string | null | undefined;
  className?: string;
}

export default function SensoryBar({ level, className = "" }: SensoryBarProps) {
  // Convert sensory level text to percentage
  const getSensoryLevelPercentage = (level: string | null | undefined) => {
    if (!level) return 60; // Default to moderate
    const normalizedLevel = level.toLowerCase().trim();
    
    switch (normalizedLevel) {
      case 'very low':
      case 'very-low':
      case 'low':
      case 'minimal':
      case 'limited':
        return 20;
      case 'low-moderate':
      case 'low moderate':
      case 'moderate-low':
        return 40;
      case 'moderate':
        return 60;
      case 'moderate-high':
      case 'moderate high':
      case 'mod-high':
        return 80;
      case 'high':
      case 'very high':
      case 'very-high':
        return 100;
      default:
        return 60; // Default to moderate if unknown
    }
  };

  const percentage = getSensoryLevelPercentage(level);

  return (
    <div className={`w-full bg-gray-200 rounded-full h-4 relative overflow-hidden ${className}`}>
      {/* Smooth gradient background showing full spectrum */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-lime-400 via-yellow-500 via-orange-500 to-red-500 h-4 rounded-full"></div>
      
      {/* Gray overlay to mask unused portion */}
      <div 
        className="absolute top-0 right-0 bg-gray-200 h-4 rounded-r-full transition-all duration-300"
        style={{ width: `${100 - percentage}%` }}
      ></div>
      
      {/* Optional indicator line at current level */}
      <div 
        className="absolute top-0 w-0.5 h-4 bg-gray-800 transition-all duration-300"
        style={{ left: `calc(${percentage}% - 1px)` }}
      ></div>
    </div>
  );
}