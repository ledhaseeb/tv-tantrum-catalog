import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:justify-between">
          <div className="mb-8 md:mb-0">
            <h2 className="text-xl font-heading font-bold mb-4">KidTV Guide</h2>
            <p className="text-gray-300 max-w-md">
              Helping parents make informed decisions about the children's TV shows their kids watch. 
              Compare, review, and discover new content.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Explore</h3>
              <ul className="space-y-2">
                <li><Link href="/"><a className="text-gray-300 hover:text-white">Browse Shows</a></Link></li>
                <li><Link href="/compare"><a className="text-gray-300 hover:text-white">Compare Shows</a></Link></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Top Rated</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Recently Added</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><Link href="/about"><a className="text-gray-300 hover:text-white">About Us</a></Link></li>
                <li><a href="#" className="text-gray-300 hover:text-white">FAQ</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Contribute</a></li>
                <li>
                  <a 
                    href="https://github.com/tvtantrum/tvtantrum" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-gray-300 hover:text-white"
                  >
                    GitHub Repo
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Connect</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white">Contact Us</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Twitter</a></li>
                <li>
                  <a 
                    href="https://github.com/tvtantrum/tvtantrum" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-gray-300 hover:text-white"
                  >
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-700 md:flex md:items-center md:justify-between">
          <div className="flex space-x-6 md:order-2">
            <a 
              href="https://github.com/tvtantrum/tvtantrum" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-400 hover:text-gray-300"
            >
              <i className="fab fa-github"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-300">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-300">
              <i className="fab fa-linkedin"></i>
            </a>
          </div>
          <p className="mt-8 md:mt-0 md:order-1 text-gray-400">
            &copy; {new Date().getFullYear()} KidTV Guide. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
