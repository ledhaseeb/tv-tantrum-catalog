import { useState, useEffect, useRef, useCallback } from "react";
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
  
  // Computed states for relevant secondary and tertiary themes
  const [relevantSecondaryThemes, setRelevantSecondaryThemes] = useState<string[]>([]);
  const [relevantTertiaryThemes, setRelevantTertiaryThemes] = useState<string[]>([]);
  
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
    
    const sortedThemes = Array.from(allThemes).sort();
    setCommonThemes(sortedThemes);
    
    // Initial Filter Setup: If there are pre-selected themes, update relevant themes
    if (selectedThemes.length > 0 && selectedThemes[0]) {
      findRelevantSecondaryThemes(selectedThemes[0]);
      
      if (selectedThemes.length > 1 && selectedThemes[1]) {
        // OR mode - all themes except already selected ones
        // AND mode - only themes that co-exist with both primary and secondary
        if (themeMatchMode === 'OR') {
          setRelevantTertiaryThemes(sortedThemes.filter(theme => !selectedThemes.includes(theme)));
        } else {
          findRelevantTertiaryThemes(selectedThemes[0], selectedThemes[1]);
        }
      }
    }
  }, [shows]);
  
  // Update relevant secondary themes when primary theme changes
  useEffect(() => {
    if (selectedThemes.length > 0 && selectedThemes[0]) {
      findRelevantSecondaryThemes(selectedThemes[0]);
    } else {
      // Reset secondary themes if no primary theme is selected
      setRelevantSecondaryThemes([]);
    }
    
    // Always reset tertiary themes when primary theme changes
    setRelevantTertiaryThemes([]);
  }, [shows, selectedThemes[0], themeMatchMode, commonThemes]);
  
  // Find relevant secondary themes based on shows that have the primary theme
  const findRelevantSecondaryThemes = useCallback((primaryTheme: string) => {
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

      // Using only exact matches for themes to ensure accurate filtering
      const exactMatches = shows.filter(show => {
        if (!show || !show.themes || !Array.isArray(show.themes)) return false;
        
        // Case-insensitive exact matching for themes
        return show.themes.some(theme => 
          theme && 
          typeof theme === 'string' &&
          theme.trim().toLowerCase() === normalizedPrimaryTheme
        );
      });
      
      showsWithPrimaryTheme = [...exactMatches];
      console.log(`Found ${showsWithPrimaryTheme.length} shows with exact match for theme: ${primaryTheme}`);
      
      // No longer using partial matches - strict exact matching only for better predictability
      if (showsWithPrimaryTheme.length === 0) {
        console.log(`No exact matches found for theme: ${primaryTheme}`);
        setRelevantSecondaryThemes([]);
        return;
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
  }, [shows]);
  
  // Find tertiary themes that co-exist with both primary and secondary themes (AND mode)
  const findRelevantTertiaryThemes = useCallback((primaryTheme: string, secondaryTheme: string) => {
    if (!shows || !primaryTheme || !secondaryTheme) {
      setRelevantTertiaryThemes([]);
      return;
    }

    try {
      console.log(`Finding relevant tertiary themes for primary theme ${primaryTheme} and secondary theme ${secondaryTheme}`);

      // Normalize themes for case-insensitive matching
      const normalizedPrimaryTheme = primaryTheme.trim().toLowerCase();
      const normalizedSecondaryTheme = secondaryTheme.trim().toLowerCase();

      // Find shows that have BOTH the primary and secondary themes
      const showsWithBothThemes = shows.filter(show => {
        if (!show || !show.themes || !Array.isArray(show.themes)) return false;
        
        // Normalize the show's themes
        const normalizedShowThemes = show.themes
          .filter(theme => theme && typeof theme === 'string')
          .map(theme => theme.trim().toLowerCase());
        
        // Show must have BOTH themes to qualify
        return normalizedShowThemes.includes(normalizedPrimaryTheme) && 
               normalizedShowThemes.includes(normalizedSecondaryTheme);
      });
      
      console.log(`Found ${showsWithBothThemes.length} shows with both themes: ${primaryTheme} and ${secondaryTheme}`);
      
      if (showsWithBothThemes.length === 0) {
        setRelevantTertiaryThemes([]);
        return;
      }

      // Count occurrences of each tertiary theme across all shows with both themes
      const themeCounts: Record<string, number> = {};
      
      // Process each show that has both themes
      showsWithBothThemes.forEach(show => {
        if (!show || !show.themes || !Array.isArray(show.themes)) return;
        
        show.themes.forEach(theme => {
          if (!theme || typeof theme !== 'string' || theme.trim() === "") return;
          
          // Skip primary and secondary themes - we only want other co-existing themes
          const normalizedTheme = theme.trim().toLowerCase();
          if (
            normalizedTheme === normalizedPrimaryTheme || 
            normalizedTheme === normalizedSecondaryTheme
          ) {
            return;
          }
          
          const themeKey = theme.trim();
          themeCounts[themeKey] = (themeCounts[themeKey] || 0) + 1;
        });
      });

      // Sort tertiary themes by frequency and filter out primary/secondary themes
      const relevantThemes = Object.entries(themeCounts)
        .map(([theme, count]) => ({ theme, count }))
        .sort((a, b) => b.count - a.count)
        .map(item => item.theme);
      
      console.log(`Found ${relevantThemes.length} relevant tertiary themes that co-exist with ${primaryTheme} and ${secondaryTheme}`);
      setRelevantTertiaryThemes(relevantThemes);
    } catch (error) {
      console.error("Error finding tertiary themes:", error);
      setRelevantTertiaryThemes([]);
    }
  }, [shows]);
  
  // Update relevant tertiary themes when secondary theme changes
  useEffect(() => {
    if (shows && selectedThemes.length > 1) {
      // For OR mode, display all available themes except the already selected ones
      // For AND mode, display only themes that co-exist with both primary and secondary themes
      if (themeMatchMode === 'OR') {
        setRelevantTertiaryThemes(commonThemes.filter(theme => !selectedThemes.includes(theme)));
      } else {
        findRelevantTertiaryThemes(selectedThemes[0], selectedThemes[1]);
      }
    } else {
      // Reset if no secondary theme is selected
      setRelevantTertiaryThemes([]);
    }
  }, [shows, selectedThemes, themeMatchMode, commonThemes, findRelevantTertiaryThemes]);
  
  // Log for debugging
  useEffect(() => {
    console.log("Current filters in ShowFilters component:", filters);
  }, [filters]);
  
  const handleFilterChange = (key: keyof FiltersType, value: any) => {
    const updatedFilters = { ...filters, [key]: value };
    setFilters(updatedFilters);
    
    // Special handling for theme match mode changes
    if (key === 'themeMatchMode') {
      const newMode = value as 'AND' | 'OR';
      setThemeMatchMode(newMode);
      
      // If we have multiple themes and switch mode, update tertiary themes list
      if (selectedThemes.length > 1) {
        // For OR mode - show all themes except selected ones
        // For AND mode - show only co-occurring themes
        if (newMode === 'OR') {
          setRelevantTertiaryThemes(commonThemes.filter(t => !selectedThemes.includes(t)));
        } else {
          findRelevantTertiaryThemes(selectedThemes[0], selectedThemes[1]);
        }
      }
    }
    
    // Handle theme selection separately to maintain the selectedThemes array
    if (key !== 'themes') {
      onFilterChange(updatedFilters);
    }
  };
  
  const handleClearFilters = () => {
    setFilters({});
    setSearchInput("");
    setSelectedThemes([]);
    setRelevantSecondaryThemes([]);
    setRelevantTertiaryThemes([]);
    onClearFilters();
  };
  
  const handleSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange('search', searchInput);
  };
  
  return (
    <Card className="w-full overflow-visible">
      <CardContent className="pt-6 pb-6 px-6">
        <div className="flex flex-col space-y-5">
          {/* Filter Header */}
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-xl font-semibold">Filters</h2>
            <Button 
              variant="outline" 
              onClick={handleClearFilters}
              className="text-sm"
            >
              Clear Filters
            </Button>
          </div>
          
          {/* Search Input */}
          <div>
            <form onSubmit={handleSubmitSearch} className="relative">
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search shows..." 
                className="pl-9"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Button type="submit" className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 rounded-sm">
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>
          
          {/* Active Filter Chips */}
          {Object.keys(filters).length > 0 && (
            <div className="flex flex-wrap gap-2 pb-2">
              {filters.ageGroup && (
                <Badge variant="outline" className="py-1 px-2 flex items-center space-x-1">
                  <span>Age: {filters.ageGroup}</span>
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => handleFilterChange('ageGroup', undefined)}
                  />
                </Badge>
              )}
              
              {filters.tantrumFactor && (
                <Badge variant="outline" className="py-1 px-2 flex items-center space-x-1">
                  <span>Stimulation: {filters.tantrumFactor}</span>
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => handleFilterChange('tantrumFactor', undefined)}
                  />
                </Badge>
              )}
              
              {filters.interactionLevel && (
                <Badge variant="outline" className="py-1 px-2 flex items-center space-x-1">
                  <span>Interaction: {filters.interactionLevel}</span>
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => handleFilterChange('interactionLevel', undefined)}
                  />
                </Badge>
              )}
              
              {selectedThemes.length > 0 && (
                <Badge variant="outline" className="py-1 px-2 flex items-center space-x-1">
                  <span>
                    Themes: {selectedThemes.join(` ${themeMatchMode} `)}
                  </span>
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => {
                      setSelectedThemes([]);
                      handleFilterChange('themes', []);
                    }}
                  />
                </Badge>
              )}
              
              {filters.sortBy && (
                <Badge variant="outline" className="py-1 px-2 flex items-center space-x-1">
                  <span>Sort: {filters.sortBy}</span>
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => handleFilterChange('sortBy', undefined)}
                  />
                </Badge>
              )}
            </div>
          )}
          
          {/* Age Group Filter */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Age Group
            </Label>
            <Select
              value={filters.ageGroup || "any"}
              onValueChange={(value) => handleFilterChange('ageGroup', value === "any" ? undefined : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an age group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Age</SelectItem>
                <SelectItem value="0-2">0-2 Years</SelectItem>
                <SelectItem value="3-5">3-5 Years</SelectItem>
                <SelectItem value="6-9">6-9 Years</SelectItem>
                <SelectItem value="10-12">10-12 Years</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Stimulation Score Filter (Previously Tantrum Factor) */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Stimulation Level
            </Label>
            <Select
              value={filters.tantrumFactor || "any"}
              onValueChange={(value) => handleFilterChange('tantrumFactor', value === "any" ? undefined : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select stimulation level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Level</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Interaction Level Filter */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Interaction Level
            </Label>
            <Select
              value={filters.interactionLevel || "any"}
              onValueChange={(value) => handleFilterChange('interactionLevel', value === "any" ? undefined : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select interaction level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Level</SelectItem>
                <SelectItem value="Low">Low Interaction</SelectItem>
                <SelectItem value="Moderate">Moderate Interaction</SelectItem>
                <SelectItem value="Moderate-High">Moderate-High Interaction</SelectItem>
                <SelectItem value="High">High Interaction</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Theme Filter */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Themes
            </Label>
            
            {/* Theme Match Mode */}
            <RadioGroup 
              value={themeMatchMode} 
              onValueChange={(value: 'AND' | 'OR') => handleFilterChange('themeMatchMode', value)}
              className="flex space-x-4 mb-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="AND" id="r1" />
                <Label htmlFor="r1" className="cursor-pointer">All themes (AND)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="OR" id="r2" />
                <Label htmlFor="r2" className="cursor-pointer">Any theme (OR)</Label>
              </div>
            </RadioGroup>
            
            {/* Primary Theme Dropdown */}
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Theme
              </Label>
              <Select
                value={selectedThemes.length > 0 ? selectedThemes[0] : "none"}
                onValueChange={(value) => {
                  if (value && value !== "none") {
                    // If selecting a new primary theme
                    const newThemes = [value];
                    setSelectedThemes(newThemes);
                    handleFilterChange('themes', newThemes);
                  } else {
                    // Clearing the primary theme clears all themes
                    setSelectedThemes([]);
                    handleFilterChange('themes', []);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a primary theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Theme</SelectItem>
                  {commonThemes.map((theme) => (
                    <SelectItem key={theme} value={theme}>
                      {theme}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
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
                      // Remove secondary and tertiary themes if cleared
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
                    {(themeMatchMode === 'OR' 
                      ? commonThemes.filter(theme => theme !== selectedThemes[0])
                      : relevantSecondaryThemes
                    ).map((theme) => (
                      <SelectItem key={theme} value={theme}>
                        {theme}
                      </SelectItem>
                    ))}
                    <div className="px-3 py-2 text-xs text-gray-500 border-t mt-1">
                      {themeMatchMode === 'OR' 
                        ? 'Shows will match either primary or secondary theme' 
                        : 'Shows must contain both primary and secondary themes'}
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
                    {/* Always show all available themes except those already selected */}
                    {commonThemes
                      .filter(theme => !selectedThemes.includes(theme))
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
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Sort Results By
            </Label>
            <Select
              value={filters.sortBy || "name"}
              onValueChange={(value) => handleFilterChange('sortBy', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="nameDesc">Name (Z-A)</SelectItem>
                <SelectItem value="stimulationScore">Stimulation: Low to High</SelectItem>
                <SelectItem value="stimulationScoreDesc">Stimulation: High to Low</SelectItem>
                <SelectItem value="ageRangeAsc">Age Range: Youngest First</SelectItem>
                <SelectItem value="ageRangeDesc">Age Range: Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}