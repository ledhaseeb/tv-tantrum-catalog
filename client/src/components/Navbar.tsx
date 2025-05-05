import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/queryClient";
import { Search } from "lucide-react";
import type { TvShow } from "../../../shared/schema";

export default function Navbar() {
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);

  // Fetch shows for search dropdown
  const { data: shows } = useQuery({
    queryKey: ['/api/shows'],
    queryFn: async () => {
      const response = await fetch('/api/shows');
      if (!response.ok) {
        throw new Error('Failed to fetch shows');
      }
      const data = await response.json();
      return data as TvShow[];
    },
    staleTime: 60000, // 1 minute
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // For all searches, direct to browse page with search filter
      console.log('Navbar - Submitting search for:', searchTerm.trim());
      // Use setLocation from wouter instead of directly setting window.location
      // This keeps the app in SPA mode and avoids a full page reload
      window.location.href = `/browse?search=${encodeURIComponent(searchTerm.trim())}`;
      setShowResults(false);
    }
  };
  
  // Hide results when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowResults(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Filter shows based on search term
  const filteredShows = shows?.filter((show: TvShow) => {
    if (!searchTerm.trim()) return false;
    
    const searchLower = searchTerm.toLowerCase().trim();
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

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-2xl font-heading font-bold text-primary-600">KidTV Guide</h1>
            </Link>
            <nav className="hidden md:ml-10 md:flex space-x-8">
              <Link 
                href="/"
                className={`${location === '/' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-primary-600'} font-medium px-1 py-4`}
              >
                Home
              </Link>
              <Link 
                href="/browse"
                className={`${location === '/browse' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-primary-600'} font-medium px-1 py-4`}
              >
                Browse Shows
              </Link>
              <Link 
                href="/compare"
                className={`${location === '/compare' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-primary-600'} font-medium px-1 py-4`}
              >
                Compare Shows
              </Link>
              <Link 
                href="/about"
                className={`${location === '/about' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-primary-600'} font-medium px-1 py-4`}
              >
                About
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center">
            <div className="hidden md:block">
              <form onSubmit={handleSearch} className="relative w-[300px]" onClick={(e) => e.stopPropagation()}>
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input 
                  type="search" 
                  placeholder="Search shows..." 
                  className="border border-gray-300 rounded-lg py-2 pl-8 pr-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    // Show results dropdown if there's text to search
                    if (e.target.value.trim().length > 0) {
                      setShowResults(true);
                    } else {
                      setShowResults(false);
                    }
                  }}
                  onFocus={() => {
                    if (searchTerm.trim().length > 0) {
                      setShowResults(true);
                    }
                  }}
                />
                <button type="submit" className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <i className="fas fa-search text-gray-400"></i>
                </button>
                
                {/* Search Results Dropdown */}
                {showResults && searchTerm.trim().length > 0 && (
                  <div className="absolute mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto border border-gray-200 z-50">
                    <div className="py-1">
                      {filteredShows?.length ? (
                        filteredShows.map((show: TvShow) => (
                          <div
                            key={show.id}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              setSearchTerm(show.name);
                              setShowResults(false);
                              window.location.href = `/browse?search=${encodeURIComponent(show.name)}`;
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
              </form>
            </div>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden ml-4 text-gray-500 hover:text-primary-600">
                  <i className="fas fa-bars text-xl"></i>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className="px-2 pt-4 pb-3 space-y-1">
                  <h2 className="text-lg font-bold mb-4">KidTV Guide</h2>
                  <Link 
                    href="/"
                    className={`block px-3 py-2 text-base font-medium ${location === '/' ? 'text-primary-600 bg-primary-50' : 'text-gray-500 hover:text-primary-600 hover:bg-primary-50'} rounded-md`}
                  >
                    Home
                  </Link>
                  <Link 
                    href="/browse"
                    className={`block px-3 py-2 text-base font-medium ${location === '/browse' ? 'text-primary-600 bg-primary-50' : 'text-gray-500 hover:text-primary-600 hover:bg-primary-50'} rounded-md`}
                  >
                    Browse Shows
                  </Link>
                  <Link 
                    href="/compare"
                    className={`block px-3 py-2 text-base font-medium ${location === '/compare' ? 'text-primary-600 bg-primary-50' : 'text-gray-500 hover:text-primary-600 hover:bg-primary-50'} rounded-md`}
                  >
                    Compare Shows
                  </Link>
                  <Link 
                    href="/about"
                    className={`block px-3 py-2 text-base font-medium ${location === '/about' ? 'text-primary-600 bg-primary-50' : 'text-gray-500 hover:text-primary-600 hover:bg-primary-50'} rounded-md`}
                  >
                    About
                  </Link>
                </div>
                <div className="pt-4 pb-3 border-t border-gray-200">
                  <div className="px-2">
                    <form onSubmit={handleSearch} className="relative">
                      <Input 
                        type="search" 
                        placeholder="Search shows..." 
                        className="w-full border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <button type="submit" className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <i className="fas fa-search text-gray-400"></i>
                      </button>
                    </form>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}