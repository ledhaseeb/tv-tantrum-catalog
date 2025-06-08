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
      const stimulation = show.stimulationRating || 0;
      
      // Popular shows (high creativity rating or recent)
      if (show.creativityRating && show.creativityRating >= 4) {
        categories.popular.push(show);
      }
      
      // Musical shows
      if (themes.some(theme => 
        theme.toLowerCase().includes('music') || 
        theme.toLowerCase().includes('song') ||
        theme.toLowerCase().includes('musical')
      )) {
        categories.musical.push(show);
      }
      
      // Fantasy shows
      if (themes.some(theme => 
        theme.toLowerCase().includes('fantasy') || 
        theme.toLowerCase().includes('magic') ||
        theme.toLowerCase().includes('adventure')
      )) {
        categories.fantasy.push(show);
      }
      
      // Educational shows
      if (themes.some(theme => 
        theme.toLowerCase().includes('education') || 
        theme.toLowerCase().includes('learning') ||
        theme.toLowerCase().includes('teach')
      )) {
        categories.educational.push(show);
      }
      
      // Preschool shows (age range 2-5)
      if (show.ageRange && (
        show.ageRange.includes('2-5') ||
        show.ageRange.includes('3-5') ||
        show.ageRange.includes('toddler') ||
        show.ageRange.includes('preschool')
      )) {
        categories.preschool.push(show);
      }
      
      // High energy shows
      if (stimulation >= 4) {
        categories.highEnergy.push(show);
      }
      
      // Calm shows
      if (stimulation <= 2) {
        categories.calm.push(show);
      }
    });

    // Limit each category to 10 shows
    Object.keys(categories).forEach(key => {
      categories[key] = categories[key].slice(0, 10);
    });

    return categories;
  };

  const categories = groupShowsByCategory(allShows || []);

  const handleSearch = () => {
    if (searchTerm.trim()) {
      window.location.href = `/browse?search=${encodeURIComponent(searchTerm)}`;
    }
  };

  if (showsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      </div>
    );
  }

  // Mobile layout with category rows
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
          <div className="px-4 py-3">
            <h1 className="text-xl font-bold text-gray-900 mb-3">TV Tantrum</h1>
            <div className="flex gap-2 mb-3">
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
            
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search shows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <Button size="sm" onClick={handleSearch}>
                Search
              </Button>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Screen Time Stimulation Scores
            </h1>
            <p className="text-gray-600 mb-8 text-sm leading-relaxed max-w-sm mx-auto">
              Find TV shows measured by stimulation levels, helping you discover content that fits your child's needs.
            </p>
            
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search show by name, theme..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-9 pr-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <Button onClick={handleSearch} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-sm">
                Search
              </Button>
            </div>
          </div>
        </div>

        {/* Ad Container */}
        <div className="bg-gray-100 border-y border-gray-200 py-4 px-4">
          <div className="text-center text-sm text-gray-500 bg-white rounded-lg py-6 border-2 border-dashed border-gray-300">
            Advertisement Space
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

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-16 px-8">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Screen Time Stimulation Scores
          </h1>
          <p className="text-gray-600 mb-10 text-lg leading-relaxed max-w-2xl mx-auto">
            Find TV shows measured by stimulation levels, helping you discover content that fits your child's needs.
          </p>
          
          <div className="flex gap-3 max-w-lg mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search show by name, theme, platform..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-4 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Button onClick={handleSearch} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-base">
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Ad Container */}
      <div className="bg-gray-100 border-y border-gray-200 py-6 px-8">
        <div className="text-center text-sm text-gray-500 bg-white rounded-lg py-8 border-2 border-dashed border-gray-300 max-w-4xl mx-auto">
          Advertisement Space
        </div>
      </div>

      {/* Content - Category Rows */}
      <div className="pt-8 pb-8">
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