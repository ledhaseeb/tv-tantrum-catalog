import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import ShowCard from "@/components/ShowCard";
import { TvShow } from "@shared/schema";
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
  
  // Fetch all TV shows
  const { data: allShows, isLoading } = useQuery<TvShow[]>({
    queryKey: ['/api/shows'],
    staleTime: 60000, // 1 minute
  });
  
  // Find a featured show (using something with good data for demonstration)
  const featuredShow = allShows?.find(show => 
    show.name.includes("Brambly") || 
    (show.themes?.includes("Adventure") && show.themes?.includes("Fantasy"))
  ) || allShows?.[0];
  
  // Filter shows by categories
  const lowStimulationShows = allShows?.filter(show => show.stimulationScore <= 2).slice(0, 8);
  const highlyRatedShows = allShows?.filter(show => show.overallRating >= 4).slice(0, 8);
  const popularShows = allShows?.slice(0, 8); // For demonstration, could be refined with analytics data
  const highInteractionShows = allShows?.filter(
    show => show.interactivityLevel === 'High' || show.interactivityLevel === 'Moderate-High'
  ).slice(0, 8);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/browse?search=${encodeURIComponent(searchQuery.trim())}`);
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
              loop: false,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {shows.map((show) => (
                <CarouselItem key={show.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/4">
                  <ShowCard 
                    show={show} 
                    viewMode="grid"
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
          Sensory Screen Time Guide
        </h1>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Find TV shows optimized for sensory stimulation levels, helping you discover content
          that fits your child's needs.
        </p>
        
        <form onSubmit={handleSearch} className="flex max-w-md mx-auto">
          <Input 
            type="text" 
            placeholder="Search show by name, theme, platform..." 
            className="rounded-r-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button type="submit" className="rounded-l-none">
            <i className="fas fa-search mr-2"></i> Search
          </Button>
        </form>
      </div>
      
      {/* Featured Show */}
      {featuredShow && (
        <div className="bg-indigo-50 rounded-xl overflow-hidden mb-12">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/3 p-6">
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
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  {featuredShow.stimulationScore}/5 Stimulation
                </Badge>
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
              
              <Button 
                className="mt-2" 
                onClick={() => handleShowCardClick(featuredShow.id)}
              >
                View Show Details
              </Button>
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
            onClick={() => setLocation("/browse?tantrumFactor=Low")}
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
            onClick={() => setLocation("/browse?sortBy=overallRating")}
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
            onClick={() => setLocation("/browse")}
          >
            <CardContent className="p-6 text-center">
              <div className="inline-flex p-3 rounded-full bg-amber-100 text-amber-600 mb-3">
                <i className="fas fa-fire text-2xl"></i>
              </div>
              <h3 className="font-heading font-bold mb-2">Popular</h3>
              <p className="text-sm text-gray-600">Shows our community watches and loves the most</p>
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
        "Highly Rated (Stim Score 1)",
        "Top-rated shows with the lowest stimulation scores", 
        highlyRatedShows?.filter(show => show.stimulationScore === 1),
        "/browse?tantrumFactor=VeryLow"
      )}
      
      {/* Lower Stimulation */}
      {renderCategorySection(
        "Lower Stimulation (Scores 1-2)",
        "Calmer shows with gentle pacing, perfect for sensitive viewers", 
        lowStimulationShows, 
        "/browse?tantrumFactor=Low"
      )}
      
      {/* Higher Interaction */}
      {renderCategorySection(
        "Higher Interaction",
        "Shows that encourage audience participation and engagement", 
        highInteractionShows, 
        "/browse?interactivityLevel=High"
      )}
    </main>
  );
}