import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
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

// Badge progression system
const BADGE_PROGRESSION = [
  { name: "TV Watcher", emoji: "📺", points: 0 },
  { name: "Tablet Baby", emoji: "👶", points: 25 },
  { name: "TV Tamer", emoji: "🧑‍🧒", points: 50 },
  { name: "Algorithm Avoider", emoji: "🫷", points: 100 },
  { name: "Mood-Swing Mediator", emoji: "🧑‍⚖️", points: 200 },
  { name: "Rhythm Regulator", emoji: "🪪", points: 300 },
  { name: "Pixel Protector", emoji: "🥽", points: 400 },
  { name: "Screen-Time Sherpa", emoji: "🤝", points: 500 },
  { name: "Programme Peacekeeper", emoji: "✌️", points: 750 },
  { name: "Calm-Ware Engineer", emoji: "🧑‍🔧", points: 1000 },
  { name: "Digital Diplomat", emoji: "🧑‍💼", points: 1250 },
  { name: "Sensory Sentinel", emoji: "🦾", points: 1500 },
  { name: "Guardian of the Glow", emoji: "🥷", points: 1750 },
  { name: "Screen Sensei", emoji: "🧘", points: 2000 }
];

// Helper function to get badge emoji based on points
const getBadgeEmoji = (points: number) => {
  const sorted = [...BADGE_PROGRESSION].reverse();
  const badge = sorted.find(badge => points >= badge.points) || BADGE_PROGRESSION[0];
  return badge.emoji;
};

// Helper function to get badge name based on points
const getBadgeName = (points: number) => {
  const sorted = [...BADGE_PROGRESSION].reverse();
  const badge = sorted.find(badge => points >= badge.points) || BADGE_PROGRESSION[0];
  return badge.name;
};

