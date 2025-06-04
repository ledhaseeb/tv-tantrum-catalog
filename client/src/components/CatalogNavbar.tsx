import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Search, Home, Filter, BarChart2, Info, Settings, X, BookOpen, Lock } from "lucide-react";
import type { TvShow } from "../../../shared/catalog-schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function CatalogNavbar() {
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin status on load
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await fetch('/api/auth/admin-check', { credentials: 'include' });
        if (response.ok) {
          setIsAdmin(true);
        }
      } catch (error) {
        // Not admin, ignore
      }
    };
    checkAdminStatus();
  }, []);

  // Handle admin login
  const handleAdminLogin = async () => {
    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: adminPassword })
      });
      
      if (response.ok) {
        setIsAdmin(true);
        setShowAdminLogin(false);
        setAdminPassword("");
      } else {
        alert('Invalid admin password');
      }
    } catch (error) {
      alert('Login failed');
    }
  };

  // Fetch shows for search dropdown
  const { data: shows } = useQuery({
    queryKey: ['/api/tv-shows'],
    queryFn: async () => {
      const response = await fetch('/api/tv-shows');
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
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-2xl font-heading font-bold" style={{ color: "#F6CB59" }}>TV Tantrum</h1>
            </Link>
            <nav className="hidden md:ml-10 md:flex space-x-8">
              <Link 
                href="/"
                className={`${location === '/' ? 'text-white border-b-2 border-white' : 'text-white/80 hover:text-white'} font-medium px-1 py-4 flex items-center`}
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
                href="/about"
                className={`${location === '/about' ? 'text-white border-b-2 border-white' : 'text-white/80 hover:text-white'} font-medium px-1 py-4 flex items-center`}
              >
                <Info className="w-4 h-4 mr-2" />
                About
              </Link>
              <Link 
                href="/research"
                className={`${location === '/research' ? 'text-white border-b-2 border-white' : 'text-white/80 hover:text-white'} font-medium px-1 py-4 flex items-center`}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Research
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Search bar */}
            <div className="hidden md:block relative">
              <form onSubmit={handleSearch} className="relative">
                <Input
                  type="text"
                  placeholder="Search shows..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowResults(e.target.value.trim().length > 0);
                  }}
                  className="w-64 pl-10 pr-4 py-2 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white focus:text-gray-900 focus:placeholder:text-gray-500"
                  onClick={(e) => e.stopPropagation()}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
              </form>
              
              {/* Search results dropdown */}
              {showResults && filteredShows && filteredShows.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                  {filteredShows.map((show) => (
                    <Link
                      key={show.id}
                      href={`/show/${show.id}`}
                      className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      onClick={() => {
                        setShowResults(false);
                        setSearchTerm("");
                      }}
                    >
                      <div className="flex items-center">
                        {show.imageUrl && (
                          <img 
                            src={show.imageUrl} 
                            alt={show.name}
                            className="w-12 h-12 object-cover rounded mr-3"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{show.name}</div>
                          <div className="text-sm text-gray-500">Age: {show.ageRange}</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Admin access */}
            <div className="hidden md:flex items-center gap-3">
              {isAdmin ? (
                <Link href="/admin">
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-1 text-white/90 hover:text-white hover:bg-primary-700"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Admin</span>
                  </Button>
                </Link>
              ) : (
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-1 text-white/90 hover:text-white hover:bg-primary-700"
                  onClick={() => setShowAdminLogin(true)}
                >
                  <Lock className="h-4 w-4" />
                  <span>Admin</span>
                </Button>
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
            
            {/* Mobile navigation overlay */}
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
                    <Link href="/" onClick={() => setIsNavOpen(false)}>
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
                      href="/"
                      onClick={() => setIsNavOpen(false)}
                      className={`flex items-center px-3 py-2 text-base font-medium ${location === '/' ? 'text-primary-600 bg-primary-50' : 'text-gray-500 hover:text-primary-600 hover:bg-primary-50'} rounded-md`}
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
                      href="/about"
                      onClick={() => setIsNavOpen(false)}
                      className={`flex items-center px-3 py-2 text-base font-medium ${location === '/about' ? 'text-primary-600 bg-primary-50' : 'text-gray-500 hover:text-primary-600 hover:bg-primary-50'} rounded-md`}
                    >
                      <Info className="h-5 w-5 mr-3" />
                      About
                    </Link>
                    <Link 
                      href="/research"
                      onClick={() => setIsNavOpen(false)}
                      className={`flex items-center px-3 py-2 text-base font-medium ${location === '/research' ? 'text-primary-600 bg-primary-50' : 'text-gray-500 hover:text-primary-600 hover:bg-primary-50'} rounded-md`}
                    >
                      <BookOpen className="h-5 w-5 mr-3" />
                      Research
                    </Link>
                    
                    {/* Mobile search */}
                    <div className="px-3 py-2">
                      <form onSubmit={handleSearch}>
                        <Input
                          type="text"
                          placeholder="Search shows..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full"
                        />
                      </form>
                    </div>
                    
                    {/* Admin access for mobile */}
                    {isAdmin ? (
                      <Link 
                        href="/admin"
                        onClick={() => setIsNavOpen(false)}
                        className="flex items-center px-3 py-2 text-base font-medium text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-md"
                      >
                        <Settings className="h-5 w-5 mr-2" />
                        Admin
                      </Link>
                    ) : (
                      <button
                        onClick={() => {
                          setIsNavOpen(false);
                          setShowAdminLogin(true);
                        }}
                        className="flex w-full items-center px-3 py-2 text-base font-medium text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-md"
                      >
                        <Lock className="h-5 w-5 mr-2" />
                        Admin
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Admin login dialog */}
      <AlertDialog open={showAdminLogin} onOpenChange={setShowAdminLogin}>
        <AlertDialogContent className="max-w-sm mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Admin Access</AlertDialogTitle>
            <AlertDialogDescription>
              Enter the admin password to access the management panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Input
              type="password"
              placeholder="Admin password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAdminLogin();
                }
              }}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAdminLogin}>
              Login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}