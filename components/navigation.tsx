import React from 'react'
import Link from 'next/link'
import { Search, Menu } from 'lucide-react'

export function Navigation() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-primary">TV Tantrum</div>
            </Link>
            
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/browse" className="text-foreground/80 hover:text-foreground transition-colors">
                Browse Shows
              </Link>
              <Link href="/research" className="text-foreground/80 hover:text-foreground transition-colors">
                Research
              </Link>
              <Link href="/compare" className="text-foreground/80 hover:text-foreground transition-colors">
                Compare
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <button className="md:hidden">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}