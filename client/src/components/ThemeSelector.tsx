import { useState, useEffect } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Theme {
  id: number;
  name: string;
}

interface ThemeSelectorProps {
  selectedThemes: string[];
  onThemesChange: (themes: string[]) => void;
  placeholder?: string;
}

export function ThemeSelector({ selectedThemes, onThemesChange, placeholder = "Select themes..." }: ThemeSelectorProps) {
  const [allThemes, setAllThemes] = useState<Theme[]>([]);
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all available themes
  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const response = await fetch('/api/themes');
        const themes = await response.json();
        setAllThemes(themes.sort((a: Theme, b: Theme) => a.name.localeCompare(b.name)));
      } catch (error) {
        console.error('Error fetching themes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchThemes();
  }, []);

  // Add a theme to the selection
  const addTheme = (themeName: string) => {
    const trimmedName = themeName.trim();
    if (trimmedName && !selectedThemes.includes(trimmedName)) {
      onThemesChange([...selectedThemes, trimmedName]);
    }
    setSearchValue('');
    setOpen(false);
  };

  // Remove a theme from the selection
  const removeTheme = (themeToRemove: string) => {
    onThemesChange(selectedThemes.filter(theme => theme !== themeToRemove));
  };

  // Add a new custom theme
  const addCustomTheme = () => {
    const trimmedValue = searchValue.trim();
    if (trimmedValue && !selectedThemes.includes(trimmedValue)) {
      // Format the theme name properly (Title Case)
      const formattedTheme = trimmedValue
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      addTheme(formattedTheme);
    }
  };

  // Filter themes based on search and exclude already selected ones
  const filteredThemes = allThemes.filter(theme => 
    theme.name.toLowerCase().includes(searchValue.toLowerCase()) &&
    !selectedThemes.includes(theme.name)
  );

  // Check if the search value would create a new theme
  const isNewTheme = searchValue.trim() && 
    !allThemes.some(theme => theme.name.toLowerCase() === searchValue.toLowerCase()) &&
    !selectedThemes.includes(searchValue.trim());

  return (
    <div className="space-y-2">
      {/* Selected themes display */}
      {selectedThemes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedThemes.map((theme) => (
            <Badge key={theme} variant="secondary" className="flex items-center gap-1">
              {theme}
              <button
                type="button"
                onClick={() => removeTheme(theme)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Theme selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-start text-left font-normal"
          >
            <Plus className="mr-2 h-4 w-4" />
            {placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search themes..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>
                {isLoading ? (
                  "Loading themes..."
                ) : isNewTheme ? (
                  <div className="p-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={addCustomTheme}
                      className="w-full justify-start"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add "{searchValue.trim()}" as new theme
                    </Button>
                  </div>
                ) : (
                  "No themes found."
                )}
              </CommandEmpty>
              
              {filteredThemes.length > 0 && (
                <CommandGroup>
                  {filteredThemes.map((theme) => (
                    <CommandItem
                      key={theme.id}
                      value={theme.name}
                      onSelect={() => addTheme(theme.name)}
                    >
                      <Check className="mr-2 h-4 w-4 opacity-0" />
                      {theme.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Show option to add new theme if search doesn't match existing */}
              {isNewTheme && filteredThemes.length > 0 && (
                <CommandGroup>
                  <CommandItem onSelect={addCustomTheme}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add "{searchValue.trim()}" as new theme
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}