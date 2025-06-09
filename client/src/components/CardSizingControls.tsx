import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface CardSizingControlsProps {
  onSizeChange: (config: any) => void;
  isVisible: boolean;
  onToggle: () => void;
}

export function CardSizingControls({ onSizeChange, isVisible, onToggle }: CardSizingControlsProps) {
  const [config, setConfig] = useState({
    totalHeight: 'h-72',
    totalWidth: 'w-48',
    imageHeight: 'h-40',
    contentHeight: 'h-32',
    contentPadding: 'p-3',
    titleSize: 'text-sm',
    badgeSize: 'text-xs',
    maxThemes: 1,
  });

  const heightOptions = [
    { value: 'h-64', label: '256px (h-64)' },
    { value: 'h-72', label: '288px (h-72)' },
    { value: 'h-80', label: '320px (h-80)' },
    { value: 'h-96', label: '384px (h-96)' },
  ];

  const widthOptions = [
    { value: 'w-44', label: '176px (w-44)' },
    { value: 'w-48', label: '192px (w-48)' },
    { value: 'w-52', label: '208px (w-52)' },
    { value: 'w-56', label: '224px (w-56)' },
    { value: 'w-60', label: '240px (w-60)' },
  ];

  const imageHeightOptions = [
    { value: 'h-32', label: '128px (h-32)' },
    { value: 'h-36', label: '144px (h-36)' },
    { value: 'h-40', label: '160px (h-40)' },
    { value: 'h-44', label: '176px (h-44)' },
    { value: 'h-48', label: '192px (h-48)' },
  ];

  const textSizeOptions = [
    { value: 'text-xs', label: '12px (text-xs)' },
    { value: 'text-sm', label: '14px (text-sm)' },
    { value: 'text-base', label: '16px (text-base)' },
    { value: 'text-lg', label: '18px (text-lg)' },
  ];

  const paddingOptions = [
    { value: 'p-2', label: '8px (p-2)' },
    { value: 'p-3', label: '12px (p-3)' },
    { value: 'p-4', label: '16px (p-4)' },
    { value: 'p-5', label: '20px (p-5)' },
  ];

  const updateConfig = (key: string, value: string | number) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onSizeChange(newConfig);
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button onClick={onToggle} variant="default" size="sm">
          🎨 Edit Card Size
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="bg-white shadow-lg border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Card Size Controls</CardTitle>
            <Button onClick={onToggle} variant="ghost" size="sm">×</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 max-h-96 overflow-y-auto">
          {/* Card Dimensions */}
          <div>
            <label className="text-xs font-medium mb-1 block">Total Height</label>
            <Select value={config.totalHeight} onValueChange={(value) => updateConfig('totalHeight', value)}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {heightOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Total Width</label>
            <Select value={config.totalWidth} onValueChange={(value) => updateConfig('totalWidth', value)}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {widthOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Image Height</label>
            <Select value={config.imageHeight} onValueChange={(value) => updateConfig('imageHeight', value)}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {imageHeightOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Typography */}
          <div>
            <label className="text-xs font-medium mb-1 block">Title Size</label>
            <Select value={config.titleSize} onValueChange={(value) => updateConfig('titleSize', value)}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {textSizeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Badge Size</label>
            <Select value={config.badgeSize} onValueChange={(value) => updateConfig('badgeSize', value)}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {textSizeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Spacing */}
          <div>
            <label className="text-xs font-medium mb-1 block">Content Padding</label>
            <Select value={config.contentPadding} onValueChange={(value) => updateConfig('contentPadding', value)}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paddingOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Max Themes */}
          <div>
            <label className="text-xs font-medium mb-1 block">Max Themes: {config.maxThemes}</label>
            <Slider
              value={[config.maxThemes]}
              onValueChange={([value]) => updateConfig('maxThemes', value)}
              min={1}
              max={3}
              step={1}
              className="w-full"
            />
          </div>

          {/* Preview */}
          <div className="pt-2 border-t">
            <div className="text-xs text-gray-600 mb-2">Live Preview:</div>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">
                {config.totalHeight} × {config.totalWidth}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Image: {config.imageHeight}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Padding: {config.contentPadding}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}