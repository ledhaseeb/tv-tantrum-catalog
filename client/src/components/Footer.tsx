import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import LeaderboardFooter from "./LeaderboardFooter";

export default function Footer() {
  const { user, isApproved } = useAuth();
  
  // Determine the about page URL based on login and approval status
  const aboutPageUrl = user && isApproved ? "/app-about" : "/about";
  
  return (
    <footer className="text-white mt-auto">
      {/* Leaderboard section - only show for logged in and approved users */}
      {user && isApproved && <LeaderboardFooter />}
      
      <div className="bg-primary py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:justify-between">
            <div className="mb-8 md:mb-0">
              <h2 className="text-xl font-heading font-bold mb-4">TV Tantrum</h2>
              <p className="text-white/80 max-w-md">
                Helping parents make informed decisions about the children's TV shows their kids watch. 
                Compare, review, and discover new content.
              </p>
              
              {/* Add gamification links if user is approved */}
              {user && isApproved && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider mb-2">Earn Points</h3>
                  <div className="flex flex-wrap gap-2">
                    <Link href="/dashboard" className="text-xs bg-white/10 hover:bg-white/20 rounded-full px-3 py-1">
                      Dashboard
                    </Link>
                    <Link href="/submit-show" className="text-xs bg-white/10 hover:bg-white/20 rounded-full px-3 py-1">
                      Submit Show
                    </Link>
                    <Link href="/research" className="text-xs bg-white/10 hover:bg-white/20 rounded-full px-3 py-1">
                      Research
                    </Link>
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider mb-4">Explore</h3>
                <ul className="space-y-2">
                  <li><Link href="/" className="text-white/80 hover:text-white">Home</Link></li>
                  <li><Link href="/browse" className="text-white/80 hover:text-white">Browse Shows</Link></li>
                  <li><Link href="/compare" className="text-white/80 hover:text-white">Compare Shows</Link></li>
                  <li><Link href="/browse?sortBy=popular" className="text-white/80 hover:text-white">Popular Shows</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider mb-4">Resources</h3>
                <ul className="space-y-2">
                  <li><Link href={aboutPageUrl} className="text-white/80 hover:text-white">About Us</Link></li>
                  {user && isApproved && (
                    <li><Link href="/research" className="text-white/80 hover:text-white">Research Summaries</Link></li>
                  )}
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider mb-4">Connect</h3>
                <ul className="space-y-2">
                  <li><Link href={aboutPageUrl} className="text-white/80 hover:text-white">Contact Us</Link></li>
                  {user && isApproved && (
                    <li><Link href="/dashboard" className="text-white/80 hover:text-white">User Dashboard</Link></li>
                  )}
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/20 md:flex md:items-center md:justify-between">
            <div className="flex space-x-6 md:order-2">
              <a 
                href="#" 
                className="text-white/70 hover:text-white"
              >
                <i className="fas fa-envelope"></i>
              </a>
            </div>
            <p className="mt-8 md:mt-0 md:order-1 text-white/70">
              &copy; {new Date().getFullYear()} TV Tantrum. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
