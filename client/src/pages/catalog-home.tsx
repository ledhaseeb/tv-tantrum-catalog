import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ShowCard from "@/components/ShowCard";
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

  // Fetch shows by age categories
  const { data: toddlerShows, isLoading: toddlerLoading } = useQuery({
    queryKey: ['/api/tv-shows', { ageGroup: '0-3' }],
    queryFn: async () => {
      const response = await fetch('/api/tv-shows?ageGroup=0-3&limit=12');
      if (!response.ok) throw new Error('Failed to fetch toddler shows');
      return response.json() as Promise<TvShow[]>;
    },
  });

  const { data: preschoolShows, isLoading: preschoolLoading } = useQuery({
    queryKey: ['/api/tv-shows', { ageGroup: '3-6' }],
    queryFn: async () => {
      const response = await fetch('/api/tv-shows?ageGroup=3-6&limit=12');
      if (!response.ok) throw new Error('Failed to fetch preschool shows');
      return response.json() as Promise<TvShow[]>;
    },
  });

  const { data: elementaryShows, isLoading: elementaryLoading } = useQuery({
    queryKey: ['/api/tv-shows', { ageGroup: '6-12' }],
    queryFn: async () => {
      const response = await fetch('/api/tv-shows?ageGroup=6-12&limit=12');
      if (!response.ok) throw new Error('Failed to fetch elementary shows');
      return response.json() as Promise<TvShow[]>;
    },
  });

  // Fetch shows by stimulation level
  const { data: calmShows, isLoading: calmLoading } = useQuery({
    queryKey: ['/api/tv-shows', { stimulation: 'low' }],
    queryFn: async () => {
      const response = await fetch('/api/tv-shows?stimulationScoreRange={"min":1,"max":2}&limit=12');
      if (!response.ok) throw new Error('Failed to fetch calm shows');
      return response.json() as Promise<TvShow[]>;
    },
  });

  const { data: activeShows, isLoading: activeLoading } = useQuery({
    queryKey: ['/api/tv-shows', { stimulation: 'high' }],
    queryFn: async () => {
      const response = await fetch('/api/tv-shows?stimulationScoreRange={"min":4,"max":5}&limit=12');
      if (!response.ok) throw new Error('Failed to fetch active shows');
      return response.json() as Promise<TvShow[]>;
    },
  });

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
                  <CarouselItem key={show.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                    <ShowCard show={show} viewMode="grid" onClick={() => {}} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          )}
        </div>
      </section>

      {/* Age-Based Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Toddler Shows */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Toddler Shows (Ages 0-3)</h2>
                <p className="text-gray-600">Perfect for your little ones</p>
              </div>
              <Link href="/browse?ageGroup=0-3">
                <Button variant="outline">View All</Button>
              </Link>
            </div>
            
            {toddlerLoading ? (
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
                  {toddlerShows?.map((show) => (
                    <CarouselItem key={show.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                      <ShowCard show={show} viewMode="grid" onClick={() => {}} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            )}
          </div>

          {/* Preschool Shows */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Preschool Shows (Ages 3-6)</h2>
                <p className="text-gray-600">Learning and fun combined</p>
              </div>
              <Link href="/browse?ageGroup=3-6">
                <Button variant="outline">View All</Button>
              </Link>
            </div>
            
            {preschoolLoading ? (
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
                  {preschoolShows?.map((show) => (
                    <CarouselItem key={show.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                      <ShowCard show={show} viewMode="grid" onClick={() => {}} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            )}
          </div>

          {/* Elementary Shows */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Elementary Shows (Ages 6-12)</h2>
                <p className="text-gray-600">Adventure and education for older kids</p>
              </div>
              <Link href="/browse?ageGroup=6-12">
                <Button variant="outline">View All</Button>
              </Link>
            </div>
            
            {elementaryLoading ? (
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
                  {elementaryShows?.map((show) => (
                    <CarouselItem key={show.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                      <ShowCard show={show} viewMode="grid" onClick={() => {}} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            )}
          </div>
        </div>
      </section>

      {/* Stimulation Level Categories */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Calm Shows */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Calm & Relaxing Shows</h2>
                <p className="text-gray-600">Perfect for quiet time and bedtime</p>
              </div>
              <Link href="/browse?stimulationScoreRange=%7B%22min%22%3A1%2C%22max%22%3A2%7D">
                <Button variant="outline">View All</Button>
              </Link>
            </div>
            
            {calmLoading ? (
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
                  {calmShows?.map((show) => (
                    <CarouselItem key={show.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                      <ShowCard show={show} viewMode="grid" onClick={() => {}} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            )}
          </div>

          {/* Active Shows */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Active & Energetic Shows</h2>
                <p className="text-gray-600">High-energy content for active kids</p>
              </div>
              <Link href="/browse?stimulationScoreRange=%7B%22min%22%3A4%2C%22max%22%3A5%7D">
                <Button variant="outline">View All</Button>
              </Link>
            </div>
            
            {activeLoading ? (
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
                  {activeShows?.map((show) => (
                    <CarouselItem key={show.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                      <ShowCard show={show} viewMode="grid" onClick={() => {}} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            )}
          </div>
        </div>
      </section>


    </div>
  );
}