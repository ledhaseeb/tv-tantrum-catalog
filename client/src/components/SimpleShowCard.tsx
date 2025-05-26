import { TvShow } from "@shared/schema";

interface SimpleShowCardProps {
  show: TvShow;
  onClick: () => void;
}

export default function SimpleShowCard({ show, onClick }: SimpleShowCardProps) {
  console.log('SimpleShowCard received:', show);
  
  return (
    <div 
      className="bg-white border rounded-lg p-4 cursor-pointer hover:shadow-md"
      onClick={onClick}
    >
      <h3 className="font-bold text-lg">{show.name || 'No Name'}</h3>
      <p className="text-sm text-gray-600">Ages: {show.ageRange || 'Unknown'}</p>
      <p className="text-sm text-gray-600">Score: {show.stimulationScore || 0}/5</p>
      <button className="mt-2 bg-yellow-500 text-white px-4 py-2 rounded">
        Learn More
      </button>
    </div>
  );
}