export default function Home() {
  const [_, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user, toggleFavorite, isFavorite } = useAuth();
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
    queryKey: ['/api/tv-shows'],
    staleTime: 60000, // 1 minute
  });
  
  // Fetch popular shows from view count tracking data
  const { data: popularShowsData, isLoading: popularShowsLoading } = useQuery<TvShow[]>({
    queryKey: ['/api/shows/popular', { limit: 24 }],
    staleTime: 60000, // 1 minute
  });

  // Fetch highly rated shows from review data
  const { data: highlyRatedShowsData, isLoading: highlyRatedShowsLoading } = useQuery<TvShow[]>({
    queryKey: ['/api/shows/highly-rated', { limit: 24 }],
    staleTime: 60000, // 1 minute
  });
  
  // Combined loading state
  const isLoading = allShowsLoading || popularShowsLoading || highlyRatedShowsLoading;
  
  // Fetch the featured show from the database
  const { data: featuredShowData } = useQuery<TvShow>({
    queryKey: ['/api/shows/featured'],
    staleTime: 60000, // 1 minute
  });
  
  // Use featured show from database, fallback to first show if none is featured
  const featuredShow = featuredShowData || allShows?.[0];
  
  // Track the favorite status of the featured show
  const [isFeaturedShowFavorite, setIsFeaturedShowFavorite] = useState(false);
  
  // Check favorite status when featured show is loaded and user is logged in
  useEffect(() => {
    // Reset favorite status when user logs out
    if (!user) {
      setIsFeaturedShowFavorite(false);
      return;
    }
    
    // Only check favorite status if featured show exists and user is logged in
    if (featuredShow && user) {
      const checkFavoriteStatus = async () => {
        try {
          // Safe check to ensure featuredShow.id exists
          if (!featuredShow.id) return;
          
          const isFav = await isFavorite(featuredShow.id);
          setIsFeaturedShowFavorite(isFav);
        } catch (error) {
          console.error("Error checking favorite status:", error);
          // Set to false on error to be safe
          setIsFeaturedShowFavorite(false);
        }
      };
      
      checkFavoriteStatus();
    }
  }, [featuredShow, user, isFavorite]);
  
  // Helper function to check if property exists with different case formats
  const getShowProperty = (show: any, propertyNames: string[]) => {
    for (const prop of propertyNames) {
      if (show[prop] !== undefined) {
        return show[prop];
      }
    }
    return null;
  };

  // Filter shows by categories - ensure at least 24 shows per category for better browsing
  const lowStimulationShows = allShows?.filter(show => {
    const stimulationScore = getShowProperty(show, ['stimulationScore', 'stimulation_score']);
    return stimulationScore !== null && stimulationScore <= 2;
  }).slice(0, 24);
  
  // Use highly rated shows data from user review ratings
  const highlyRatedShows = highlyRatedShowsData;
  
  // Use popular shows data from view count tracking
  const popularShows = popularShowsData;
  
  // Get high interaction shows
  const highInteractionShows = allShows?.filter(show => {
    const interactivityLevel = getShowProperty(show, ['interactivityLevel', 'interactivity_level', 'interactionLevel']);
    
    if (!interactivityLevel) return false;
    
    // Check for any variation of "High" interactivity
    return interactivityLevel === 'High' || 
           interactivityLevel.includes('High') || 
           interactivityLevel === 'Moderate-High' || 
           interactivityLevel === 'Moderate to High' ||
           interactivityLevel === 'Mod-High';
  }).slice(0, 24);
  
  // Find shows by educational themes using OR logic with actual database themes
  const educationalShows = allShows?.filter(show => {
    const themes = getShowProperty(show, ['themes']);
    if (!themes || !Array.isArray(themes)) return false;
    
    return themes.some((theme: string) => {
      const lowerTheme = theme.toLowerCase();
      return lowerTheme.includes('elementary-basics') || 
             lowerTheme.includes('preschool-basics') ||
             lowerTheme.includes('stem') ||
             lowerTheme.includes('science') ||
             lowerTheme.includes('math') ||
             lowerTheme.includes('literacy') ||
             lowerTheme.includes('numeracy') ||
             lowerTheme.includes('reading comprehension') ||
             lowerTheme.includes('phonics') ||
             lowerTheme.includes('language learning') ||
             lowerTheme.includes('learn through play') ||
             lowerTheme.includes('learning through songs') ||
             lowerTheme.includes('learning from mistakes') ||
             lowerTheme.includes('learning disabilities') ||
             lowerTheme.includes('vocabulary') ||
             lowerTheme.includes('critical thinking') ||
             lowerTheme.includes('problem solving') ||
             lowerTheme.includes('problem-solving') ||
             lowerTheme.includes('cognitive development');
    });
  }).slice(0, 24);
  
  const adventureShows = allShows?.filter(show => {
    const themes = getShowProperty(show, ['themes']);
    if (!themes || !Array.isArray(themes)) return false;
    
    return themes.some((theme: string) => {
      const lowerTheme = theme.toLowerCase();
      return lowerTheme.includes('adventure') ||
             lowerTheme.includes('exploration') ||
             lowerTheme.includes('discovery') ||
             lowerTheme.includes('outdoor exploration') ||
             lowerTheme.includes('wildlife exploration') ||
             lowerTheme.includes('sensory exploration') ||
             lowerTheme.includes('career exploration') ||
             lowerTheme.includes('courage');
    });
  }).slice(0, 24);
  
  const musicalShows = allShows?.filter(show => {
    const themes = getShowProperty(show, ['themes']);
    if (!themes || !Array.isArray(themes)) return false;
    
    return themes.some((theme: string) => {
      const lowerTheme = theme.toLowerCase();
      return lowerTheme.includes('music') ||
             lowerTheme.includes('dance') ||
             lowerTheme.includes('learning through songs') ||
             lowerTheme.includes('sing-a-long') ||
             lowerTheme.includes('instruments');
    });
  }).slice(0, 24);
  
  const fantasyShows = allShows?.filter(show => {
    const themes = getShowProperty(show, ['themes']);
    if (!themes || !Array.isArray(themes)) return false;
    
    return themes.some((theme: string) => {
      const lowerTheme = theme.toLowerCase();
      return lowerTheme.includes('fantasy elements') ||
             lowerTheme.includes('mild fantasy violence') ||
             lowerTheme.includes('super hero themes');
    });
  }).slice(0, 24);
  
  const preschoolerShows = allShows?.filter(show => {
    const ageRange = getShowProperty(show, ['ageRange', 'age_range']);
    
    return ageRange?.toLowerCase().includes('preschool') || 
           (ageRange && parseInt(ageRange.split('-')[0]) <= 4);
  }).slice(0, 24);
  
  // Filter shows based on search term
  const filteredShows = allShows ? allShows.filter((show: TvShow) => {
    if (!searchQuery.trim()) return false;
    if (!show || !show.name) return false; // Safety check
    
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
  }).slice(0, 6) : [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // For all searches, direct to browse page with search filter
      setLocation(`/browse?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowResults(false);
    }
  };
  
  const handleShowCardClick = (id: number) => {
    // Scroll to top first, then navigate
    window.scrollTo(0, 0);
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
              containScroll: "trimSnaps",
              slidesToScroll: 3
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {shows.map((show) => (
                <CarouselItem key={show.id} className={`pl-2 md:pl-4 ${isMobile ? 'basis-1/3' : 'md:basis-1/4 lg:basis-1/5'}`}>
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
            <div className="md:w-1/4 p-6">
              <div className="mb-2">
                <Badge variant="outline" className="bg-purple-100 text-purple-800 uppercase text-xs font-bold tracking-wide">
                  Featured Listing
                </Badge>
              </div>
              {featuredShow.imageUrl ? (
                <img 
                  src={featuredShow.imageUrl} 
                  alt={featuredShow.name} 
                  className="w-full aspect-[3/4] object-cover rounded-md shadow-lg"
                />
              ) : (
                <div className="w-full aspect-[3/4] bg-gray-200 rounded-md shadow-lg flex items-center justify-center">
                  <i className="fas fa-tv text-gray-400 text-5xl"></i>
                </div>
              )}
            </div>
            
            <div className="md:w-3/4 p-6">
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
                  className={`${isFeaturedShowFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (user) {
                      toggleFavorite(featuredShow.id).then(() => {
                        // Toggle the local state (optimistic update)
                        setIsFeaturedShowFavorite(!isFeaturedShowFavorite);
                        
                        toast({
                          title: isFeaturedShowFavorite ? "Removed from favorites" : "Added to favorites",
                          description: isFeaturedShowFavorite 
                            ? `${featuredShow.name} has been removed from your favorites.` 
                            : `${featuredShow.name} has been added to your favorites.`,
                          variant: "default",
                        });
                      });
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
                  <Heart className={`w-5 h-5 mr-1 ${isFeaturedShowFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                  {isFeaturedShowFavorite ? 'Saved' : 'Add to Favorites'}
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
            onClick={() => setLocation("/browse?interactionLevel=High")}
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
      {highInteractionShows && highInteractionShows.length > 0 && renderCategorySection(
        "Higher Interaction",
        "Shows that encourage audience participation and engagement", 
        highInteractionShows, 
        "/browse?interactionLevel=High"
      )}
      
      {/* Educational Shows */}
      {educationalShows && educationalShows.length > 0 && renderCategorySection(
        "Educational Shows",
        "Shows that focus on learning and educational content", 
        educationalShows, 
        "/browse?themes=Elementary-Basics,Preschool-Basics,STEM,Science,Math,Literacy,Numeracy,Reading Comprehension,Phonics,Language Learning,Learn Through Play,Learning through Songs,Learning from Mistakes,Learning Disabilities,Vocabulary,Critical Thinking,Problem Solving,Problem-Solving,Cognitive Development&themeMatchMode=OR"
      )}
      
      {/* Adventure Shows */}
      {adventureShows && adventureShows.length > 0 && renderCategorySection(
        "Adventure Shows",
        "Shows focused on exploration, excitement and adventures", 
        adventureShows, 
        "/browse?themes=Adventure,Exploration,Discovery,Outdoor Exploration,Wildlife Exploration,Sensory Exploration,Career Exploration&themeMatchMode=OR"
      )}
      
      {/* Musical Shows */}
      {musicalShows && musicalShows.length > 0 && renderCategorySection(
        "Musical Shows",
        "Shows featuring songs, musical numbers and rhythmic content", 
        musicalShows, 
        "/browse?themes=Music,Dance,Learning through Songs,sing-a-long&themeMatchMode=OR"
      )}
      
      {/* Fantasy Shows */}
      {fantasyShows && fantasyShows.length > 0 && renderCategorySection(
        "Fantasy Shows",
        "Shows with magical, imaginative and fantasy elements", 
        fantasyShows, 
        "/browse?themes=Fantasy Elements,Mild Fantasy Violence,Super Hero Themes&themeMatchMode=OR"
      )}
      
      {/* Preschooler Shows */}
      {preschoolerShows && preschoolerShows.length > 0 && renderCategorySection(
        "Preschooler Favorites",
        "Shows specifically designed for children ages 2-4", 
        preschoolerShows, 
        "/browse?ageRange=2-4&themeMatchMode=OR"
      )}

      {/* Leaderboard Section */}
      <Leaderboard />
    </main>
  );
}

// Leaderboard Component
function Leaderboard() {
  const { data: leaderboard, isLoading } = useQuery<any[]>({
    queryKey: ['/api/leaderboard'],
    staleTime: 300000, // 5 minutes
  });

  if (isLoading) {
    return (
      <section className="py-12 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Community Leaders</h2>
            <div className="flex justify-center items-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="text-gray-600">Loading leaderboard...</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-gradient-to-r from-purple-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Community Leaders</h2>
          <p className="text-gray-600">Top contributors earning points through reviews, referrals, and community engagement</p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {leaderboard.slice(0, 9).map((user, index) => (
                <div 
                  key={user.id} 
                  className={`flex items-center space-x-4 p-4 rounded-lg transition-all duration-200 hover:shadow-md ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-100 to-yellow-50 border-2 border-yellow-300' :
                    index === 1 ? 'bg-gradient-to-r from-gray-100 to-gray-50 border-2 border-gray-300' :
                    index === 2 ? 'bg-gradient-to-r from-orange-100 to-orange-50 border-2 border-orange-300' :
                    'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex-shrink-0 relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg relative ${
                      user.background_color || 'bg-purple-500'
                    }`}>
                      {getBadgeEmoji(user.total_points)}
                      
                      {/* Ranking badges for top 3 */}
                      {index < 3 && (
                        <div className="absolute -top-1 -right-1 text-sm">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                        </div>
                      )}
                      
                      {/* Position number for others */}
                      {index >= 3 && (
                        <div className="absolute -top-1 -right-1 bg-gray-800 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <Link href={`/user/${user.id}`}>
                      <h3 className="text-sm font-semibold text-gray-900 truncate hover:text-purple-600 cursor-pointer transition-colors">
                        {user.username || 'Anonymous User'}
                      </h3>
                    </Link>
                    <p className="text-xs text-purple-600 font-medium truncate">
                      {getBadgeName(user.total_points)}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-purple-600">
                        {user.total_points || 0}
                      </span>
                      <span className="text-xs text-gray-500">points</span>
                    </div>
                    {user.country && (
                      <span className="text-xs text-gray-400 truncate">
                        {user.country}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {leaderboard.length > 9 && (
              <div className="bg-gray-50 px-6 py-3 text-center">
                <p className="text-sm text-gray-600">
                  And {leaderboard.length - 9} more amazing community members!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}