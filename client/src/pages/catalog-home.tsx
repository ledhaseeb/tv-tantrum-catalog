import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DesktopGridShowCard, MobileGridShowCard } from "@/components/StandardShowCards";
import { CardSizingControls } from "@/components/CardSizingControls";
import { DynamicShowCard } from "@/components/DynamicShowCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Search, Filter, BarChart2, BookOpen, Star, Clock, Users, Sparkles, Heart, TrendingUp } from "lucide-react";
import AdContainer from "@/components/AdContainer";
import type { TvShow } from "../../../shared/catalog-schema";

export default function CatalogHome() {
  const [searchTerm, setSearchTerm] = useState("");
  const [cardConfig, setCardConfig] = useState({
    totalHeight: 'h-72',
    totalWidth: 'w-48',
    imageHeight: 'h-40',
    contentHeight: 'h-32',
    contentPadding: 'p-3',
    titleSize: 'text-sm',
    badgeSize: 'text-xs',
    maxThemes: 1,
  });
  const [showSizingControls, setShowSizingControls] = useState(false);

  // Fetch featured show
  const { data: featuredShow, isLoading: featuredLoading } = useQuery({
    queryKey: ['/api/shows/featured'],
    queryFn: async () => {
      const response = await fetch('/api/shows/featured');
      if (!response.ok) throw new Error('Failed to fetch featured show');
      return response.json() as Promise<TvShow>;
    },
  });

  // Fetch popular shows
  const { data: popularShows, isLoading: popularLoading } = useQuery({
    queryKey: ['/api/shows/popular'],
    queryFn: async () => {
      const response = await fetch('/api/shows/popular?limit=12');
      if (!response.ok) throw new Error('Failed to fetch popular shows');
      return response.json() as Promise<TvShow[]>;
    },
  });

  // Fetch all shows for categorization
  const { data: allShows, isLoading: allShowsLoading } = useQuery({
    queryKey: ['/api/tv-shows'],
    queryFn: async () => {
      const response = await fetch('/api/tv-shows');
      if (!response.ok) throw new Error('Failed to fetch shows');
      return response.json() as Promise<TvShow[]>;
    },
  });

  // Group shows by themes and characteristics (same logic as mobile)
  const groupShowsByCategory = (shows: TvShow[]) => {
    const categories: { [key: string]: TvShow[] } = {
      musical: [],
      fantasy: [],
      educational: [],
      preschool: [],
      highEnergy: [],
      calm: []
    };

    shows?.forEach(show => {
      const themes = show.themes || [];
      const stimulation = show.stimulationScore || 0;
      const ageRange = show.ageRange || '';

      // Musical shows
      if (themes.some(theme => 
        theme.toLowerCase().includes('music') || 
        theme.toLowerCase().includes('song') ||
        theme.toLowerCase().includes('rhythm')
      )) {
        categories.musical.push(show);
      }

      // Fantasy shows
      if (themes.some(theme => 
        theme.toLowerCase().includes('fantasy') || 
        theme.toLowerCase().includes('magic') ||
        theme.toLowerCase().includes('adventure') ||
        theme.toLowerCase().includes('imagination')
      )) {
        categories.fantasy.push(show);
      }

      // Educational shows
      if (themes.some(theme => 
        theme.toLowerCase().includes('education') || 
        theme.toLowerCase().includes('learning') ||
        theme.toLowerCase().includes('science') ||
        theme.toLowerCase().includes('math') ||
        theme.toLowerCase().includes('literacy')
      )) {
        categories.educational.push(show);
      }

      // Preschool shows (ages 2-5)
      if (ageRange.includes('2') || ageRange.includes('3') || ageRange.includes('4') || ageRange.includes('5')) {
        categories.preschool.push(show);
      }

      // High energy shows (stimulation 4-5)
      if (stimulation >= 4) {
        categories.highEnergy.push(show);
      }

      // Calm shows (stimulation 1-2)
      if (stimulation <= 2) {
        categories.calm.push(show);
      }
    });

    return categories;
  };

  const categories = allShows ? groupShowsByCategory(allShows) : {};



  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      window.location.href = `/browse?search=${encodeURIComponent(searchTerm.trim())}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
              Screen Time Stimulation Scores
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Find TV shows measured by stimulation levels, helping you discover content that fits your child's needs.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search show by name, theme, platform..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-16 py-4 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-slate-700 text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Search
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Ad Container */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <AdContainer size="leaderboard" className="w-full max-w-4xl" />
          </div>
        </div>
      </section>

      {/* Featured Show Section */}
      {featuredShow && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Show</h2>
              <p className="text-lg text-gray-600">Handpicked recommendation for families</p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <Card className="overflow-hidden shadow-xl">
                <div className="md:flex">
                  <div className="md:w-1/3">
                    {featuredShow.imageUrl ? (
                      <img 
                        src={featuredShow.imageUrl} 
                        alt={featuredShow.name}
                        className="w-full h-64 md:h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-64 md:h-full bg-gray-200 flex items-center justify-center">
                        <Sparkles className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="md:w-2/3 p-8">
                    <div className="flex items-center mb-4">
                      <Badge className="bg-secondary text-primary font-semibold mr-3">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                      <Badge variant="outline">Age {featuredShow.ageRange}</Badge>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{featuredShow.name}</h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">{featuredShow.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{featuredShow.stimulationScore}/5</div>
                        <div className="text-sm text-gray-500">Stimulation Level</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{featuredShow.episodeLength}min</div>
                        <div className="text-sm text-gray-500">Episode Length</div>
                      </div>
                      {featuredShow.seasons && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{featuredShow.seasons}</div>
                          <div className="text-sm text-gray-500">Seasons</div>
                        </div>
                      )}
                    </div>
                    
                    <Link href={`/show/${featuredShow.id}`}>
                      <Button size="lg" className="w-full md:w-auto">
                        Learn More
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Popular Shows Carousel */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Popular Shows</h2>
              <p className="text-lg text-gray-600">Discover what families are watching</p>
            </div>
            <Link href="/browse">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          
          {popularLoading ? (
            <div className="flex space-x-6 overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="flex-shrink-0 w-64 overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Carousel className="w-full">
              <CarouselContent className="-ml-2 md:-ml-4">
                {popularShows?.map((show) => (
                  <CarouselItem key={show.id} className="pl-2 md:pl-4 flex-shrink-0">
                    <DynamicShowCard show={show} config={cardConfig} onClick={() => {}} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          )}
        </div>
      </section>

      {/* Real Show Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Musical Shows */}
          {categories.musical && categories.musical.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Musical Shows</h2>
                  <p className="text-gray-600">Shows featuring songs, musical numbers and rhythmic content</p>
                </div>
                <Link href="/browse?theme=music">
                  <Button variant="outline">View All</Button>
                </Link>
              </div>
              
              {allShowsLoading ? (
                <div className="flex space-x-6 overflow-hidden">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="flex-shrink-0 w-64 overflow-hidden">
                      <Skeleton className="h-48 w-full" />
                      <CardContent className="p-4">
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Carousel className="w-full">
                  <CarouselContent className="-ml-2 md:-ml-4">
                    {categories.musical.slice(0, 12).map((show) => (
                      <CarouselItem key={show.id} className="pl-2 md:pl-4 flex-shrink-0">
                        <DynamicShowCard show={show} config={cardConfig} onClick={() => {}} />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              )}
            </div>
          )}

          {/* Calm Shows */}
          {categories.calm && categories.calm.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Calm Shows</h2>
                  <p className="text-gray-600">Gentle and soothing content for quiet time</p>
                </div>
                <Link href="/browse?stimulation=1-2">
                  <Button variant="outline">View All</Button>
                </Link>
              </div>
              
              {allShowsLoading ? (
                <div className="flex space-x-6 overflow-hidden">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="flex-shrink-0 w-64 overflow-hidden">
                      <Skeleton className="h-48 w-full" />
                      <CardContent className="p-4">
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Carousel className="w-full">
                  <CarouselContent className="-ml-2 md:-ml-4">
                    {categories.calm.slice(0, 12).map((show) => (
                      <CarouselItem key={show.id} className="pl-2 md:pl-4 flex-shrink-0">
                        <DynamicShowCard show={show} config={cardConfig} onClick={() => {}} />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              )}
            </div>
          )}

          {/* Educational Shows */}
          {categories.educational && categories.educational.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Educational Shows</h2>
                  <p className="text-gray-600">Learning-focused content for cognitive development</p>
                </div>
                <Link href="/browse?theme=education">
                  <Button variant="outline">View All</Button>
                </Link>
              </div>
              
              {allShowsLoading ? (
                <div className="flex space-x-6 overflow-hidden">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="flex-shrink-0 w-64 overflow-hidden">
                      <Skeleton className="h-48 w-full" />
                      <CardContent className="p-4">
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Carousel className="w-full">
                  <CarouselContent className="-ml-2 md:-ml-4">
                    {categories.educational.slice(0, 12).map((show) => (
                      <CarouselItem key={show.id} className="pl-2 md:pl-4 flex-shrink-0">
                        <DynamicShowCard show={show} config={cardConfig} onClick={() => {}} />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Additional Categories */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Fantasy Shows */}
          {categories.fantasy && categories.fantasy.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Fantasy Shows</h2>
                  <p className="text-gray-600">Shows with magical, imaginative and fantasy elements</p>
                </div>
                <Link href="/browse?theme=fantasy">
                  <Button variant="outline">View All</Button>
                </Link>
              </div>
              
              {allShowsLoading ? (
                <div className="flex space-x-6 overflow-hidden">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="flex-shrink-0 w-64 overflow-hidden">
                      <Skeleton className="h-48 w-full" />
                      <CardContent className="p-4">
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Carousel className="w-full">
                  <CarouselContent className="-ml-2 md:-ml-4">
                    {categories.fantasy.slice(0, 12).map((show) => (
                      <CarouselItem key={show.id} className="pl-2 md:pl-4 flex-shrink-0">
                        <DynamicShowCard show={show} config={cardConfig} onClick={() => {}} />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              )}
            </div>
          )}

          {/* High Energy Shows */}
          {categories.highEnergy && categories.highEnergy.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">High Energy Shows</h2>
                  <p className="text-gray-600">Active and stimulating content for energetic kids</p>
                </div>
                <Link href="/browse?stimulation=4-5">
                  <Button variant="outline">View All</Button>
                </Link>
              </div>
              
              {allShowsLoading ? (
                <div className="flex space-x-6 overflow-hidden">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="flex-shrink-0 w-64 overflow-hidden">
                      <Skeleton className="h-48 w-full" />
                      <CardContent className="p-4">
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Carousel className="w-full">
                  <CarouselContent className="-ml-2 md:-ml-4">
                    {categories.highEnergy.slice(0, 12).map((show) => (
                      <CarouselItem key={show.id} className="pl-2 md:pl-4 flex-shrink-0">
                        <DynamicShowCard show={show} config={cardConfig} onClick={() => {}} />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Visual Card Sizing Controls */}
      <CardSizingControls
        onSizeChange={setCardConfig}
        isVisible={showSizingControls}
        onToggle={() => setShowSizingControls(!showSizingControls)}
      />
    </div>
  );
}