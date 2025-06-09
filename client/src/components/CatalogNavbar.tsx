import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Filter, BarChart2, Info, Settings, X, BookOpen, Lock } from "lucide-react";
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
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin status on load
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await fetch('/api/admin/me', { credentials: 'include' });
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
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          email: 'admin@tvtantrum.com', 
          password: adminPassword 
        })
      });

      if (response.ok) {
        setIsAdmin(true);
        setShowAdminLogin(false);
        setAdminPassword("");
        window.location.href = '/admin/dashboard';
      } else {
        alert('Invalid admin password');
      }
    } catch (error) {
      alert('Login failed');
    }
  };

  return (
    <div className="bg-primary shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and main navigation */}
          <div className="flex items-center flex-1">
            <Link href="/" className="flex items-center space-x-2 text-white">
              <div className="bg-white/20 p-2 rounded-lg">
                <Home className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold hidden sm:block">TV Tantrum</span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8 ml-10">
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
                className={`${location === '/research' || location?.startsWith('/research/') ? 'text-white border-b-2 border-white' : 'text-white/80 hover:text-white'} font-medium px-1 py-4 flex items-center`}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Research
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Admin access for desktop */}
            {isAdmin ? (
              <Link 
                href="/admin/dashboard"
                className="hidden md:block text-white/80 hover:text-white font-medium px-3 py-2 rounded-md hover:bg-white/10 transition-colors flex items-center"
              >
                <Settings className="w-4 h-4 mr-2" />
                Admin
              </Link>
            ) : (
              <AlertDialog open={showAdminLogin} onOpenChange={setShowAdminLogin}>
                <AlertDialogTrigger asChild>
                  <button className="hidden md:block text-white/80 hover:text-white font-medium px-3 py-2 rounded-md hover:bg-white/10 transition-colors flex items-center">
                    <Lock className="w-4 h-4 mr-2" />
                    Admin
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Admin Access</AlertDialogTitle>
                    <AlertDialogDescription>
                      Enter the admin password to access the administration panel.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-4">
                    <input
                      type="password"
                      placeholder="Admin password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
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
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsNavOpen(!isNavOpen)}
              className="md:hidden text-white hover:text-white/80 p-2"
            >
              {isNavOpen ? <X className="h-6 w-6" /> : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isNavOpen && (
          <div className="md:hidden bg-white/10 backdrop-blur-sm rounded-lg mt-2 mb-4 p-4">
            <div className="space-y-2">
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
              
              {/* Admin access for mobile */}
              {isAdmin ? (
                <Link 
                  href="/admin/dashboard"
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
                  className="flex items-center px-3 py-2 text-base font-medium text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-md w-full text-left"
                >
                  <Lock className="h-5 w-5 mr-2" />
                  Admin
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}