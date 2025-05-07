import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Paintbrush, Check, Undo2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Define preset color themes
const colorPresets = {
  teal: {
    primary: '#285161',
    secondary: '#FFC107',
    accent: '#10B981',
  },
  purple: {
    primary: '#7C3AED',
    secondary: '#FFC107',
    accent: '#10B981',
  },
  blue: {
    primary: '#2563EB',
    secondary: '#F59E0B',
    accent: '#10B981',
  },
  green: {
    primary: '#047857',
    secondary: '#F59E0B',
    accent: '#6366F1',
  },
  red: {
    primary: '#B91C1C',
    secondary: '#FBBF24',
    accent: '#06B6D4',
  },
};

// Convert hex to HSL for CSS variables
function hexToHSL(hex: string) {
  // Remove the # if present
  hex = hex.replace(/^#/, '');
  
  // Parse the hex values
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;
  
  // Find min and max values
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  
  // Calculate lightness
  let l = (max + min) / 2;
  
  let h = 0;
  let s = 0;
  
  if (max !== min) {
    // Calculate saturation
    s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
    
    // Calculate hue
    if (max === r) {
      h = (g - b) / (max - min) + (g < b ? 6 : 0);
    } else if (max === g) {
      h = (b - r) / (max - min) + 2;
    } else {
      h = (r - g) / (max - min) + 4;
    }
    h = h * 60;
  }
  
  // Round values
  h = Math.round(h);
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  
  return { h, s, l };
}

// Interface for our color palette
interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
}

export default function ColorPaletteCustomizer() {
  const { toast } = useToast();
  // Get stored colors from localStorage or use defaults
  const storedColors = localStorage.getItem('tvtantrumColorPalette');
  
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('presets');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [colorPalette, setColorPalette] = useState<ColorPalette>(
    storedColors 
      ? JSON.parse(storedColors) 
      : {
          primary: '#285161',   // Default teal
          secondary: '#FFC107', // Default yellow/gold
          accent: '#10B981',    // Default green
        }
  );
  
  // Apply colors to CSS variables
  const applyColorPalette = (palette: ColorPalette) => {
    // Convert HEX to HSL for CSS variables
    const primaryHSL = hexToHSL(palette.primary);
    const secondaryHSL = hexToHSL(palette.secondary);
    const accentHSL = hexToHSL(palette.accent);
    
    // Apply to CSS variables
    document.documentElement.style.setProperty('--primary', `${primaryHSL.h} ${primaryHSL.s}% ${primaryHSL.l}%`);
    document.documentElement.style.setProperty('--secondary', `${secondaryHSL.h} ${secondaryHSL.s}% ${secondaryHSL.l}%`);
    document.documentElement.style.setProperty('--accent', `${accentHSL.h} ${accentHSL.s}% ${accentHSL.l}%`);
    document.documentElement.style.setProperty('--chart-1', `${primaryHSL.h} ${primaryHSL.s}% ${primaryHSL.l}%`);
    
    // Save to localStorage
    localStorage.setItem('tvtantrumColorPalette', JSON.stringify(palette));
  };
  
  // Apply colors on component mount
  useEffect(() => {
    applyColorPalette(colorPalette);
  }, []);
  
  // Handle preset selection
  const selectPreset = (presetName: string) => {
    setSelectedPreset(presetName);
    const newPalette = colorPresets[presetName as keyof typeof colorPresets];
    setColorPalette(newPalette);
  };
  
  // Handle custom color change
  const handleColorChange = (colorType: keyof ColorPalette, value: string) => {
    setSelectedPreset(null); // Clear preset selection when custom colors are used
    setColorPalette(prev => ({
      ...prev,
      [colorType]: value
    }));
  };
  
  // Apply the selected colors
  const applyColors = () => {
    applyColorPalette(colorPalette);
    setIsOpen(false);
    
    toast({
      title: "Colors updated!",
      description: "Your custom color palette has been applied.",
    });
  };
  
  // Reset to default colors
  const resetToDefault = () => {
    const defaultPalette = colorPresets.teal;
    setColorPalette(defaultPalette);
    setSelectedPreset('teal');
    
    // This will update the preview, but not apply until "Apply" is clicked
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setIsOpen(true)}
              className="fixed bottom-4 right-4 rounded-full shadow-lg z-50"
            >
              <Paintbrush className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Customize Colors</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Customize Website Colors</DialogTitle>
          <DialogDescription>
            Personalize the website's color scheme to suit your preferences.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="presets">Color Presets</TabsTrigger>
            <TabsTrigger value="custom">Custom Colors</TabsTrigger>
          </TabsList>
          
          <TabsContent value="presets" className="py-4">
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(colorPresets).map(([name, colors]) => (
                <button
                  key={name}
                  className={`relative flex flex-col items-center p-2 rounded-md transition-all ${
                    selectedPreset === name ? 'ring-2 ring-primary' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => selectPreset(name)}
                >
                  <div className="flex gap-1 mb-2">
                    <div 
                      className="w-5 h-5 rounded-full" 
                      style={{ backgroundColor: colors.primary }}
                    />
                    <div 
                      className="w-5 h-5 rounded-full" 
                      style={{ backgroundColor: colors.secondary }}
                    />
                    <div 
                      className="w-5 h-5 rounded-full" 
                      style={{ backgroundColor: colors.accent }}
                    />
                  </div>
                  <span className="text-xs capitalize">{name}</span>
                  {selectedPreset === name && (
                    <div className="absolute top-1 right-1">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="custom" className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-md" 
                    style={{ backgroundColor: colorPalette.primary }}
                  />
                  <Input
                    id="primary-color"
                    type="text"
                    value={colorPalette.primary}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    placeholder="#285161"
                  />
                  <Input 
                    type="color"
                    value={colorPalette.primary}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    className="w-10 h-10 p-0 overflow-hidden"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="secondary-color">Secondary Color</Label>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-md" 
                    style={{ backgroundColor: colorPalette.secondary }}
                  />
                  <Input
                    id="secondary-color"
                    type="text"
                    value={colorPalette.secondary}
                    onChange={(e) => handleColorChange('secondary', e.target.value)}
                    placeholder="#FFC107"
                  />
                  <Input 
                    type="color"
                    value={colorPalette.secondary}
                    onChange={(e) => handleColorChange('secondary', e.target.value)}
                    className="w-10 h-10 p-0 overflow-hidden"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="accent-color">Accent Color</Label>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-md" 
                    style={{ backgroundColor: colorPalette.accent }}
                  />
                  <Input
                    id="accent-color"
                    type="text"
                    value={colorPalette.accent}
                    onChange={(e) => handleColorChange('accent', e.target.value)}
                    placeholder="#10B981"
                  />
                  <Input 
                    type="color"
                    value={colorPalette.accent}
                    onChange={(e) => handleColorChange('accent', e.target.value)}
                    className="w-10 h-10 p-0 overflow-hidden"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <h4 className="font-medium mb-2">Preview</h4>
          <div className="flex gap-2">
            <div className="flex-1 p-2 rounded-md text-white text-center font-medium" style={{ backgroundColor: colorPalette.primary }}>Primary</div>
            <div className="flex-1 p-2 rounded-md text-white text-center font-medium" style={{ backgroundColor: colorPalette.secondary }}>Secondary</div>
            <div className="flex-1 p-2 rounded-md text-white text-center font-medium" style={{ backgroundColor: colorPalette.accent }}>Accent</div>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between items-center mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={resetToDefault}
            className="gap-1"
          >
            <Undo2 className="h-4 w-4" /> Reset
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={applyColors}>
              Apply Colors
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}