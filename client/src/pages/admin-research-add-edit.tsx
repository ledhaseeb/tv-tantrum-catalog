import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, FileText, Loader2, Save } from 'lucide-react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import FileUploader from '@/components/FileUploader';

// Define the schema for research entry
const researchFormSchema = z.object({
  title: z.string().min(3, {
    message: 'Research title must be at least 3 characters.',
  }),
  category: z.string({
    required_error: 'Please select a category.',
  }),
  source: z.string().optional(),
  originalUrl: z.string().url({
    message: 'Please enter a valid URL for the original study.',
  }).optional(),
  publishedDate: z.string().optional(),
  summary: z.string().optional(),
  fullText: z.string().optional(),
  headline: z.string().optional(),
  subHeadline: z.string().optional(),
  keyFindings: z.string().optional(),
  imageUrl: z.string().optional(),
  imageDescription: z.string().optional(),
});

type ResearchFormValues = z.infer<typeof researchFormSchema>;

export default function AdminResearchAddEdit() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Default values for form
  const defaultValues: Partial<ResearchFormValues> = {
    title: '',
    category: '',
    source: '',
    originalUrl: '',
    publishedDate: '',
    summary: '',
    fullText: '',
    headline: '',
    subHeadline: '',
    keyFindings: '',
    imageUrl: '',
    imageDescription: '',
  };

  const form = useForm<ResearchFormValues>({
    resolver: zodResolver(researchFormSchema),
    defaultValues,
    mode: 'onChange',
  });
  
  // Check if we're in edit mode by checking localStorage
  useEffect(() => {
    // Check for localStorage first (this is the new method)
    const storedEditId = localStorage.getItem('editResearchId');
    
    if (storedEditId) {
      const id = parseInt(storedEditId, 10);
      
      if (!isNaN(id)) {
        setIsEditMode(true);
        setEditId(id);
        fetchResearchEntry(id);
        
        // Clear the localStorage item after we've used it
        localStorage.removeItem('editResearchId');
      }
    }
    // Also check URL parameters for backward compatibility
    else if (location.includes('?')) {
      const searchParams = new URLSearchParams(location.split('?')[1]);
      const editParam = searchParams.get('edit');
      
      if (editParam) {
        const id = parseInt(editParam, 10);
        if (!isNaN(id)) {
          setIsEditMode(true);
          setEditId(id);
          fetchResearchEntry(id);
        }
      }
    }
  }, [location]);
  
  // Fetch research entry data for editing
  const fetchResearchEntry = async (id: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/research/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch research entry');
      }
      
      const data = await response.json();
      
      // Make sure we have a valid date format for the published date field
      let formattedDate = '';
      if (data.publishedDate) {
        try {
          // If it's a valid date string, format it as YYYY-MM-DD for the input field
          const date = new Date(data.publishedDate);
          if (!isNaN(date.getTime())) {
            formattedDate = date.toISOString().split('T')[0];
          }
        } catch (e) {
          console.error('Error formatting date:', e);
        }
      }
      
      // Update the form with the data from the API
      form.setValue('title', data.title || '');
      form.setValue('category', data.category || '');
      form.setValue('source', data.source || '');
      form.setValue('originalUrl', data.originalUrl || '');
      form.setValue('publishedDate', formattedDate);
      form.setValue('summary', data.summary || '');
      form.setValue('fullText', data.fullText || '');
      form.setValue('headline', data.headline || '');
      form.setValue('subHeadline', data.subHeadline || '');
      form.setValue('keyFindings', data.keyFindings || '');
      form.setValue('imageUrl', data.imageUrl || '');
      form.setValue('imageDescription', data.imageDescription || '');
      
      // If there's an image URL, set it in state
      if (data.imageUrl) {
        setUploadedImageUrl(data.imageUrl);
      }

    } catch (error) {
      console.error('Error fetching research entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to load research entry for editing',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const saveResearchMutation = useMutation({
    mutationFn: async (data: ResearchFormValues) => {
      // If we're in edit mode, update the existing entry
      if (isEditMode && editId) {
        const response = await fetch(`/api/research/${editId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update research entry');
        }
        
        return response.json();
      } 
      // Otherwise, create a new entry
      else {
        const response = await fetch('/api/research', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          throw new Error('Failed to create research entry');
        }
        
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/research'] });
      toast({
        title: 'Success',
        description: isEditMode 
          ? 'Research entry updated successfully!' 
          : 'Research entry created successfully!',
      });
      setLocation('/admin');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to ${isEditMode ? 'update' : 'create'} research entry: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  function onSubmit(data: ResearchFormValues) {
    saveResearchMutation.mutate(data);
  }

  // Handle image upload
  const handleImageUpload = (url: string) => {
    setUploadedImageUrl(url);
    form.setValue('imageUrl', url);
    setIsUploading(false);
  };

  const researchCategories = [
    'Screen Time',
    'Cognitive Development',
    'Learning Outcomes',
    'Parental Guidance',
    'Media Effects',
    'Content Analysis',
    'Child Psychology',
    'Educational Impact',
    'Social Development',
    'Digital Literacy',
    'Other'
  ];

  return (
    <main className="container mx-auto py-8 px-4">
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center mb-2">
            <Button
              variant="ghost"
              size="sm"
              className="mr-2"
              onClick={() => setLocation('/admin')}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
          <CardTitle>{isEditMode ? 'Edit Research Summary' : 'Add Research Summary'}</CardTitle>
          <CardDescription>
            {isEditMode 
              ? 'Update research summary information' 
              : 'Create a new research summary to share insights with your audience'}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Research Information</CardTitle>
              <CardDescription>
                Enter the details of the research summary
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Research title"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {researchCategories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="source"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Source</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Research source (e.g., Journal name, University)"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="publishedDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Published Date</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                placeholder="YYYY-MM-DD"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="originalUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Original Study URL</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://example.com/research"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="headline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Headline</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Main headline for the research"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            A short, attention-grabbing headline
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subHeadline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sub-headline</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Secondary headline or subtitle"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Additional context for the headline
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="summary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Summary</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Brief summary of the research findings"
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Provide a concise overview of the research
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="keyFindings"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Key Findings</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Key findings from the research (separate with new lines)"
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            List the most important findings. Each line will be displayed as a separate point.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fullText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Text</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Full text of the research summary (separate paragraphs with blank lines)"
                              className="min-h-[200px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Complete details of the research. Use blank lines to separate paragraphs.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <CardFooter className="px-0 pt-6">
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isLoading || isUploading || saveResearchMutation.isPending}
                    >
                      {saveResearchMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {isEditMode ? 'Updating...' : 'Saving...'}
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          {isEditMode ? 'Update Research' : 'Save Research'}
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Featured Image</CardTitle>
              <CardDescription>
                Upload an image to accompany the research summary
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploader
                onUploadComplete={handleImageUpload}
                onUploadStart={() => setIsUploading(true)}
                onUploadError={(error) => {
                  setIsUploading(false);
                  toast({
                    title: 'Upload failed',
                    description: error,
                    variant: 'destructive',
                  });
                }}
                folder="research-images"
              />
              {uploadedImageUrl && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Preview:</p>
                  <img
                    src={uploadedImageUrl}
                    alt="Uploaded preview"
                    className="rounded-md w-full max-h-[200px] object-cover"
                  />
                </div>
              )}
              
              <FormField
                control={form.control}
                name="imageDescription"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Image Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the image for better accessibility and context"
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This description will be displayed below the image on the research detail page
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Help</CardTitle>
              <CardDescription>
                Tips for creating effective research summaries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-3">
                <p>
                  <span className="font-semibold">Headline:</span> A clear, concise statement of the main finding
                </p>
                <p>
                  <span className="font-semibold">Sub-headline:</span> Provides context or elaborates on the headline
                </p>
                <p>
                  <span className="font-semibold">Key Findings:</span> Each line will be displayed as a separate point
                </p>
                <p>
                  <span className="font-semibold">Summary:</span> A brief overview that appears in the research listing
                </p>
                <p>
                  <span className="font-semibold">Full Text:</span> Detailed information, separated into paragraphs with blank lines
                </p>
                <p>
                  <span className="font-semibold">Featured Image:</span> Images help increase engagement and readability
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}