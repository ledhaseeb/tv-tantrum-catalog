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
      <section className="bg-gradient-to-br from-primary to-primary-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Discover Amazing Shows for Kids
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              Find the perfect children's shows with our smart filtering system. 
              Filter by age, stimulation level, and themes to discover content that fits your family.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search for shows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-6 py-4 pr-16 text-lg rounded-full border-0 focus:ring-4 focus:ring-white/20 text-gray-900 placeholder:text-gray-500"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-secondary text-primary px-6 py-2 rounded-full hover:bg-secondary/90 transition-colors"
                >
                  <Search className="h-5 w-5" />
                </button>
              </form>
            </div>
            
            {/* Quick Action Buttons */}
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/browse">
                <Button size="lg" variant="secondary" className="text-primary">
                  <Filter className="mr-2 h-5 w-5" />
                  Browse All Shows
                </Button>
              </Link>
              <Link href="/compare">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                  <BarChart2 className="mr-2 h-5 w-5" />
                  Compare Shows
                </Button>
              </Link>
              <Link href="/research">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Research Hub
                </Button>
              </Link>
            </div>
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
                      <ShowCard show={show} />
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
                      <ShowCard show={show} />
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

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Smart Content Discovery</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Find the perfect shows for your children with our advanced filtering system
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-4">
                <Filter className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Age-Appropriate Filtering</h3>
              <p className="text-gray-600">
                Filter shows by precise age ranges from toddlers to teens, ensuring developmentally appropriate content.
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <BarChart2 className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Stimulation Level Control</h3>
              <p className="text-gray-600">
                Choose shows based on energy levels - from calm bedtime content to high-energy active shows.
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Research-Backed Insights</h3>
              <p className="text-gray-600">
                Access expert research summaries and evidence-based content recommendations for informed viewing choices.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Link href="/browse">
              <Button size="lg" className="bg-teal-600 hover:bg-teal-700 text-white">
                Start Exploring Shows
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose TV Tantrum?</h2>
            <p className="text-lg text-gray-600">Smart tools for better content discovery</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Filtering</h3>
              <p className="text-gray-600">
                Filter by age range, stimulation level, and themes to find exactly what your family needs.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Compare Shows</h3>
              <p className="text-gray-600">
                Side-by-side comparison of shows to help you make informed viewing decisions.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Research-Backed</h3>
              <p className="text-gray-600">
                Access to research summaries and insights about children's media consumption.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}