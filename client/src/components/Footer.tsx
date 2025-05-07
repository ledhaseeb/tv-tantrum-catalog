import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-primary text-white py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:justify-between">
          <div className="mb-8 md:mb-0">
            <h2 className="text-xl font-heading font-bold mb-4">TV Tantrum</h2>
            <p className="text-white/80 max-w-md">
              Helping parents make informed decisions about the children's TV shows their kids watch. 
              Compare, review, and discover new content.
            </p>
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
                <li><Link href="/about" className="text-white/80 hover:text-white">About Us</Link></li>
                <li><Link href="/about#faq" className="text-white/80 hover:text-white">FAQ</Link></li>
                <li><Link href="#" className="text-white/80 hover:text-white">Blog</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider mb-4">Connect</h3>
              <ul className="space-y-2">
                <li><Link href="/about#contact" className="text-white/80 hover:text-white">Contact Us</Link></li>
                <li><Link href="#" className="text-white/80 hover:text-white">Subscribe</Link></li>
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
    </footer>
  );
}
