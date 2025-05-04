interface RatingBarProps {
  value: number;
  max: number;
  colorClass?: string;
  height?: string;
}

export default function RatingBar({ 
  value, 
  max, 
  colorClass = "bg-primary", 
  height = "h-2" 
}: RatingBarProps) {
  const percentage = (value / max) * 100;
  
  return (
    <div className={`w-24 ${height} bg-gray-200 rounded-full overflow-hidden`}>
      <div 
        className={`h-full ${colorClass} rounded-full`} 
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
}
