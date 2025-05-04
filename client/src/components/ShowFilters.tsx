import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FiltersType {
  ageGroup?: string;
  tantrumFactor?: string; // We'll continue using this field name for continuity, but it maps to stimulationScore
  sortBy?: string;
  search?: string;
}

interface ShowFiltersProps {
  activeFilters: FiltersType;
  onFilterChange: (filters: FiltersType) => void;
  onClearFilters: () => void;
}

export default function ShowFilters({ activeFilters, onFilterChange, onClearFilters }: ShowFiltersProps) {
  const [filters, setFilters] = useState<FiltersType>(activeFilters);
  const [searchInput, setSearchInput] = useState(activeFilters.search || "");
  
  // Update local state when props change
  useEffect(() => {
    setFilters(activeFilters);
    setSearchInput(activeFilters.search || "");
  }, [activeFilters]);
  
  const handleFilterChange = (key: keyof FiltersType, value: string | undefined) => {
    const updatedFilters = { ...filters, [key]: value };
    setFilters(updatedFilters);
  };
  
  const handleApplyFilters = () => {
    // Include search term from input
    onFilterChange({ ...filters, search: searchInput });
  };
  
  const removeFilter = (key: keyof FiltersType) => {
    const updatedFilters = { ...filters };
    delete updatedFilters[key];
    
    // Also clear search input if removing search filter
    if (key === 'search') {
      setSearchInput("");
    }
    
    onFilterChange(updatedFilters);
  };
  
  // Get human-readable filter labels
  const getFilterLabel = (key: keyof FiltersType, value: string) => {
    switch (key) {
      case 'ageGroup':
        return `Age: ${value}`;
      case 'tantrumFactor':
        switch (value) {
          case 'low': return 'Low Stimulation Score (1-2)';
          case 'medium': return 'Medium Stimulation Score (3-4)';
          case 'high': return 'High Stimulation Score (5+)';
          default: return value;
        }
      case 'sortBy':
        switch (value) {
          case 'name': return 'Sorted by Name';
          case 'stimulation-score': return 'Sorted by Stimulation Score';
          case 'interactivity-level': return 'Sorted by Interactivity Level';
          case 'dialogue-intensity': return 'Sorted by Dialogue Intensity';
          case 'overall-rating': return 'Sorted by Rating';
          default: return value;
        }
      case 'search':
        return `Search: "${value}"`;
      default:
        return value;
    }
  };
  
  return (
    <Card className="mb-8 bg-white p-4 rounded-lg shadow">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-heading font-bold mb-4 md:mb-0">Filter Shows</h2>
          <div className="flex flex-wrap gap-4">
            <div>
              <Label htmlFor="age-group" className="block text-sm font-medium text-gray-700 mb-1">
                Age Group
              </Label>
              <Select 
                value={filters.ageGroup} 
                onValueChange={(value) => handleFilterChange('ageGroup', value)}
              >
                <SelectTrigger id="age-group" className="w-[140px]">
                  <SelectValue placeholder="All Ages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ages</SelectItem>
                  <SelectItem value="0-2">0-2 years</SelectItem>
                  <SelectItem value="3-5">3-5 years</SelectItem>
                  <SelectItem value="6-8">6-8 years</SelectItem>
                  <SelectItem value="9+">9+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="tantrum-factor" className="block text-sm font-medium text-gray-700 mb-1">
                Stimulation Score
              </Label>
              <Select 
                value={filters.tantrumFactor} 
                onValueChange={(value) => handleFilterChange('tantrumFactor', value)}
              >
                <SelectTrigger id="tantrum-factor" className="w-[140px]">
                  <SelectValue placeholder="Any Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Level</SelectItem>
                  <SelectItem value="low">Low (1-2)</SelectItem>
                  <SelectItem value="medium">Medium (3-4)</SelectItem>
                  <SelectItem value="high">High (5+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </Label>
              <Select 
                value={filters.sortBy} 
                onValueChange={(value) => handleFilterChange('sortBy', value)}
              >
                <SelectTrigger id="sort-by" className="w-[180px]">
                  <SelectValue placeholder="Name" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="stimulation-score">Stimulation Score</SelectItem>
                  <SelectItem value="interactivity-level">Interactivity Level</SelectItem>
                  <SelectItem value="dialogue-intensity">Dialogue Intensity</SelectItem>
                  <SelectItem value="overall-rating">Overall Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="self-end">
              <Button type="button" onClick={handleApplyFilters}>
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="mb-2">
            <Label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </Label>
            <div className="flex gap-2">
              <Input
                id="search"
                type="search"
                placeholder="Search shows..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full md:w-auto"
              />
              <Button type="button" onClick={handleApplyFilters} className="shrink-0">
                Search
              </Button>
            </div>
          </div>
          
          {/* Active Filters */}
          {Object.keys(activeFilters).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 items-center">
              {Object.entries(activeFilters).map(([key, value]) => {
                if (!value) return null;
                return (
                  <Badge 
                    key={key} 
                    variant="secondary" 
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                  >
                    {getFilterLabel(key as keyof FiltersType, value)}
                    <button 
                      type="button" 
                      className="ml-1 focus:outline-none"
                      onClick={() => removeFilter(key as keyof FiltersType)}
                    >
                      <i className="fas fa-times-circle"></i>
                    </button>
                  </Badge>
                );
              })}
              <Button 
                variant="link" 
                size="sm" 
                className="text-primary-600 hover:text-primary-800"
                onClick={onClearFilters}
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
