import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import CategoryRow from "@/components/CategoryRow";
import ShowCard from "@/components/ShowCard";
import { Search, Filter, BarChart2, ChevronLeft, ChevronRight } from "lucide-react";
import type { TvShow } from "../../../shared/catalog-schema";

export default function CatalogHomeResponsive() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Fetch all shows
  const { data: allShows, isLoading: showsLoading } = useQuery({
    queryKey: ['/api/tv-shows'],
    queryFn: async () => {
      const response = await fetch('/api/tv-shows');
      if (!response.ok) throw new Error('Failed to fetch shows');
      return response.json() as Promise<TvShow[]>;
    },
  });

  // Group shows by themes and characteristics
  const groupShowsByCategory = (shows: TvShow[]) => {
    const categories: { [key: string]: TvShow[] } = {
      popular: [],
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

      // Popular shows (first 12 shows as featured)
      if (categories.popular.length < 12) {
        categories.popular.push(show);
      }

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

  const handleSearch = () => {
    if (searchTerm.trim()) {
      window.location.href = `/browse?search=${encodeURIComponent(searchTerm)}`;
    }
  };

  const LoadingSkeleton = () => (
    <div className="space-y-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className={isMobile ? "px-4" : "px-8"}>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48 mb-4" />
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'}`}>
            {[1, 2, 3, 4, 5].map((j) => (
              <div key={j} className="w-full">
                <Skeleton className={`aspect-[3/4] mb-2 rounded-lg`} />
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  if (showsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
          <div className={`py-3 ${isMobile ? 'px-4' : 'px-8'}`}>
            <div className="flex items-center justify-between mb-3">
              <h1 className={`font-bold text-gray-900 ${isMobile ? 'text-xl' : 'text-2xl'}`}>TV Tantrum</h1>
              <div className="flex gap-2">
                <Link href="/browse">
                  <Button variant="ghost" size="sm">
                    <BarChart2 className="w-4 h-4 mr-1" />
                    Browse
                  </Button>
                </Link>
                <Button variant="ghost" size="sm">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search shows..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <Button size="sm" className="px-4">
                Search
              </Button>
            </div>
          </div>
        </div>
        <div className="pt-6">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  // Mobile layout with horizontal scrollable rows
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-xl font-bold text-gray-900">TV Tantrum</h1>
              <div className="flex gap-2">
                <Link href="/browse">
                  <Button variant="ghost" size="sm">
                    <BarChart2 className="w-4 h-4 mr-1" />
                    Browse
                  </Button>
                </Link>
                <Button variant="ghost" size="sm">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search shows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <Button size="sm" className="px-4" onClick={handleSearch}>
                Search
              </Button>
            </div>
          </div>
        </div>

        {/* Content - Category Rows */}
        <div className="pt-6 pb-8">
          {categories.popular && categories.popular.length > 0 && (
            <CategoryRow
              title="Popular Shows"
              description="Most viewed shows across all age groups"
              shows={categories.popular}
              viewAllLink="/browse?sort=popular"
            />
          )}

          {categories.musical && categories.musical.length > 0 && (
            <CategoryRow
              title="Musical Shows"
              description="Shows featuring songs, musical numbers and rhythmic content"
              shows={categories.musical}
              viewAllLink="/browse?theme=music"
            />
          )}

          {categories.fantasy && categories.fantasy.length > 0 && (
            <CategoryRow
              title="Fantasy Shows"
              description="Shows with magical, imaginative and fantasy elements"
              shows={categories.fantasy}
              viewAllLink="/browse?theme=fantasy"
            />
          )}

          {categories.educational && categories.educational.length > 0 && (
            <CategoryRow
              title="Educational Shows"
              description="Learning-focused content for cognitive development"
              shows={categories.educational}
              viewAllLink="/browse?theme=education"
            />
          )}

          {categories.preschool && categories.preschool.length > 0 && (
            <CategoryRow
              title="Preschool Shows"
              description="Perfect content for toddlers and preschoolers"
              shows={categories.preschool}
              viewAllLink="/browse?age=2-5"
            />
          )}

          {categories.highEnergy && categories.highEnergy.length > 0 && (
            <CategoryRow
              title="High Energy Shows"
              description="Active and stimulating content for energetic kids"
              shows={categories.highEnergy}
              viewAllLink="/browse?stimulation=4-5"
            />
          )}

          {categories.calm && categories.calm.length > 0 && (
            <CategoryRow
              title="Calm Shows"
              description="Gentle and soothing content for quiet time"
              shows={categories.calm}
              viewAllLink="/browse?stimulation=1-2"
            />
          )}
        </div>
      </div>
    );
  }

  // Desktop layout with large grid cards
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">TV Tantrum</h1>
            <div className="flex gap-3">
              <Link href="/browse">
                <Button variant="ghost" size="sm">
                  <BarChart2 className="w-4 h-4 mr-2" />
                  Browse
                </Button>
              </Link>
              <Button variant="ghost" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
          
          <div className="flex gap-3 max-w-md">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search shows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Button className="px-6" onClick={handleSearch}>
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Content - Grid Sections */}
      <div className="px-8 py-8 space-y-12">
        {/* Popular Shows */}
        {categories.popular && categories.popular.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Popular Shows</h2>
                <p className="text-gray-600">Most viewed shows across all age groups</p>
              </div>
              <Link href="/browse?sort=popular">
                <Button variant="ghost" className="text-blue-600 hover:text-blue-800">
                  View All →
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {categories.popular.slice(0, 10).map((show) => (
                <ShowCard 
                  key={show.id} 
                  show={show} 
                  viewMode="grid"
                  onClick={() => {}}
                />
              ))}
            </div>
          </section>
        )}

        {/* Musical Shows */}
        {categories.musical && categories.musical.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Musical Shows</h2>
                <p className="text-gray-600">Shows featuring songs, musical numbers and rhythmic content</p>
              </div>
              <Link href="/browse?theme=music">
                <Button variant="ghost" className="text-blue-600 hover:text-blue-800">
                  View All →
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {categories.musical.slice(0, 10).map((show) => (
                <ShowCard 
                  key={show.id} 
                  show={show} 
                  viewMode="grid"
                  onClick={() => {}}
                />
              ))}
            </div>
          </section>
        )}

        {/* Educational Shows */}
        {categories.educational && categories.educational.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Educational Shows</h2>
                <p className="text-gray-600">Learning-focused content for cognitive development</p>
              </div>
              <Link href="/browse?theme=education">
                <Button variant="ghost" className="text-blue-600 hover:text-blue-800">
                  View All →
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {categories.educational.slice(0, 10).map((show) => (
                <ShowCard 
                  key={show.id} 
                  show={show} 
                  viewMode="grid"
                  onClick={() => {}}
                />
              ))}
            </div>
          </section>
        )}

        {/* Preschool Shows */}
        {categories.preschool && categories.preschool.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Preschool Shows</h2>
                <p className="text-gray-600">Perfect content for toddlers and preschoolers</p>
              </div>
              <Link href="/browse?age=2-5">
                <Button variant="ghost" className="text-blue-600 hover:text-blue-800">
                  View All →
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {categories.preschool.slice(0, 10).map((show) => (
                <ShowCard 
                  key={show.id} 
                  show={show} 
                  viewMode="grid"
                  onClick={() => {}}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}