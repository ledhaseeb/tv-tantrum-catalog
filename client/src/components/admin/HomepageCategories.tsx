import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { HomepageCategory, InsertHomepageCategory } from '@shared/catalog-schema';

interface FilterRule {
  field: string;
  operator: 'equals' | 'contains' | 'in' | 'range';
  value: any;
}

interface FilterConfig {
  logic: 'AND' | 'OR';
  rules: FilterRule[];
}

export default function HomepageCategories() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<HomepageCategory | null>(null);
  const [previewCategory, setPreviewCategory] = useState<HomepageCategory | null>(null);

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['/api/admin/homepage-categories'],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertHomepageCategory) => {
      const response = await fetch('/api/admin/homepage-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/homepage-categories'] });
      setIsCreateOpen(false);
      toast({ title: 'Success', description: 'Category created successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create category', variant: 'destructive' });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertHomepageCategory> }) => {
      const response = await fetch(`/api/admin/homepage-categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/homepage-categories'] });
      setEditingCategory(null);
      toast({ title: 'Success', description: 'Category updated successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update category', variant: 'destructive' });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/homepage-categories/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/homepage-categories'] });
      toast({ title: 'Success', description: 'Category deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete category', variant: 'destructive' });
    },
  });

  // Preview shows mutation
  const previewMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/homepage-categories/${id}/shows`);
      if (!response.ok) throw new Error('Failed to fetch category shows');
      return response.json();
    },
  });

  const handlePreview = async (category: HomepageCategory) => {
    setPreviewCategory(category);
    previewMutation.mutate(category.id);
  };

  if (isLoading) {
    return <div className="p-6">Loading categories...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Homepage Categories</h1>
          <p className="text-gray-600">Manage curated collections displayed on the homepage</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Homepage Category</DialogTitle>
            </DialogHeader>
            <CategoryForm 
              onSubmit={(data) => createMutation.mutate(data)}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {categories.map((category: HomepageCategory) => (
          <Card key={category.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg">{category.name}</h3>
                  <Badge variant={category.isActive ? 'default' : 'secondary'}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline">Order: {category.displayOrder}</Badge>
                </div>
                <p className="text-gray-600 mb-3">{category.description}</p>
                <div className="text-sm text-gray-500">
                  Filter Logic: {category.filterConfig?.logic || 'AND'} with {category.filterConfig?.rules?.length || 0} rules
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handlePreview(category)}
                  disabled={previewMutation.isPending}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setEditingCategory(category)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => deleteMutation.mutate(category.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <CategoryForm 
              initialData={editingCategory}
              onSubmit={(data) => updateMutation.mutate({ id: editingCategory.id, data })}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewCategory} onOpenChange={() => setPreviewCategory(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview: {previewCategory?.name}</DialogTitle>
          </DialogHeader>
          {previewMutation.data && (
            <div className="space-y-4">
              <p className="text-gray-600">{previewCategory?.description}</p>
              <div className="text-sm text-gray-500">
                Found {previewMutation.data.length} shows matching the filters
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {previewMutation.data.slice(0, 12).map((show: any) => (
                  <Card key={show.id} className="p-3">
                    <div className="aspect-[3/4] bg-gray-200 rounded mb-2 overflow-hidden">
                      {show.imageUrl && (
                        <img 
                          src={show.imageUrl} 
                          alt={show.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <h4 className="font-medium text-sm">{show.name}</h4>
                    <p className="text-xs text-gray-500">{show.ageRange}</p>
                  </Card>
                ))}
              </div>
              {previewMutation.data.length > 12 && (
                <p className="text-sm text-gray-500 text-center">
                  + {previewMutation.data.length - 12} more shows...
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface CategoryFormProps {
  initialData?: HomepageCategory;
  onSubmit: (data: InsertHomepageCategory) => void;
  isLoading: boolean;
}

function CategoryForm({ initialData, onSubmit, isLoading }: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    displayOrder: initialData?.displayOrder || 0,
    isActive: initialData?.isActive !== false,
    filterConfig: initialData?.filterConfig || { logic: 'AND' as const, rules: [] },
  });

  const availableFields = [
    { value: 'themes', label: 'Themes' },
    { value: 'ageRange', label: 'Age Range' },
    { value: 'stimulationScore', label: 'Stimulation Score' },
    { value: 'interactivityLevel', label: 'Interactivity Level' },
    { value: 'dialogueIntensity', label: 'Dialogue Intensity' },
    { value: 'soundEffectsLevel', label: 'Sound Effects Level' },
    { value: 'musicTempo', label: 'Music Tempo' },
    { value: 'tantrumFactor', label: 'Tantrum Factor' },
  ];

  const addFilterRule = () => {
    setFormData(prev => ({
      ...prev,
      filterConfig: {
        ...prev.filterConfig,
        rules: [...prev.filterConfig.rules, { field: 'themes', operator: 'contains' as const, value: '' }]
      }
    }));
  };

  const removeFilterRule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      filterConfig: {
        ...prev.filterConfig,
        rules: prev.filterConfig.rules.filter((_, i) => i !== index)
      }
    }));
  };

  const updateFilterRule = (index: number, field: keyof FilterRule, value: any) => {
    setFormData(prev => ({
      ...prev,
      filterConfig: {
        ...prev.filterConfig,
        rules: prev.filterConfig.rules.map((rule, i) => 
          i === index ? { ...rule, [field]: value } : rule
        )
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Category Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Fantasy Shows"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="e.g., Shows with magical, imaginative and fantasy elements"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="displayOrder">Display Order</Label>
            <Input
              id="displayOrder"
              type="number"
              value={formData.displayOrder}
              onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Filter Configuration</Label>
          <div className="flex items-center gap-2">
            <Label htmlFor="logic">Logic:</Label>
            <Select
              value={formData.filterConfig.logic}
              onValueChange={(value: 'AND' | 'OR') => 
                setFormData(prev => ({
                  ...prev,
                  filterConfig: { ...prev.filterConfig, logic: value }
                }))
              }
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AND">AND</SelectItem>
                <SelectItem value="OR">OR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          {formData.filterConfig.rules.map((rule, index) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1">
                <Label>Field</Label>
                <Select
                  value={rule.field}
                  onValueChange={(value) => updateFilterRule(index, 'field', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFields.map(field => (
                      <SelectItem key={field.value} value={field.value}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-32">
                <Label>Operator</Label>
                <Select
                  value={rule.operator}
                  onValueChange={(value) => updateFilterRule(index, 'operator', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="in">In</SelectItem>
                    <SelectItem value="range">Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label>Value</Label>
                <Input
                  value={rule.value}
                  onChange={(e) => updateFilterRule(index, 'value', e.target.value)}
                  placeholder="Filter value"
                />
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => removeFilterRule(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" onClick={addFilterRule}>
          <Plus className="w-4 h-4 mr-2" />
          Add Filter Rule
        </Button>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Category'}
        </Button>
      </div>
    </form>
  );
}