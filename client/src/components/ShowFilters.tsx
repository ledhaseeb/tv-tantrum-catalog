import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useQuery } from "@tanstack/react-query";
import { TvShow } from "@shared/schema";
import { Search, CheckIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface FiltersType {
  ageGroup?: string;
  tantrumFactor?: string; // We'll continue using this field name for continuity, but it maps to stimulationScore
  sortBy?: string;
  search?: string;
  themes?: string[];
  interactionLevel?: string;
  dialogueIntensity?: string;
  soundFrequency?: string;
  stimulationScoreRange?: {min: number, max: number};
}

interface ShowFiltersProps {
  activeFilters: FiltersType;
  onFilterChange: (filters: FiltersType) => void;
  onClearFilters: () => void;
}

export default function ShowFilters({ activeFilters, onFilterChange, onClearFilters }: ShowFiltersProps) {
  const [filters, setFilters] = useState<FiltersType>(activeFilters);
  const [searchInput, setSearchInput] = useState(activeFilters.search || "");
  const [selectedThemes, setSelectedThemes] = useState<string[]>(activeFilters.themes || []);
  const [openAutoComplete, setOpenAutoComplete] = useState(false);
  
  // Fetch shows for autocomplete
  const { data: shows } = useQuery<TvShow[]>({
    queryKey: ['/api/shows'],
    staleTime: 300000, // 5 minutes
  });
  
  // Common themes from the database
  const commonThemes = [
    "Adventure",
    "African Kids tales",
    "Animals",
    "American Sign Language",
    "Animal Behavior",
    "Cause and Effect",
    "Conflict Resolution",
    "Creativity & Imagination",
    "Critical Thinking",
    "Cultural & Social",
    "Curiosity",
    "Dance",
    "Discovery",
    "Early Childhood experiences",
    "Educational",
    "Emotional Intelligence",
    "Engineering Concepts",
    "Entertainment",
    "Environmental Awareness",
    "Exercise",
    "Exploration",
    "Family Relationships",
    "Family Values",
    "Fantasy Elements",
    "Farm Life",
    "Friendship",
    "Global Thinking",
    "Healthy Eating",
    "Humor",
    "Language Learning",
    "Life Lessons",
    "Literacy",
    "Mechanics",
    "Motor Skills",
    "Music",
    "Nature",
    "Numeracy",
    "Outdoor Exploration",
    "Perseverance",
    "Positive Role Models",
    "Preschool-Basics",
    "Problem Solving",
    "Relatable Situations",
    "Repetitive Learning",
    "Safety",
    "Science",
    "Social-Emotional",
    "STEM",
    "Teamwork"
  ];
  
  // Update local state when props change
  useEffect(() => {
    setFilters(activeFilters);
    setSearchInput(activeFilters.search || "");
    setSelectedThemes(activeFilters.themes || []);
  }, [activeFilters]);
  
  const handleFilterChange = (key: keyof FiltersType, value: any) => {
    const updatedFilters = { ...filters, [key]: value };
    setFilters(updatedFilters);
  };
  
  const handleThemeToggle = (theme: string) => {
    let newThemes: string[];
    
    if (selectedThemes.includes(theme)) {
      newThemes = selectedThemes.filter(t => t !== theme);
    } else {
      newThemes = [...selectedThemes, theme];
    }
    
    setSelectedThemes(newThemes);
    handleFilterChange('themes', newThemes.length ? newThemes : undefined);
  };
  
  const handleApplyFilters = () => {
    // Include search term from input
    onFilterChange({ 
      ...filters, 
      search: searchInput,
      themes: selectedThemes.length ? selectedThemes : undefined
    });
  };
  
  const removeFilter = (key: keyof FiltersType) => {
    const updatedFilters = { ...filters };
    delete updatedFilters[key];
    
    // Also clear search input if removing search filter
    if (key === 'search') {
      setSearchInput("");
    }
    
    // Clear selected themes if removing themes filter
    if (key === 'themes') {
      setSelectedThemes([]);
    }
    
    onFilterChange(updatedFilters);
  };
  
  // Get human-readable filter labels
  const getFilterLabel = (key: keyof FiltersType, value: any) => {
    switch (key) {
      case 'ageGroup':
        return `Age: ${value}`;
      case 'tantrumFactor':
        switch (value) {
          case 'Low': return 'Low Stimulation Score (1-2)';
          case 'Medium': return 'Medium Stimulation Score (3-4)';
          case 'High': return 'High Stimulation Score (5+)';
          default: return value;
        }
      case 'interactionLevel':
        return `Interaction Level: ${value}`;
      case 'dialogueIntensity':
        return `Dialogue Intensity: ${value}`;
      case 'soundFrequency':
        return `Sound Frequency: ${value}`;
      case 'stimulationScoreRange':
        const range = value as {min: number, max: number};
        if (range.min === range.max) {
          return `Stimulation Score: ${range.min}`;
        } else {
          return `Stimulation Score: ${range.min}-${range.max}`;
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
      case 'themes':
        if (Array.isArray(value) && value.length === 1) {
          return `Theme: ${value[0]}`;
        } else if (Array.isArray(value) && value.length > 1) {
          return `Themes: ${value[0]} +${value.length - 1}`;
        }
        return 'Themes';
      default:
        return value;
    }
  };
  
  return (
    <Card className="mb-8 bg-white rounded-lg shadow">
      <CardContent className="p-6">
        <h2 className="text-xl font-heading font-bold mb-6">Filters</h2>
        
        <div className="space-y-6">
          {/* Search by show name with autocomplete */}
          <div>
            <Label htmlFor="show-name" className="block text-sm font-medium text-gray-700 mb-2">
              Show Name
            </Label>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                console.log('Search form submitted with term:', searchInput);
                handleFilterChange('search', searchInput);
                const updatedFilters = {
                  ...filters,
                  search: searchInput
                };
                console.log('Applying filters:', updatedFilters);
                onFilterChange(updatedFilters);
              }}
              className="flex"
            >
              <div className="relative flex-grow">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="show-name"
                  placeholder="Enter show title..."
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                  }}
                  className="w-full pl-8 rounded-r-none"
                />
              </div>
              <Button 
                type="submit" 
                className="rounded-l-none"
              >
                Search
              </Button>
            </form>
              
            {/* Show matching results based on searchInput */}
            {searchInput.trim().length > 0 && (
              <div className="relative mt-1">
                <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto border border-gray-200">
                  <div className="py-1">
                    {shows
                      ?.filter(show => {
                        // Skip if no search input
                        if (!searchInput.trim()) return false;
                        
                        const searchLower = searchInput.toLowerCase().trim();
                        const nameLower = show.name.toLowerCase();
                        
                        // Direct match in name
                        if (nameLower.includes(searchLower)) return true;
                        
                        // Handle shows with year ranges (e.g., "Show Name 2018-present")
                        const nameWithoutYears = nameLower.replace(/\s+\d{4}(-\d{4}|-present)?/g, '');
                        if (nameWithoutYears.includes(searchLower)) return true;
                        
                        // Match any part of a word (for show names like "Blue's Clues")
                        const words = nameLower.split(/\s+/);
                        if (words.some(word => word.includes(searchLower))) return true;
                        
                        // Handle apostrophes and special characters
                        const simplifiedName = nameLower.replace(/[''\.]/g, '');
                        if (simplifiedName.includes(searchLower)) return true;
                        
                        return false;
                      })
                      .slice(0, 8)
                      .map(show => (
                        <div
                          key={show.id}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            console.log('Selecting show from dropdown:', show.name);
                            setSearchInput(show.name);
                            handleFilterChange('search', show.name);
                            const updatedFilters = {
                              ...filters,
                              search: show.name
                            };
                            console.log('Applying updated filters from dropdown selection:', updatedFilters);
                            onFilterChange(updatedFilters);
                          }}
                        >
                          <div className="font-medium">{show.name}</div>
                          <div className="text-xs text-gray-500">
                            Ages: {show.ageRange || 'Unknown'} 
                            {show.releaseYear ? ` • (${show.releaseYear})` : ''}
                          </div>
                        </div>
                      ))
                    }
                    
                    {shows?.filter(show => {
                      const searchLower = searchInput.toLowerCase().trim();
                      const nameLower = show.name.toLowerCase();
                      
                      // Direct match
                      if (nameLower.includes(searchLower)) return true;
                      
                      // Without years
                      const nameWithoutYears = nameLower.replace(/\s+\d{4}(-\d{4}|-present)?/g, '');
                      if (nameWithoutYears.includes(searchLower)) return true;
                      
                      // Within words
                      const words = nameLower.split(/\s+/);
                      if (words.some(word => word.includes(searchLower))) return true;
                      
                      // Simplified name
                      const simplifiedName = nameLower.replace(/[''\.]/g, '');
                      if (simplifiedName.includes(searchLower)) return true;
                      
                      return false;
                    }).length === 0 && (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        No shows match your search
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Age Range Radio Buttons */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Age Range
            </Label>
            <RadioGroup 
              value={filters.ageGroup} 
              onValueChange={(value) => handleFilterChange('ageGroup', value)}
              className="space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Any Age" id="any-age" />
                <Label htmlFor="any-age">Any Age</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="0-2" id="toddler" />
                <Label htmlFor="toddler">Toddler (0-2)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="3-5" id="preschool" />
                <Label htmlFor="preschool">Preschool (3-5)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="6-8" id="early-elem" />
                <Label htmlFor="early-elem">Early Elem. (6-8)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="9-12" id="late-elem" />
                <Label htmlFor="late-elem">Late Elem. (9-12)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="13+" id="teen" />
                <Label htmlFor="teen">Teen (13+)</Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* Themes checkboxes */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Themes
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1 gap-x-4 max-h-[200px] overflow-y-auto">
              {commonThemes.map((theme) => (
                <div key={theme} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`theme-${theme.toLowerCase().replace(/\s+/g, '-')}`}
                    checked={selectedThemes.includes(theme)}
                    onCheckedChange={() => handleThemeToggle(theme)} 
                  />
                  <Label 
                    htmlFor={`theme-${theme.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-sm"
                  >
                    {theme}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Interaction Level */}
          <div>
            <Label htmlFor="interaction-level" className="block text-sm font-medium text-gray-700 mb-1">
              Interaction Level
            </Label>
            <Select 
              value={filters.interactionLevel} 
              onValueChange={(value) => handleFilterChange('interactionLevel', value)}
            >
              <SelectTrigger id="interaction-level">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Any">Any</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Moderate-Low">Moderate-Low</SelectItem>
                <SelectItem value="Moderate">Moderate</SelectItem>
                <SelectItem value="Moderate-High">Moderate-High</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dialogue Intensity */}
          <div>
            <Label htmlFor="dialogue-intensity" className="block text-sm font-medium text-gray-700 mb-1">
              Dialogue Intensity
            </Label>
            <Select 
              value={filters.dialogueIntensity} 
              onValueChange={(value) => handleFilterChange('dialogueIntensity', value)}
            >
              <SelectTrigger id="dialogue-intensity">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Any">Any</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Moderate-Low">Moderate-Low</SelectItem>
                <SelectItem value="Moderate">Moderate</SelectItem>
                <SelectItem value="Moderate-High">Moderate-High</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sound Frequency */}
          <div>
            <Label htmlFor="sound-frequency" className="block text-sm font-medium text-gray-700 mb-1">
              Sound Frequency
            </Label>
            <Select 
              value={filters.soundFrequency} 
              onValueChange={(value) => handleFilterChange('soundFrequency', value)}
            >
              <SelectTrigger id="sound-frequency">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Any">Any</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Moderate-Low">Moderate-Low</SelectItem>
                <SelectItem value="Moderate">Moderate</SelectItem>
                <SelectItem value="Moderate-High">Moderate-High</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Stimulation Score Range - always visible */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">
              Stimulation Score Range
            </Label>
            <div className="flex flex-col space-y-4">
              {/* Min slider */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium">Minimum: {filters.stimulationScoreRange?.min || 1}</span>
                </div>
                <div className="relative pt-1">
                  <input 
                    type="range" 
                    min="1" 
                    max="5" 
                    step="1" 
                    value={filters.stimulationScoreRange?.min || 1}
                    onChange={(e) => {
                      const newMin = parseInt(e.target.value);
                      const currentMax = filters.stimulationScoreRange?.max || 5;
                      handleFilterChange('stimulationScoreRange', {
                        min: newMin,
                        max: Math.max(newMin, currentMax) // Ensure max is at least equal to min
                      });
                    }}
                    className="w-full appearance-none rounded-full h-2 bg-gray-200 outline-none accent-green-600" 
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                </div>
              </div>
              
              {/* Max slider */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium">Maximum: {filters.stimulationScoreRange?.max || 5}</span>
                </div>
                <div className="relative pt-1">
                  <input 
                    type="range" 
                    min="1" 
                    max="5" 
                    step="1" 
                    value={filters.stimulationScoreRange?.max || 5}
                    onChange={(e) => {
                      const newMax = parseInt(e.target.value);
                      const currentMin = filters.stimulationScoreRange?.min || 1;
                      handleFilterChange('stimulationScoreRange', {
                        min: Math.min(currentMin, newMax), // Ensure min is at most equal to max
                        max: newMax
                      });
                    }}
                    className="w-full appearance-none rounded-full h-2 bg-gray-200 outline-none accent-green-600" 
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                </div>
              </div>
              
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span className="font-medium text-green-600">Low</span>
                <span className="font-medium text-yellow-600">Medium</span>
                <span className="font-medium text-red-600">High</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button type="button" onClick={handleApplyFilters} className="w-full bg-green-600 hover:bg-green-700">
              Apply Filters
            </Button>
            {Object.keys(filters).length > 0 && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClearFilters} 
                className="w-full"
              >
                Reset All Filters
              </Button>
            )}
          </div>
        </div>
        
        {/* Active Filters Display */}
        {Object.keys(activeFilters).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            {Object.entries(activeFilters).map(([key, value]) => {
              if (!value || (Array.isArray(value) && value.length === 0)) return null;
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
