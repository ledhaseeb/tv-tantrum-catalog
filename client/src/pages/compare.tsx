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
import { getStimulationScoreColor } from "@/lib/showUtils";
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

  // Update to immediately add show when selected from dropdown
  const handleAddShow = (value: string) => {
    if (value && !selectedShowIds.includes(Number(value))) {
      setSelectedShowIds(prev => [...prev, Number(value)]);
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

  // Helper function to get level percentage for bar charts
  const getLevelPercentage = (level: string) => {
    switch(level) {
      case 'Low': return 20;
      case 'Limited': return 20;
      case 'Minimal': return 20;
      case 'Moderate-Low': return 40;
      case 'Moderate': return 60;
      case 'Moderate-High': return 80;
      case 'High': return 100;
      default: return 60;
    }
  };
  
  // Helper function to determine rating level based on text
  const getRatingLevel = (rating: string | null | undefined): number => {
    if (!rating) return 3; // Default to moderate
    
    if (rating.includes('Low-Moderate') || rating.includes('Low to Moderate')) {
      return 2;
    } else if (rating.includes('Moderate-Low')) {
      return 2;
    } else if (rating.includes('Moderate-High') || rating.includes('Moderate to High')) {
      return 4;
    } else if (rating.includes('Mod-High')) {
      return 4;
    } else if (rating === 'Low') {
      return 1;
    } else if (rating === 'Moderate') {
      return 3;
    } else if (rating === 'High') {
      return 5;
    } else if (rating === 'Limited') {
      return 1;
    } else if (rating === 'Minimal') {
      return 1;
    }
    
    return 3; // Default to moderate
  };
  
  // Function to render segmented bar like on the details page
  const renderSegmentedBar = (ratingText: string | null | undefined) => {
    const level = getRatingLevel(ratingText);
    const percentage = level * 20;
    
    return (
      <div className="w-full h-6 relative">
        <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden flex">
          {[1, 2, 3, 4, 5].map((segment) => {
            const color = 
              segment === 1 ? 'bg-green-500' : 
              segment === 2 ? 'bg-yellow-500' : 
              segment === 3 ? 'bg-orange-500' : 
              segment === 4 ? 'bg-orange-600' : 
              'bg-red-500';
            
            return (
              <div
                key={segment}
                className={`h-full w-1/5 ${segment <= level ? color : 'bg-gray-200'}`}
              />
            );
          })}
        </div>
        <div 
          className="absolute h-full flex items-center" 
          style={{ 
            width: '4px', 
            backgroundColor: 'black',
            left: `calc(${percentage}% - 2px)`,
            top: 0
          }}
        ></div>
      </div>
    );
  };

  // Helper function to get stimulation score dots
  const getStimulationScoreDots = (score: number) => {
    return (
      <div className="flex justify-center gap-1 mb-1">
        {[1, 2, 3, 4, 5].map((dot) => {
          let bgColor = '';
          if (dot <= 2) bgColor = 'bg-green-500';
          else if (dot <= 4) bgColor = 'bg-yellow-500';
          else bgColor = 'bg-red-500';
          
          return (
            <div 
              key={dot} 
              className={`w-4 h-4 rounded-full ${dot <= score ? bgColor : 'border border-gray-300'}`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" className="mr-4 text-primary" onClick={handleBackClick}>
            <i className="fas fa-arrow-left mr-2"></i> Back
          </Button>
          <h2 className="text-2xl font-heading font-bold">Compare Shows</h2>
        </div>
      </div>
      
      {isLoading ? (
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-8">
          <Skeleton className="h-96 w-full" />
        </div>
      ) : (
        <div>
          {/* Show selector area */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map((index) => {
              const show = selectedShows && selectedShows[index];
              return (
                <div key={index} className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex flex-col items-center">
                    <p className="text-sm text-gray-500 mb-2">Show {index + 1}</p>
                    {show ? (
                      <>
                        <div className="relative mb-2">
                          {show.imageUrl ? (
                            <img
                              src={show.imageUrl}
                              alt={show.name}
                              className="w-24 h-24 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                              <i className="fas fa-tv text-gray-400 text-2xl"></i>
                            </div>
                          )}
                          <button
                            onClick={() => handleRemoveShow(show.id)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                          >
                            <i className="fas fa-times text-xs"></i>
                          </button>
                        </div>
                        <p className="font-medium text-center">{show.name}</p>
                      </>
                    ) : (
                      <div className="w-full">
                        <Select
                          value={showToAdd}
                          onValueChange={(value) => handleAddShow(value)}
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select a show" />
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
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedShows && selectedShows.length > 0 ? (
            <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
              <h3 className="text-xl font-bold mb-6">Compare Shows</h3>
              
              {/* Comparison table with the modern layout */}
              <div className="grid grid-cols-[180px_1fr_1fr_1fr] gap-4 mb-8">
                <div className="font-medium">Feature</div>
                {selectedShows.map(show => (
                  <div key={show.id} className="font-medium text-center">{show.name}</div>
                ))}
                {selectedShows.length < 3 && (
                  <div className="font-medium text-center text-gray-400">-</div>
                )}
                
                {/* Target Age */}
                <div className="font-medium py-2">Target Age</div>
                {selectedShows.map(show => (
                  <div key={show.id} className="text-center py-2">{show.ageRange}</div>
                ))}
                {selectedShows.length < 3 && (
                  <div className="text-center py-2 text-gray-400">-</div>
                )}
                
                {/* Animation Style */}
                <div className="font-medium py-2">Animation Style</div>
                {selectedShows.map(show => (
                  <div key={show.id} className="text-center py-2">
                    {show.animationStyle || 'Traditional Animation'}
                  </div>
                ))}
                {selectedShows.length < 3 && (
                  <div className="text-center py-2 text-gray-400">-</div>
                )}
                
                {/* Themes */}
                <div className="font-medium py-2">Themes</div>
                {selectedShows.map(show => (
                  <div key={show.id} className="flex flex-wrap justify-center gap-1 py-2">
                    {show.themes && show.themes.map((theme, index) => (
                      <Badge key={index} className="bg-blue-100 text-blue-800 text-xs font-medium">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                ))}
                {selectedShows.length < 3 && (
                  <div className="text-center py-2 text-gray-400">-</div>
                )}
              </div>
              
              {/* Stimulation Score Comparison using dots */}
              <div className="mb-8">
                <h3 className="text-lg font-bold mb-4">Stimulation Score Comparison</h3>
                <div className="grid grid-cols-[180px_1fr_1fr_1fr] gap-4">
                  <div></div>
                  {selectedShows.map(show => (
                    <div key={show.id} className="font-medium text-center">{show.name}</div>
                  ))}
                  {selectedShows.length < 3 && (
                    <div className="font-medium text-center text-gray-400">-</div>
                  )}
                  
                  <div className="font-medium py-2">Stimulation Score</div>
                  {selectedShows.map(show => (
                    <div key={show.id} className="flex flex-col items-center py-2">
                      {getStimulationScoreDots(show.stimulationScore)}
                      <div className="text-center text-sm font-medium">
                        {show.stimulationScore}/5
                      </div>
                    </div>
                  ))}
                  {selectedShows.length < 3 && (
                    <div className="text-center py-2 text-gray-400">-</div>
                  )}
                </div>
              </div>
              
              {/* Sensory Metrics with Bar Charts */}
              <div className="mb-4">
                <h3 className="text-lg font-bold mb-4">Sensory Metrics Comparison</h3>
                
                <div className="grid grid-cols-[180px_1fr_1fr_1fr] gap-4 mb-3">
                  <div></div>
                  {selectedShows.map(show => (
                    <div key={show.id} className="font-medium text-center">{show.name}</div>
                  ))}
                  {selectedShows.length < 3 && (
                    <div className="font-medium text-center text-gray-400">-</div>
                  )}
                </div>
                
                {/* Interactivity Level */}
                <div className="mb-6">
                  <div className="grid grid-cols-[180px_1fr_1fr_1fr] gap-4">
                    <div className="font-medium">Interaction Level:</div>
                    {selectedShows.map(show => (
                      <div key={show.id} className="flex flex-col">
                        <div className="flex justify-end mb-1">
                          <span className="text-sm font-medium">{show.interactivityLevel || 'Moderate'}</span>
                        </div>
                        {renderSegmentedBar(show.interactivityLevel)}
                      </div>
                    ))}
                    {selectedShows.length < 3 && (
                      <div className="flex items-center justify-center">
                        <div className="text-gray-400">-</div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Dialogue Intensity */}
                <div className="mb-6">
                  <div className="grid grid-cols-[180px_1fr_1fr_1fr] gap-4">
                    <div className="font-medium">Dialogue Intensity:</div>
                    {selectedShows.map(show => (
                      <div key={show.id} className="flex flex-col">
                        <div className="flex justify-end mb-1">
                          <span className="text-sm font-medium">{show.dialogueIntensity || 'Moderate'}</span>
                        </div>
                        {renderSegmentedBar(show.dialogueIntensity)}
                      </div>
                    ))}
                    {selectedShows.length < 3 && (
                      <div className="flex items-center justify-center">
                        <div className="text-gray-400">-</div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Sound Effects Level */}
                <div className="mb-6">
                  <div className="grid grid-cols-[180px_1fr_1fr_1fr] gap-4">
                    <div className="font-medium">Sound Effects Level:</div>
                    {selectedShows.map(show => (
                      <div key={show.id} className="flex flex-col">
                        <div className="flex justify-end mb-1">
                          <span className="text-sm font-medium">{show.soundEffectsLevel || 'Moderate'}</span>
                        </div>
                        {renderSegmentedBar(show.soundEffectsLevel)}
                      </div>
                    ))}
                    {selectedShows.length < 3 && (
                      <div className="flex items-center justify-center">
                        <div className="text-gray-400">-</div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Scene Frequency */}
                <div className="mb-6">
                  <div className="grid grid-cols-[180px_1fr_1fr_1fr] gap-4">
                    <div className="font-medium">Scene Frequency:</div>
                    {selectedShows.map(show => (
                      <div key={show.id} className="flex flex-col">
                        <div className="flex justify-end mb-1">
                          <span className="text-sm font-medium">{show.sceneFrequency || 'Moderate'}</span>
                        </div>
                        {renderSegmentedBar(show.sceneFrequency)}
                      </div>
                    ))}
                    {selectedShows.length < 3 && (
                      <div className="flex items-center justify-center">
                        <div className="text-gray-400">-</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Music Tempo */}
                <div className="mb-6">
                  <div className="grid grid-cols-[180px_1fr_1fr_1fr] gap-4">
                    <div className="font-medium">Music Tempo:</div>
                    {selectedShows.map(show => (
                      <div key={show.id} className="flex flex-col">
                        <div className="flex justify-end mb-1">
                          <span className="text-sm font-medium">{show.musicTempo || 'Moderate'}</span>
                        </div>
                        {renderSegmentedBar(show.musicTempo)}
                      </div>
                    ))}
                    {selectedShows.length < 3 && (
                      <div className="flex items-center justify-center">
                        <div className="text-gray-400">-</div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Total Music Level */}
                <div className="mb-6">
                  <div className="grid grid-cols-[180px_1fr_1fr_1fr] gap-4">
                    <div className="font-medium">Total Music Level:</div>
                    {selectedShows.map(show => (
                      <div key={show.id} className="flex flex-col">
                        <div className="flex justify-end mb-1">
                          <span className="text-sm font-medium">{show.totalMusicLevel || 'Moderate'}</span>
                        </div>
                        {renderSegmentedBar(show.totalMusicLevel)}
                      </div>
                    ))}
                    {selectedShows.length < 3 && (
                      <div className="flex items-center justify-center">
                        <div className="text-gray-400">-</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-xl shadow-md">
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
    </main>
  );
}
