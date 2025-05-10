import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import ShowCard from "@/components/ShowCard";
import { TvShow } from "@shared/schema";
import { Heart, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function Home() {
  const [_, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user, toggleFavorite } = useAuth();
  const { toast } = useToast();
  
  // Hide results when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowResults(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);
  
  // Effect to detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 640; // sm breakpoint in Tailwind
      setIsMobile(isMobileView);
    };
    
    // Check initially
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Fetch all TV shows
  const { data: allShows, isLoading: allShowsLoading } = useQuery<TvShow[]>({
    queryKey: ['/api/shows'],
    staleTime: 60000, // 1 minute
  });
  
  // Fetch popular shows from our tracking data
  const { data: popularShowsData, isLoading: popularShowsLoading } = useQuery<TvShow[]>({
    queryKey: ['/api/shows/popular'],
    staleTime: 60000, // 1 minute
  });
  
  // Combined loading state
  const isLoading = allShowsLoading || popularShowsLoading;
  
  // Find a featured show (using something with good data for demonstration)
  const featuredShow = allShows?.find(show => 
    show.name.includes("Brambly") || 
    (show.themes?.includes("Adventure") && show.themes?.includes("Fantasy"))
  ) || allShows?.[0];
  
  // Filter shows by categories - ensure at least 12 shows per category
  const lowStimulationShows = allShows?.filter(show => show.stimulationScore <= 2).slice(0, 12);
  // Using stimulation score as a proxy for ratings since overallRating is not in the schema
  const highlyRatedShows = allShows?.filter(show => 
    (show.stimulationScore <= 3 && show.themes && show.themes.length >= 3) || 
    (show.stimulationScore <= 2)
  ).slice(0, 12);
  const popularShows = popularShowsData?.slice(0, 12) || allShows?.slice(0, 12); // Use our tracked popular shows data
  const highInteractionShows = allShows?.filter(
    show => show.interactivityLevel === 'High' || show.interactivityLevel === 'Moderate-High'
  ).slice(0, 12);
  
  // Find shows by popular themes - ensure at least 12 shows per category
  const educationalShows = allShows?.filter(show => 
    show.themes?.some(theme => theme.toLowerCase().includes('education') || theme.toLowerCase().includes('learning'))
  ).slice(0, 12);
  
  const adventureShows = allShows?.filter(show => 
    show.themes?.some(theme => theme.toLowerCase().includes('adventure'))
  ).slice(0, 12);
  
  const musicalShows = allShows?.filter(show => 
    show.themes?.some(theme => theme.toLowerCase().includes('music'))
  ).slice(0, 12);
  
  const fantasyShows = allShows?.filter(show => 
    show.themes?.some(theme => theme.toLowerCase().includes('fantasy'))
  ).slice(0, 12);
  
  const preschoolerShows = allShows?.filter(show => 
    show.ageRange?.toLowerCase().includes('preschool') || 
    (show.ageRange && parseInt(show.ageRange.split('-')[0]) <= 4)
  ).slice(0, 12);
  
  // Filter shows based on search term
  const filteredShows = allShows?.filter((show: TvShow) => {
    if (!searchQuery.trim()) return false;
    
    const searchLower = searchQuery.toLowerCase().trim();
    const nameLower = show.name.toLowerCase();
    
    // Direct match in name
    if (nameLower.includes(searchLower)) return true;
    
    // Handle shows with year ranges
    const nameWithoutYears = nameLower.replace(/\s+\d{4}(-\d{4}|-present)?/g, '');
    if (nameWithoutYears.includes(searchLower)) return true;
    
    // Match any part of a word
    const words = nameLower.split(/\s+/);
    if (words.some((word: string) => word.includes(searchLower))) return true;
    
    // Handle apostrophes and special characters
    const simplifiedName = nameLower.replace(/[''\.]/g, '');
    if (simplifiedName.includes(searchLower)) return true;
    
    return false;
  }).slice(0, 6);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // For all searches, direct to browse page with search filter
      setLocation(`/browse?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowResults(false);
    }
  };
  
  const handleShowCardClick = (id: number) => {
    setLocation(`/shows/${id}`);
  };
  
  const renderCategorySection = (title: string, description: string, shows: TvShow[] | undefined, viewAllLink: string) => (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-heading font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <Button 
          variant="link" 
          className="text-primary-600 hover:text-primary-800"
          onClick={() => setLocation(viewAllLink)}
        >
          View All →
        </Button>
      </div>
      
      {isLoading ? (
        // Placeholder loading state
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i} className="bg-gray-100 animate-pulse h-64"></Card>
          ))}
        </div>
      ) : shows?.length ? (
        <div className="relative">
          <Carousel
            opts={{
              align: "start",
              loop: true,
              dragFree: true,
              containScroll: "trimSnaps"
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {shows.map((show) => (
                <CarouselItem key={show.id} className={`pl-2 md:pl-4 ${isMobile ? 'basis-1/3' : 'md:basis-1/2 lg:basis-1/4'}`}>
                  <ShowCard 
                    show={show} 
                    viewMode="grid"
                    isMobile={isMobile}
                    onClick={() => handleShowCardClick(show.id)}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-end gap-2 mt-4">
              <CarouselPrevious className="static translate-y-0 mr-0" />
              <CarouselNext className="static translate-y-0" />
            </div>
          </Carousel>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No shows found in this category.
        </div>
      )}
    </section>
  );
  
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="bg-white rounded-xl p-8 mb-12 text-center">
        <h1 className="text-3xl md:text-4xl font-heading font-bold mb-3">
          Screen Time Stimulation Scores
        </h1>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Find TV shows measured by stimulation levels, helping you discover content
          that fits your child's needs.
        </p>
        
        <form onSubmit={handleSearch} className="relative max-w-md mx-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input 
                type="text" 
                placeholder="Search show by name, theme, platform..." 
                className="rounded-r-none pl-10"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  // Show results dropdown if there's text to search
                  if (e.target.value.trim().length > 0) {
                    setShowResults(true);
                  } else {
                    setShowResults(false);
                  }
                }}
                onFocus={() => {
                  if (searchQuery.trim().length > 0) {
                    setShowResults(true);
                  }
                }}
              />
              
              {/* Search Results Dropdown */}
              {showResults && searchQuery.trim().length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto border border-gray-200">
                  <div className="py-1">
                    {filteredShows?.length ? (
                      filteredShows.map((show: TvShow) => (
                        <div
                          key={show.id}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setSearchQuery(show.name);
                            setShowResults(false);
                            setLocation(`/browse?search=${encodeURIComponent(show.name)}`);
                          }}
                        >
                          <div className="font-medium">{show.name}</div>
                          <div className="text-xs text-gray-500">
                            Ages: {show.ageRange || 'Unknown'} 
                            {show.stimulationScore ? ` • Stimulation: ${show.stimulationScore}` : ''}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        No shows match your search
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <Button type="submit" className="rounded-l-none">
              <i className="fas fa-search mr-2"></i> Search
            </Button>
          </div>
        </form>
      </div>
      
      {/* Featured Show */}
      {featuredShow && (
        <div className="bg-indigo-50 rounded-xl overflow-hidden mb-12">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/3 p-6">
              <div className="mb-2">
                <Badge variant="outline" className="bg-purple-100 text-purple-800 uppercase text-xs font-bold tracking-wide">
                  Featured Listing
                </Badge>
              </div>
              {featuredShow.imageUrl ? (
                <img 
                  src={featuredShow.imageUrl} 
                  alt={featuredShow.name} 
                  className="w-full h-80 object-cover rounded-md shadow-lg"
                />
              ) : (
                <div className="w-full h-80 bg-gray-200 rounded-md shadow-lg flex items-center justify-center">
                  <i className="fas fa-tv text-gray-400 text-5xl"></i>
                </div>
              )}
            </div>
            
            <div className="md:w-2/3 p-6">
              <h2 className="text-2xl font-heading font-bold mb-2 text-gray-900">
                {featuredShow.name}
              </h2>
              <div className="mb-3">
                <Badge variant="outline" className="bg-green-100 text-green-800 mr-2">
                  Ages {featuredShow.ageRange}
                </Badge>
                <div className="inline-flex items-center">
                  <div className="flex items-center mr-2">
                    {Array(5).fill(0).map((_, i) => {
                      const scoreColors = [
                        'bg-green-500 border-green-500',    // green for 1
                        'bg-yellow-500 border-yellow-500',  // yellow for 2
                        'bg-orange-500 border-orange-500',  // orange for 3
                        'bg-orange-600 border-orange-600',  // dark orange for 4
                        'bg-red-500 border-red-500'         // red for 5
                      ];
                      const color = scoreColors[i];
                      const isActive = i < featuredShow.stimulationScore;
                      return (
                        <div 
                          key={i} 
                          className={`w-3 h-3 rounded-full mx-0.5 ${
                            isActive ? color.split(' ')[0] : `border-2 ${color.split(' ')[1]} bg-white`
                          }`}
                        />
                      );
                    })}
                  </div>
                  <span className="text-sm text-gray-600">
                    {featuredShow.stimulationScore === 1 ? 'Low' : 
                     featuredShow.stimulationScore === 2 ? 'Low-Medium' : 
                     featuredShow.stimulationScore === 3 ? 'Medium' : 
                     featuredShow.stimulationScore === 4 ? 'Medium-High' : 
                     'High'} Stimulation
                  </span>
                </div>
              </div>
              
              <p className="text-gray-700 mb-4">
                {featuredShow.description}
              </p>
              
              <div className="mb-4">
                <h3 className="font-medium text-gray-900 mb-2">Key Themes:</h3>
                <div className="flex flex-wrap gap-1">
                  {featuredShow.themes?.map((theme, index) => (
                    <Badge key={index} variant="outline" className="bg-gray-100 text-gray-800">
                      {theme}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-400 hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (user) {
                      toggleFavorite(featuredShow.id);
                    } else {
                      toast({
                        title: "Authentication required",
                        description: "Please log in or register to save shows to your favorites.",
                        variant: "default",
                      });
                      setLocation("/auth");
                    }
                  }}
                >
                  <Heart className="w-5 h-5 mr-1" />
                  Add to Favorites
                </Button>
                <Button 
                  className="mt-2" 
                  onClick={() => handleShowCardClick(featuredShow.id)}
                >
                  View Show Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Explore Categories */}
      <section className="mb-12">
        <h2 className="text-2xl font-heading font-bold mb-6 text-gray-900">Explore Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer bg-green-50" 
            onClick={() => setLocation(`/browse?stimulationScoreRange=${encodeURIComponent(JSON.stringify({min: 1, max: 2}))}`)}
          >
            <CardContent className="p-6 text-center">
              <div className="inline-flex p-3 rounded-full bg-green-100 text-green-600 mb-3">
                <i className="fas fa-leaf text-2xl"></i>
              </div>
              <h3 className="font-heading font-bold mb-2">Lower Stimulation</h3>
              <p className="text-sm text-gray-600">Shows with calm pacing for sensitive viewers (1-2)</p>
            </CardContent>
          </Card>
          
          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer bg-blue-50" 
            onClick={() => setLocation("/browse?sortBy=stimulationScore&sortDirection=asc")}
          >
            <CardContent className="p-6 text-center">
              <div className="inline-flex p-3 rounded-full bg-blue-100 text-blue-600 mb-3">
                <i className="fas fa-star text-2xl"></i>
              </div>
              <h3 className="font-heading font-bold mb-2">Highly Rated</h3>
              <p className="text-sm text-gray-600">Shows with top ratings from our parent reviewers</p>
            </CardContent>
          </Card>
          
          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer bg-purple-50" 
            onClick={() => setLocation("/browse?interactivityLevel=High")}
          >
            <CardContent className="p-6 text-center">
              <div className="inline-flex p-3 rounded-full bg-purple-100 text-purple-600 mb-3">
                <i className="fas fa-gamepad text-2xl"></i>
              </div>
              <h3 className="font-heading font-bold mb-2">Higher Interaction</h3>
              <p className="text-sm text-gray-600">Shows that encourage audience participation</p>
            </CardContent>
          </Card>
          
          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer bg-amber-50" 
            onClick={() => setLocation("/browse?sortBy=popular")}
          >
            <CardContent className="p-6 text-center">
              <div className="inline-flex p-3 rounded-full bg-amber-100 text-amber-600 mb-3">
                <i className="fas fa-fire text-2xl"></i>
              </div>
              <h3 className="font-heading font-bold mb-2">Popular</h3>
              <p className="text-sm text-gray-600">Shows our community watches and searches for the most</p>
            </CardContent>
          </Card>
        </div>
      </section>
      
      {/* Popular Shows */}
      {renderCategorySection(
        "Popular Shows", 
        "Most-viewed shows across all age groups", 
        popularShows, 
        "/browse"
      )}
      
      {/* Highly Rated */}
      {renderCategorySection(
        "Highly Rated Shows",
        "Top-rated shows across all categories", 
        highlyRatedShows,
        "/browse?sortBy=stimulationScore&sortDirection=asc"
      )}
      
      {/* Lower Stimulation */}
      {renderCategorySection(
        "Lower Stimulation (Scores 1-2)",
        "Calmer shows with gentle pacing, perfect for sensitive viewers", 
        lowStimulationShows, 
        `/browse?stimulationScoreRange=${encodeURIComponent(JSON.stringify({min: 1, max: 2}))}`
      )}
      
      {/* Higher Interaction */}
      {renderCategorySection(
        "Higher Interaction",
        "Shows that encourage audience participation and engagement", 
        highInteractionShows, 
        "/browse?interactivityLevel=High"
      )}
      
      {/* Educational Shows */}
      {educationalShows && educationalShows.length > 0 && renderCategorySection(
        "Educational Shows",
        "Shows that focus on learning and educational content", 
        educationalShows, 
        "/browse?search=education"
      )}
      
      {/* Adventure Shows */}
      {adventureShows && adventureShows.length > 0 && renderCategorySection(
        "Adventure Shows",
        "Shows focused on exploration, excitement and adventures", 
        adventureShows, 
        "/browse?search=adventure"
      )}
      
      {/* Musical Shows */}
      {musicalShows && musicalShows.length > 0 && renderCategorySection(
        "Musical Shows",
        "Shows featuring songs, musical numbers and rhythmic content", 
        musicalShows, 
        "/browse?search=music"
      )}
      
      {/* Fantasy Shows */}
      {fantasyShows && fantasyShows.length > 0 && renderCategorySection(
        "Fantasy Shows",
        "Shows with magical, imaginative and fantasy elements", 
        fantasyShows, 
        "/browse?search=fantasy"
      )}
      
      {/* Preschooler Shows */}
      {preschoolerShows && preschoolerShows.length > 0 && renderCategorySection(
        "Preschooler Favorites",
        "Shows specifically designed for children ages 2-4", 
        preschoolerShows, 
        "/browse?ageGroup=Preschool"
      )}
    </main>
  );
}