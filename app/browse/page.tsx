'use client'

import React, { useState, useEffect } from 'react'
import { ShowCard } from '@/components/show-card'
import { Show } from '@/lib/schema'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, X } from 'lucide-react'

export default function BrowsePage() {
  const [shows, setShows] = useState<Show[]>([])
  const [filteredShows, setFilteredShows] = useState<Show[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAge, setSelectedAge] = useState('')
  const [selectedStimulation, setSelectedStimulation] = useState('')
  const [selectedSort, setSelectedSort] = useState('name')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchShows = async () => {
      try {
        const response = await fetch('/api/shows')
        const data = await response.json()
        setShows(data)
        setFilteredShows(data)
      } catch (error) {
        console.error('Failed to fetch shows:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchShows()
  }, [])

  useEffect(() => {
    let filtered = shows.filter(show => {
      const matchesSearch = show.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          show.description?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesAge = !selectedAge
      
      const matchesStimulation = !selectedStimulation ||
                                (selectedStimulation === 'low' && show.stimulationScore <= 3) ||
                                (selectedStimulation === 'medium' && show.stimulationScore > 3 && show.stimulationScore <= 6) ||
                                (selectedStimulation === 'high' && show.stimulationScore > 6)

      return matchesSearch && matchesAge && matchesStimulation
    })

    // Apply sorting
    filtered.sort((a, b) => {
      switch (selectedSort) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'stimulation':
          return b.stimulationScore - a.stimulationScore
        case 'age':
          return a.minAge - b.minAge
        default:
          return 0
      }
    })

    setFilteredShows(filtered)
  }, [shows, searchTerm, selectedAge, selectedStimulation, selectedSort])

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedAge('')
    setSelectedStimulation('')
    setSelectedSort('name')
  }

  const activeFiltersCount = [searchTerm, selectedAge, selectedStimulation].filter(Boolean).length

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-lg">Loading shows...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Browse TV Shows</h1>
        <p className="text-xl text-muted-foreground mb-6">
          Discover the perfect show with our advanced filtering system
        </p>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary">{activeFiltersCount} active</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search shows..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Age Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Target Age</label>
                <Select value={selectedAge} onValueChange={setSelectedAge}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any age" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any age</SelectItem>
                    <SelectItem value="2">2+ years</SelectItem>
                    <SelectItem value="3">3+ years</SelectItem>
                    <SelectItem value="4">4+ years</SelectItem>
                    <SelectItem value="5">5+ years</SelectItem>
                    <SelectItem value="6">6+ years</SelectItem>
                    <SelectItem value="8">8+ years</SelectItem>
                    <SelectItem value="10">10+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Stimulation Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Stimulation Level</label>
                <Select value={selectedStimulation} onValueChange={setSelectedStimulation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any level</SelectItem>
                    <SelectItem value="low">Low (1-3)</SelectItem>
                    <SelectItem value="medium">Medium (4-6)</SelectItem>
                    <SelectItem value="high">High (7-10)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div>
                <label className="text-sm font-medium mb-2 block">Sort by</label>
                <Select value={selectedSort} onValueChange={setSelectedSort}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name A-Z</SelectItem>
                    <SelectItem value="stimulation">Stimulation Level</SelectItem>
                    <SelectItem value="age">Target Age</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {activeFiltersCount > 0 && (
              <div className="mt-4">
                <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
                  <X className="w-4 h-4" />
                  Clear all filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mb-4">
          <p className="text-muted-foreground">
            Showing {filteredShows.length} of {shows.length} shows
          </p>
        </div>

        {/* Show Grid */}
        {filteredShows.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredShows.map((show) => (
              <ShowCard key={show.id} show={show} />
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-xl text-muted-foreground mb-2">No shows found</p>
              <p className="text-muted-foreground">Try adjusting your filters to see more results</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}