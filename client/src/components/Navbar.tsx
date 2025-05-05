import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Navbar() {
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to browse page with search term as query param
    window.location.href = `/browse?search=${encodeURIComponent(searchTerm)}`;
  };

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
              <form onSubmit={handleSearch} className="relative">
                <Input 
                  type="search" 
                  placeholder="Search shows..." 
                  className="border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit" className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <i className="fas fa-search text-gray-400"></i>
                </button>
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
