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
import { Slider } from "@/components/ui/slider";
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
import { Search, CheckIcon, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface FiltersType {
  ageGroup?: string;
  ageRange?: {min: number, max: number};
  tantrumFactor?: string; // We'll continue using this field name for continuity, but it maps to stimulationScore
  sortBy?: string;
  search?: string;
  themes?: string[];
  themeMatchMode?: 'AND' | 'OR';
  interactionLevel?: string;
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
  const [themeMatchMode, setThemeMatchMode] = useState<'AND' | 'OR'>(activeFilters.themeMatchMode || 'AND');
  const [openAutoComplete, setOpenAutoComplete] = useState(false);
  
  // Fetch shows for autocomplete and theme analysis
  const { data: shows } = useQuery<TvShow[]>({
    queryKey: ['/api/tv-shows'],
    staleTime: 300000, // 5 minutes
  });
  
  // Computed state for relevant secondary themes based on the primary theme
  const [relevantSecondaryThemes, setRelevantSecondaryThemes] = useState<string[]>([]);
  
  // Common themes extracted dynamically from the database
  const [commonThemes, setCommonThemes] = useState<string[]>([]);
  
  // Extract all themes from the database when shows data is loaded
  useEffect(() => {
    if (!shows || !Array.isArray(shows)) return;
    
    const allThemes = new Set<string>();
    
    shows.forEach(show => {
      if (show.themes && Array.isArray(show.themes)) {
        show.themes.forEach(theme => {
          if (theme && theme.trim() !== '') {
            allThemes.add(theme.trim());
          }
        });
      }
    });
    
    // Convert to array and sort alphabetically
    const sortedThemes = Array.from(allThemes).sort();
    console.log(`Found ${sortedThemes.length} unique themes in the database`);
    
    setCommonThemes(sortedThemes);
  }, [shows]);
  
  // Update local state when props change
  useEffect(() => {
    setFilters(activeFilters);
    setSearchInput(activeFilters.search || "");
    setSelectedThemes(activeFilters.themes || []);
  }, [activeFilters]);
  
  // Update relevant secondary themes when shows data loads, selected themes change, or theme match mode changes
  useEffect(() => {
    if (shows && selectedThemes.length > 0) {
      // For OR mode, display all available themes
      // For AND mode, display only co-existing themes
      if (themeMatchMode === 'OR') {
        setRelevantSecondaryThemes(commonThemes.filter(theme => !selectedThemes.includes(theme)));
      } else {
        findRelevantSecondaryThemes(selectedThemes[0]);
      }
    } else {
      // Reset if no primary theme is selected
      setRelevantSecondaryThemes([]);
    }
  }, [shows, selectedThemes[0], themeMatchMode, commonThemes]);
  
  // Log for debugging
  useEffect(() => {
    console.log("Current filters in ShowFilters component:", filters);
  }, [filters]);
  
  // Find relevant secondary themes based on shows that have the primary theme
  const findRelevantSecondaryThemes = (primaryTheme: string) => {
    if (!shows || !primaryTheme || primaryTheme === "any") {
      setRelevantSecondaryThemes([]);
      return;
    }

    try {
      console.log(`Finding relevant secondary themes for primary theme: ${primaryTheme}`);

      // Normalize the primary theme for consistent matching
      const normalizedPrimaryTheme = primaryTheme.trim().toLowerCase();

      // Create a safe copy to avoid runtime errors
      let showsWithPrimaryTheme: TvShow[] = [];

      // Ensure we're getting exact matches or close matches for themes
      const exactMatches = shows.filter(show => {
        if (!show || !show.themes || !Array.isArray(show.themes)) return false;
        
        // Case-insensitive matching for themes
        return show.themes.some(theme => 
          theme && 
          typeof theme === 'string' &&
          theme.trim().toLowerCase() === normalizedPrimaryTheme
        );
      });
      
      showsWithPrimaryTheme = [...exactMatches];
      console.log(`Found ${showsWithPrimaryTheme.length} shows with exact match for theme: ${primaryTheme}`);
      
      // If no exact matches, try partial matches (contains)
      if (showsWithPrimaryTheme.length === 0) {
        const partialMatches = shows.filter(show => {
          if (!show || !show.themes || !Array.isArray(show.themes)) return false;
          
          return show.themes.some(theme => 
            theme && 
            typeof theme === 'string' &&
            theme.trim().toLowerCase().includes(normalizedPrimaryTheme)
          );
        });
        
        console.log(`Found ${partialMatches.length} shows with partial match for theme: ${primaryTheme}`);
        
        // Add partial matches if found
        if (partialMatches.length > 0) {
          showsWithPrimaryTheme = [...partialMatches];
        }
      }

      // Count occurrences of each secondary theme
      const themeCounts: Record<string, number> = {};
      
      // Safely process the shows
      showsWithPrimaryTheme.forEach(show => {
        if (!show || !show.themes || !Array.isArray(show.themes)) return;
        
        show.themes.forEach(theme => {
          if (!theme || typeof theme !== 'string' || theme.trim() === "") return;
          
          // Skip the primary theme (exact or case-insensitive match)
          const themeNormalized = theme.trim();
          const themeLower = themeNormalized.toLowerCase();
          
          if (themeLower !== normalizedPrimaryTheme && 
              themeLower !== primaryTheme.toLowerCase()) {
            themeCounts[themeNormalized] = (themeCounts[themeNormalized] || 0) + 1;
          }
        });
      });

      // Sort themes by frequency (most frequent first)
      const sortedThemes = Object.entries(themeCounts)
        .sort((a, b) => b[1] - a[1])  // Sort by count
        .map(([theme]) => theme);     // Take just the theme name

      console.log(`Found ${sortedThemes.length} relevant secondary themes for ${primaryTheme}`);
      
      // Only show themes that actually co-exist with the primary theme
      // If none are found, don't show any secondary theme options
      setRelevantSecondaryThemes(sortedThemes);
    } catch (error) {
      console.error("Error finding relevant secondary themes:", error);
      // Fallback to empty array on error
      setRelevantSecondaryThemes([]);
    }
  };
  
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
      case 'ageRange':
        const ageRange = value as {min: number, max: number};
        if (ageRange.min === 0 && ageRange.max === 13) {
          return 'Age: Any';
        } else if (ageRange.max === 13) {
          return `Age: ${ageRange.min}+`;
        } else {
          return `Age: ${ageRange.min}-${ageRange.max}`;
        }
      case 'tantrumFactor':
        switch (value) {
          case 'low': return 'Low Stimulation (1)';
          case 'low-medium': return 'Low-Medium Stimulation (2)';
          case 'medium': return 'Medium Stimulation (3)';
          case 'medium-high': return 'Medium-High Stimulation (4)';
          case 'high': return 'High Stimulation (5)';
          default: return value;
        }
      case 'interactionLevel':
        return `Interaction Level: ${value}`;
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
          case 'overall-rating': return 'Sorted by Rating';
          case 'popular': return 'Sorted by Popularity';
          default: return value;
        }
      case 'search':
        return `Search: "${value}"`;
      case 'themes':
        if (Array.isArray(value) && value.length === 1) {
          return `Theme: ${value[0]}`;
        } else if (Array.isArray(value) && value.length === 2) {
          return `Themes: ${value[0]}, ${value[1]}`;
        } else if (Array.isArray(value) && value.length === 3) {
          return `Themes: ${value[0]}, ${value[1]}, ${value[2]}`;
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
          
          {/* Age Range - using separate min/max sliders */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">
              Age Range
            </Label>
            <div className="flex flex-col space-y-4">
              {/* Min slider */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium">Minimum: {filters.ageRange?.min || 0} years</span>
                </div>
                <div className="relative pt-1">
                  <input 
                    type="range" 
                    min="0" 
                    max="13" 
                    step="1" 
                    value={filters.ageRange?.min || 0}
                    onChange={(e) => {
                      const newMin = parseInt(e.target.value);
                      const currentMax = filters.ageRange?.max || 13;
                      handleFilterChange('ageRange', {
                        min: newMin,
                        max: Math.max(newMin, currentMax) // Ensure max is at least equal to min
                      });
                    }}
                    className="w-full appearance-none rounded-full h-2 bg-gray-200 outline-none accent-green-600" 
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                  <span>0</span>
                  <span>2</span>
                  <span>4</span>
                  <span>6</span>
                  <span>8</span>
                  <span>10</span>
                  <span>13</span>
                </div>
              </div>
              
              {/* Max slider */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium">Maximum: {filters.ageRange?.max === 13 ? '13+' : filters.ageRange?.max || 13} years</span>
                </div>
                <div className="relative pt-1">
                  <input 
                    type="range" 
                    min="0" 
                    max="13" 
                    step="1" 
                    value={filters.ageRange?.max || 13}
                    onChange={(e) => {
                      const newMax = parseInt(e.target.value);
                      const currentMin = filters.ageRange?.min || 0;
                      handleFilterChange('ageRange', {
                        min: Math.min(currentMin, newMax), // Ensure min is at most equal to max
                        max: newMax
                      });
                    }}
                    className="w-full appearance-none rounded-full h-2 bg-gray-200 outline-none accent-green-600" 
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                  <span>0</span>
                  <span>2</span>
                  <span>4</span>
                  <span>6</span>
                  <span>8</span>
                  <span>10</span>
                  <span>13+</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Themes dropdown */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Theme
            </Label>
            <Select
              value={selectedThemes.length ? selectedThemes[0] : "any"}
              onValueChange={(value) => {
                // Clear previous selections and set this as the only theme
                if (value && value !== "any") {
                  setSelectedThemes([value]);
                  handleFilterChange('themes', [value]);
                  // Immediately update relevant secondary themes
                  findRelevantSecondaryThemes(value);
                } else {
                  setSelectedThemes([]);
                  handleFilterChange('themes', undefined);
                  setRelevantSecondaryThemes([]);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Theme</SelectItem>
                {commonThemes.map((theme) => (
                  <SelectItem key={theme} value={theme}>
                    {theme}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Theme matching mode toggle - only appears when a primary theme is selected */}
            {selectedThemes.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-gray-600">Theme match mode:</Label>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant={themeMatchMode === 'AND' ? "default" : "outline"}
                      onClick={() => {
                        setThemeMatchMode('AND');
                        // Re-apply current filters with new matching mode
                        if (selectedThemes.length > 0) {
                          const updatedFilters = {
                            ...filters,
                            themes: selectedThemes,
                            themeMatchMode: 'AND' as const
                          };
                          onFilterChange(updatedFilters);
                        }
                      }}
                    >
                      AND
                    </Button>
                    <Button 
                      size="sm" 
                      variant={themeMatchMode === 'OR' ? "default" : "outline"}
                      onClick={() => {
                        setThemeMatchMode('OR');
                        // Re-apply current filters with new matching mode
                        if (selectedThemes.length > 0) {
                          const updatedFilters = {
                            ...filters,
                            themes: selectedThemes,
                            themeMatchMode: 'OR' as const
                          };
                          onFilterChange(updatedFilters);
                        }
                      }}
                    >
                      OR
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {themeMatchMode === 'AND' 
                    ? 'Shows must contain ALL selected themes' 
                    : 'Shows can contain ANY of the selected themes'}
                </p>
              </div>
            )}
            
            {/* Secondary theme dropdown (only appears when primary theme is selected) */}
            {selectedThemes.length > 0 && (
              <div className="mt-4">
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Theme (Optional)
                </Label>
                <Select
                  value={selectedThemes.length > 1 ? selectedThemes[1] : "none"}
                  onValueChange={(value) => {
                    if (value && value !== "none") {
                      // Add as second theme
                      const newThemes = [selectedThemes[0], value];
                      setSelectedThemes(newThemes);
                      handleFilterChange('themes', newThemes);
                    } else {
                      // Remove secondary theme and tertiary theme if they exist
                      const newThemes = [selectedThemes[0]];
                      setSelectedThemes(newThemes);
                      handleFilterChange('themes', newThemes);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a secondary theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Secondary Theme</SelectItem>
                    {relevantSecondaryThemes.map((theme) => (
                        <SelectItem key={theme} value={theme}>
                          {theme}
                        </SelectItem>
                      ))
                    }
                    <div className="px-3 py-2 text-xs text-gray-500 border-t mt-1">
                      {themeMatchMode === 'OR' 
                        ? 'Showing all available themes' 
                        : 'Showing themes that co-exist with primary theme'}
                    </div>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Tertiary theme dropdown (only appears when secondary theme is selected) */}
            {selectedThemes.length > 1 && (
              <div className="mt-4">
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Tertiary Theme (Optional)
                </Label>
                <Select
                  value={selectedThemes.length > 2 ? selectedThemes[2] : "none"}
                  onValueChange={(value) => {
                    if (value && value !== "none") {
                      // Add as third theme
                      const newThemes = [...selectedThemes.slice(0, 2), value];
                      setSelectedThemes(newThemes);
                      handleFilterChange('themes', newThemes);
                    } else {
                      // Remove tertiary theme
                      const newThemes = selectedThemes.slice(0, 2);
                      setSelectedThemes(newThemes);
                      handleFilterChange('themes', newThemes);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a tertiary theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Tertiary Theme</SelectItem>
                    {relevantSecondaryThemes
                      .filter(theme => theme !== selectedThemes[1])
                      .map((theme) => (
                        <SelectItem key={theme} value={theme}>
                          {theme}
                        </SelectItem>
                      ))
                    }
                    <div className="px-3 py-2 text-xs text-gray-500 border-t mt-1">
                      {themeMatchMode === 'OR' 
                        ? 'Shows will match any of the three selected themes' 
                        : 'Shows must contain all three selected themes'}
                    </div>
                  </SelectContent>
                </Select>
              </div>
            )}
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
          
          {/* Sort By */}
          <div>
            <Label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </Label>
            <Select 
              value={filters.sortBy} 
              onValueChange={(value) => handleFilterChange('sortBy', value)}
            >
              <SelectTrigger id="sort-by">
                <SelectValue placeholder="Name (A-Z)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="stimulation-score">Stimulation Score (Low to High)</SelectItem>
                <SelectItem value="interactivity-level">Interactivity Level (Low to High)</SelectItem>
                <SelectItem value="overall-rating">Rating (High to Low)</SelectItem>
                <SelectItem value="popular">Popular</SelectItem>
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
            </div>
          </div>
          
          {/* Apply Filters and Reset */}
          <div className="space-y-2">
            <Button
              type="button"
              onClick={handleApplyFilters}
              className="w-full bg-secondary hover:bg-secondary/90"
              style={{fontWeight: 'bold'}}
            >
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
                    <X className="h-3.5 w-3.5 text-gray-500" />
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