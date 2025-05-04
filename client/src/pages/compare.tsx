import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import RatingBar from "@/components/RatingBar";
import { TvShow } from "@shared/schema";

export default function Compare() {
  const [_, setLocation] = useLocation();
  const [selectedShowIds, setSelectedShowIds] = useState<number[]>([]);
  const [showToAdd, setShowToAdd] = useState<string>("");

  // Fetch all TV shows for the selector
  const { data: allShows, isLoading: loadingShows } = useQuery<TvShow[]>({
    queryKey: ['/api/shows'],
  });

  // Fetch details for selected shows
  const { data: selectedShows, isLoading: loadingSelected } = useQuery<TvShow[]>({
    queryKey: ['/api/shows', { ids: selectedShowIds }],
    enabled: selectedShowIds.length > 0,
    select: (data) => {
      return data.filter(show => selectedShowIds.includes(show.id));
    }
  });

  const handleBackClick = () => {
    setLocation("/");
  };

  const handleRemoveShow = (id: number) => {
    setSelectedShowIds(prev => prev.filter(showId => showId !== id));
  };

  const handleAddShow = () => {
    if (showToAdd && !selectedShowIds.includes(Number(showToAdd))) {
      setSelectedShowIds(prev => [...prev, Number(showToAdd)]);
      setShowToAdd("");
    }
  };

  // Load comparison data from localStorage on component mount
  useEffect(() => {
    const savedComparison = localStorage.getItem('tvShowComparison');
    if (savedComparison) {
      try {
        const parsed = JSON.parse(savedComparison);
        if (Array.isArray(parsed)) {
          setSelectedShowIds(parsed);
        }
      } catch (e) {
        console.error("Error parsing saved comparison data", e);
      }
    }
  }, []);

  // Save comparison to localStorage when it changes
  useEffect(() => {
    if (selectedShowIds.length > 0) {
      localStorage.setItem('tvShowComparison', JSON.stringify(selectedShowIds));
    }
  }, [selectedShowIds]);

  const isLoading = loadingShows || loadingSelected;

  // Get available shows that aren't already in the comparison
  const availableShows = allShows?.filter(
    show => !selectedShowIds.includes(show.id)
  );

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center">
        <Button variant="ghost" className="mr-4 text-primary" onClick={handleBackClick}>
          <i className="fas fa-arrow-left mr-2"></i> Back to Shows
        </Button>
        <h2 className="text-2xl font-heading font-bold">Compare Shows</h2>
      </div>
      
      {isLoading ? (
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-8">
          <Skeleton className="h-96 w-full" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden overflow-x-auto">
          {selectedShows && selectedShows.length > 0 ? (
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="py-4 px-6 font-heading font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 sticky left-0 bg-gray-50">
                    Features
                  </th>
                  
                  {selectedShows.map(show => (
                    <th key={show.id} className="py-4 px-6 font-heading font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      <div className="flex flex-col items-center">
                        {show.imageUrl ? (
                          <img 
                            className="w-20 h-20 object-cover rounded-full mb-2" 
                            src={show.imageUrl} 
                            alt={show.name}
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gray-200 rounded-full mb-2 flex items-center justify-center">
                            <i className="fas fa-tv text-gray-400 text-xl"></i>
                          </div>
                        )}
                        <span>{show.name}</span>
                        <button 
                          className="mt-1 text-sm text-red-500 hover:text-red-700"
                          onClick={() => handleRemoveShow(show.id)}
                        >
                          <i className="fas fa-times"></i> Remove
                        </button>
                      </div>
                    </th>
                  ))}
                  
                  <th className="py-4 px-6 font-heading font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center mb-2">
                        <i className="fas fa-plus text-gray-400 text-2xl"></i>
                      </div>
                      <div className="w-40">
                        <Select 
                          value={showToAdd} 
                          onValueChange={setShowToAdd}
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Add Show" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableShows && availableShows.length > 0 ? (
                              availableShows.map(show => (
                                <SelectItem key={show.id} value={String(show.id)}>
                                  {show.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-shows" disabled>
                                No more shows available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        {showToAdd && (
                          <Button 
                            size="sm" 
                            className="w-full mt-2"
                            onClick={handleAddShow}
                          >
                            Add
                          </Button>
                        )}
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Age Range */}
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-6 font-medium sticky left-0 bg-white">Age Range</td>
                  {selectedShows.map(show => (
                    <td key={show.id} className="py-4 px-6 text-center">{show.ageRange} years</td>
                  ))}
                  <td className="py-4 px-6 text-center">-</td>
                </tr>
                
                {/* Episode Length */}
                <tr className="border-b border-gray-200 bg-gray-50">
                  <td className="py-4 px-6 font-medium sticky left-0 bg-gray-50">Episode Length</td>
                  {selectedShows.map(show => (
                    <td key={show.id} className="py-4 px-6 text-center">{show.episodeLength} minutes</td>
                  ))}
                  <td className="py-4 px-6 text-center">-</td>
                </tr>
                
                {/* Tantrum Factor */}
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-6 font-medium sticky left-0 bg-white">Tantrum Factor</td>
                  {selectedShows.map(show => (
                    <td key={show.id} className="py-4 px-6">
                      <div className="flex flex-col items-center">
                        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-1">
                          <div 
                            className={`h-full ${show.tantrumFactor <= 3 ? 'bg-green-500' : show.tantrumFactor <= 7 ? 'bg-yellow-500' : 'bg-red-500'} rounded-full`} 
                            style={{ width: `${show.tantrumFactor * 10}%` }}
                          ></div>
                        </div>
                        <span className={`${show.tantrumFactor <= 3 ? 'text-green-600' : show.tantrumFactor <= 7 ? 'text-yellow-600' : 'text-red-600'} font-medium`}>
                          {show.tantrumFactor}/10
                        </span>
                      </div>
                    </td>
                  ))}
                  <td className="py-4 px-6 text-center">-</td>
                </tr>
                
                {/* Educational Value */}
                <tr className="border-b border-gray-200 bg-gray-50">
                  <td className="py-4 px-6 font-medium sticky left-0 bg-gray-50">Educational Value</td>
                  {selectedShows.map(show => (
                    <td key={show.id} className="py-4 px-6">
                      <div className="flex flex-col items-center">
                        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-1">
                          <div 
                            className={`h-full ${show.educationalValue >= 8 ? 'bg-primary' : show.educationalValue >= 5 ? 'bg-secondary-500' : 'bg-red-500'} rounded-full`} 
                            style={{ width: `${show.educationalValue * 10}%` }}
                          ></div>
                        </div>
                        <span className={`${show.educationalValue >= 8 ? 'text-primary-600' : show.educationalValue >= 5 ? 'text-secondary-600' : 'text-red-600'} font-medium`}>
                          {show.educationalValue}/10
                        </span>
                      </div>
                    </td>
                  ))}
                  <td className="py-4 px-6 text-center">-</td>
                </tr>
                
                {/* Parent Enjoyment */}
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-6 font-medium sticky left-0 bg-white">Parent Enjoyment</td>
                  {selectedShows.map(show => (
                    <td key={show.id} className="py-4 px-6">
                      <div className="flex flex-col items-center">
                        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-1">
                          <div 
                            className={`h-full ${show.parentEnjoyment >= 8 ? 'bg-primary' : show.parentEnjoyment >= 5 ? 'bg-secondary-500' : 'bg-red-500'} rounded-full`} 
                            style={{ width: `${show.parentEnjoyment * 10}%` }}
                          ></div>
                        </div>
                        <span className={`${show.parentEnjoyment >= 8 ? 'text-primary-600' : show.parentEnjoyment >= 5 ? 'text-secondary-600' : 'text-red-600'} font-medium`}>
                          {show.parentEnjoyment}/10
                        </span>
                      </div>
                    </td>
                  ))}
                  <td className="py-4 px-6 text-center">-</td>
                </tr>
                
                {/* Repeat Watchability */}
                <tr className="border-b border-gray-200 bg-gray-50">
                  <td className="py-4 px-6 font-medium sticky left-0 bg-gray-50">Repeat Watchability</td>
                  {selectedShows.map(show => (
                    <td key={show.id} className="py-4 px-6">
                      <div className="flex flex-col items-center">
                        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-1">
                          <div 
                            className={`h-full ${show.repeatWatchability >= 8 ? 'bg-primary' : show.repeatWatchability >= 5 ? 'bg-secondary-500' : 'bg-red-500'} rounded-full`} 
                            style={{ width: `${show.repeatWatchability * 10}%` }}
                          ></div>
                        </div>
                        <span className={`${show.repeatWatchability >= 8 ? 'text-primary-600' : show.repeatWatchability >= 5 ? 'text-secondary-600' : 'text-red-600'} font-medium`}>
                          {show.repeatWatchability}/10
                        </span>
                      </div>
                    </td>
                  ))}
                  <td className="py-4 px-6 text-center">-</td>
                </tr>
                
                {/* Available On */}
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-6 font-medium sticky left-0 bg-white">Available On</td>
                  {selectedShows.map(show => (
                    <td key={show.id} className="py-4 px-6">
                      <div className="flex flex-wrap justify-center gap-1">
                        {show.availableOn.map((platform, index) => (
                          <Badge key={index} variant="outline" className="bg-gray-100 text-gray-800 text-xs font-medium">
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    </td>
                  ))}
                  <td className="py-4 px-6 text-center">-</td>
                </tr>
                
                {/* Overall Rating */}
                <tr className="border-b border-gray-200 bg-gray-50">
                  <td className="py-4 px-6 font-medium sticky left-0 bg-gray-50">Overall Rating</td>
                  {selectedShows.map(show => (
                    <td key={show.id} className="py-4 px-6 text-center">
                      <div className="flex justify-center">
                        {[...Array(5)].map((_, i) => (
                          <i 
                            key={i} 
                            className={`${i < Math.floor(show.overallRating) 
                              ? 'fas fa-star' 
                              : i < Math.floor(show.overallRating) + 0.5 
                                ? 'fas fa-star-half-alt' 
                                : 'far fa-star'} text-secondary-500`}
                          ></i>
                        ))}
                      </div>
                      <span className="font-bold text-lg">{show.overallRating}/5</span>
                    </td>
                  ))}
                  <td className="py-4 px-6 text-center">-</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center">
              <div className="mb-4 text-gray-400">
                <i className="fas fa-search text-5xl"></i>
              </div>
              <h3 className="text-xl font-heading font-bold mb-2">No Shows Selected for Comparison</h3>
              <p className="text-gray-600 mb-4">
                Add shows to compare their features side by side.
              </p>
              <Button onClick={handleBackClick}>
                Browse Shows
              </Button>
            </div>
          )}
        </div>
      )}
      
      {selectedShows && selectedShows.length > 0 && (
        <div className="mt-6 flex">
          <Button className="mr-4">
            Save Comparison
          </Button>
          <Button variant="outline">
            <i className="fas fa-share-alt mr-1"></i> Share
          </Button>
          <Button variant="outline" className="ml-auto">
            <i className="fas fa-print mr-1"></i> Print
          </Button>
        </div>
      )}
    </main>
  );
}
