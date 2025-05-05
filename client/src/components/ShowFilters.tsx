import { useState, useEffect } from "react";
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
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [selectedThemes, setSelectedThemes] = useState<string[]>(activeFilters.themes || []);
  
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
          {/* Search by show name */}
          <div>
            <Label htmlFor="show-name" className="block text-sm font-medium text-gray-700 mb-2">
              Show Name
            </Label>
            <Input
              id="show-name"
              type="search"
              placeholder="Enter title..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full"
            />
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
          
          {/* Additional filter selects */}
          <div className={isFiltersExpanded ? "block" : "hidden"}>
            <div className="space-y-4">
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
              
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  Stimulation Score Range
                </Label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    <input 
                      type="range" 
                      min="1" 
                      max="5" 
                      step="1" 
                      value={filters.stimulationScoreRange?.min || 1}
                      onChange={(e) => handleFilterChange('stimulationScoreRange', {
                        min: parseInt(e.target.value),
                        max: filters.stimulationScoreRange?.max || 5
                      })}
                      className="w-full" 
                    />
                    <div className="flex justify-between">
                      <span className="text-xs">Min: {filters.stimulationScoreRange?.min || 1}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <input 
                      type="range" 
                      min="1" 
                      max="5" 
                      step="1" 
                      value={filters.stimulationScoreRange?.max || 5}
                      onChange={(e) => handleFilterChange('stimulationScoreRange', {
                        min: filters.stimulationScoreRange?.min || 1,
                        max: parseInt(e.target.value)
                      })}
                      className="w-full" 
                    />
                    <div className="flex justify-between">
                      <span className="text-xs">Max: {filters.stimulationScoreRange?.max || 5}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button type="button" onClick={handleApplyFilters} className="w-full">
              Apply Filters
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsFiltersExpanded(!isFiltersExpanded)} 
              className="w-full"
            >
              {isFiltersExpanded ? "Show Less Filters" : "Show More Filters"}
            </Button>
            {Object.keys(filters).length > 0 && (
              <Button 
                type="button" 
                variant="link" 
                onClick={onClearFilters} 
                className="text-primary-600 hover:text-primary-800"
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
