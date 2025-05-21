import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/queryClient";
import { Search, User, LogOut, Home, Filter, BarChart2, Info, Settings, X, BookOpen } from "lucide-react";
import type { TvShow } from "../../../shared/schema";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const { user, isLoading, isAuthenticated } = useAuth();
  // Check if user is admin via API call
  const { data: isAdmin = false } = useQuery({
    queryKey: ['/api/user/is-admin'],
    enabled: !!user,
  });

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
    <header className="sticky top-0 z-50 bg-primary shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/home" className="flex-shrink-0">
              <h1 className="text-2xl font-heading font-bold" style={{ color: "#F6CB59" }}>TV Tantrum</h1>
            </Link>
            <nav className="hidden md:ml-10 md:flex space-x-8">
              <Link 
                href="/home"
                className={`${location === '/home' ? 'text-white border-b-2 border-white' : 'text-white/80 hover:text-white'} font-medium px-1 py-4 flex items-center`}
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Link>
              <Link 
                href="/browse"
                className={`${location === '/browse' ? 'text-white border-b-2 border-white' : 'text-white/80 hover:text-white'} font-medium px-1 py-4 flex items-center`}
              >
                <Filter className="w-4 h-4 mr-2" />
                Browse
              </Link>
              <Link 
                href="/compare"
                className={`${location === '/compare' ? 'text-white border-b-2 border-white' : 'text-white/80 hover:text-white'} font-medium px-1 py-4 flex items-center`}
              >
                <BarChart2 className="w-4 h-4 mr-2" />
                Compare
              </Link>
              <Link 
                href="/app-about"
                className={`${location === '/app-about' ? 'text-white border-b-2 border-white' : 'text-white/80 hover:text-white'} font-medium px-1 py-4 flex items-center`}
              >
                <Info className="w-4 h-4 mr-2" />
                About
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Authentication links */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <Link href="/admin">
                      <Button 
                        variant="ghost" 
                        className="flex items-center gap-1 text-white/90 hover:text-white hover:bg-primary-700"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Admin</span>
                      </Button>
                    </Link>
                  )}
                  <Link href="/research">
                    <Button 
                      variant="ghost" 
                      className="flex items-center gap-1 text-white/90 hover:text-white hover:bg-primary-700"
                    >
                      <BookOpen className="h-4 w-4" />
                      <span>Research</span>
                    </Button>
                  </Link>
                  <Link href="/user-dashboard">
                    <Button 
                      variant="ghost" 
                      className="flex items-center gap-1 text-white/90 hover:text-white hover:bg-primary-700"
                    >
                      <User className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Button>
                  </Link>
                  <a href="/api/logout">
                    <Button 
                      variant="ghost" 
                      className="flex items-center gap-1 text-white/90 hover:text-white hover:bg-primary-700"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </Button>
                  </a>
                </div>
              ) : (
                <a href="/api/login">
                  <Button 
                    variant="ghost" 
                    className="text-white/90 hover:text-white hover:bg-primary-700"
                  >
                    Login
                  </Button>
                </a>
              )}
            </div>
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden ml-4 text-white hover:text-white/80"
              onClick={() => setIsNavOpen(true)}
            >
              <i className="fas fa-bars text-xl"></i>
            </Button>
            
            {/* Custom mobile navigation overlay */}
            {isNavOpen && (
              <div className="fixed inset-0 z-50 md:hidden">
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 bg-black/50"
                  onClick={() => setIsNavOpen(false)}
                />
                
                {/* Side drawer */}
                <div className="fixed inset-y-0 left-0 w-64 bg-white p-4 overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <Link href="/home" onClick={() => setIsNavOpen(false)}>
                      <h2 className="text-lg font-bold" style={{ color: "#F6CB59" }}>TV Tantrum</h2>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-500 hover:bg-gray-100"
                      onClick={() => setIsNavOpen(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <div className="space-y-1">
                    <Link 
                      href="/home"
                      onClick={() => setIsNavOpen(false)}
                      className={`flex items-center px-3 py-2 text-base font-medium ${location === '/home' ? 'text-primary-600 bg-primary-50' : 'text-gray-500 hover:text-primary-600 hover:bg-primary-50'} rounded-md`}
                    >
                      <Home className="h-5 w-5 mr-3" />
                      Home
                    </Link>
                    <Link 
                      href="/browse"
                      onClick={() => setIsNavOpen(false)}
                      className={`flex items-center px-3 py-2 text-base font-medium ${location === '/browse' ? 'text-primary-600 bg-primary-50' : 'text-gray-500 hover:text-primary-600 hover:bg-primary-50'} rounded-md`}
                    >
                      <Filter className="h-5 w-5 mr-3" />
                      Browse
                    </Link>
                    <Link 
                      href="/compare"
                      onClick={() => setIsNavOpen(false)}
                      className={`flex items-center px-3 py-2 text-base font-medium ${location === '/compare' ? 'text-primary-600 bg-primary-50' : 'text-gray-500 hover:text-primary-600 hover:bg-primary-50'} rounded-md`}
                    >
                      <BarChart2 className="h-5 w-5 mr-3" />
                      Compare
                    </Link>
                    <Link 
                      href="/app-about"
                      onClick={() => setIsNavOpen(false)}
                      className={`flex items-center px-3 py-2 text-base font-medium ${location === '/app-about' ? 'text-primary-600 bg-primary-50' : 'text-gray-500 hover:text-primary-600 hover:bg-primary-50'} rounded-md`}
                    >
                      <Info className="h-5 w-5 mr-3" />
                      About
                    </Link>
                    
                    {/* Authentication links */}
                    {isAuthenticated ? (
                      <>
                        {isAdmin && (
                          <Link 
                            href="/admin"
                            onClick={() => setIsNavOpen(false)}
                            className="flex items-center px-3 py-2 text-base font-medium text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-md"
                          >
                            <Settings className="h-5 w-5 mr-2" />
                            Admin Dashboard
                          </Link>
                        )}
                        <Link 
                          href="/research"
                          onClick={() => setIsNavOpen(false)}
                          className="flex items-center px-3 py-2 text-base font-medium text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-md"
                        >
                          <BookOpen className="h-5 w-5 mr-2" />
                          Research
                        </Link>
                        <Link 
                          href="/user-dashboard"
                          onClick={() => setIsNavOpen(false)}
                          className="flex items-center px-3 py-2 text-base font-medium text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-md"
                        >
                          <User className="h-5 w-5 mr-2" />
                          Dashboard
                        </Link>
                        <a
                          href="/api/logout"
                          onClick={() => setIsNavOpen(false)}
                          className="flex w-full items-center px-3 py-2 text-base font-medium text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-md"
                        >
                          <LogOut className="h-5 w-5 mr-2" />
                          Logout
                        </a>
                      </>
                    ) : (
                      <a 
                        href="/api/login"
                        onClick={() => setIsNavOpen(false)}
                        className="flex items-center px-3 py-2 text-base font-medium text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-md"
                      >
                        <User className="h-5 w-5 mr-2" />
                        Login
                      </a>
                    )}
                  </div>
                  
                  {/* Search has been removed to make interface cleaner */}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}