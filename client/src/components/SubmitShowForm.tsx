import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Search } from 'lucide-react';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

type SearchResult = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  source: string;
  releaseYear?: string;
};

const formSchema = z.object({
  showName: z.string().min(2, "Show name must be at least 2 characters"),
  description: z.string().optional(),
  suggestedAgeRange: z.string().optional(),
  suggestedThemes: z.array(z.string()).optional(),
});

type ShowSubmission = z.infer<typeof formSchema>;

export default function SubmitShowForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSource, setSearchSource] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  const form = useForm<ShowSubmission>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      showName: "",
      description: "",
      suggestedAgeRange: "",
      suggestedThemes: [],
    },
  });

  // API lookup for show name
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['/api/lookup/show', searchQuery, searchSource],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      
      // Use the correctly implemented endpoint in the backend
      let url = `/api/lookup/show?q=${encodeURIComponent(searchQuery)}`;
      if (searchSource) {
        url += `&source=${searchSource}`;
      }
      
      try {
        const results = await apiRequest<SearchResult[]>(url);
        return results || [];
      } catch (error) {
        console.error("Error searching for shows:", error);
        return [];
      }
    },
    enabled: searchQuery.length >= 2,
  });

  const submitMutation = useMutation({
    mutationFn: (data: ShowSubmission) => {
      console.log("Making API request with data:", data);
      return apiRequest("/api/show-submissions", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: (response) => {
      console.log("Submission successful:", response);
      toast({
        title: "Show Submitted!",
        description: "Thank you for your submission. Our team will review it soon.",
      });
      form.reset();
      setSelectedResult(null);
      setSearchQuery("");
      queryClient.invalidateQueries({ queryKey: ['/api/show-submissions'] });
    },
    onError: (error) => {
      console.error("Error submitting show:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your show. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ShowSubmission) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "You must be logged in to submit a show.",
        variant: "destructive",
      });
      return;
    }
    
    // Ensure themes is an array
    const formattedData = {
      ...data,
      // Make sure suggestedThemes is always an array
      suggestedThemes: data.suggestedThemes 
        ? (Array.isArray(data.suggestedThemes) 
            ? data.suggestedThemes 
            : [data.suggestedThemes])
        : [],
      // Ensure we have default values
      suggestedAgeRange: data.suggestedAgeRange || null,
      description: data.description || null,
    };
    
    console.log("Submitting show data:", formattedData);
    submitMutation.mutate(formattedData);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (!e.target.value) {
      setSelectedResult(null);
    }
    // Keep search open while typing - don't close dropdown
  };

  const handleSelectResult = (result: SearchResult) => {
    setSelectedResult(result);
    
    // Pre-populate form with data from the search result
    form.setValue("showName", result.name);
    
    // Display message if the show is already in our database or submitted
    if (result.source === 'database') {
      toast({
        title: "Show Already Exists",
        description: "This show is already in our database!",
        variant: "default",
      });
    } else if (result.source === 'submission') {
      toast({
        title: "Show Already Submitted",
        description: result.status || "This show has already been submitted for review.",
        variant: "default",
      });
    }
    
    // Add source information to description
    let description = result.description || "";
    
    // Add platform information to description
    if (result.source === 'youtube') {
      description += description ? "\n\n" : "";
      description += "Platform: YouTube";
    } else if (result.source === 'omdb') {
      description += description ? "\n\n" : "";
      description += "Platform: TV/Streaming";
    }
    
    // Update description field
    form.setValue("description", description);
    
    // Set suggested age range based on available info
    if (result.source === 'omdb' && result.releaseYear) {
      form.setValue("suggestedAgeRange", `Released in ${result.releaseYear}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit a Show</CardTitle>
        <CardDescription>
          Can't find a show? Submit it here for our team to review and add to the database!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Show Name with Smart Lookup */}
            <div className="space-y-2">
              <FormLabel>Show Name (Search to auto-fill)</FormLabel>
              <div className="relative">
                <Input
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder="Search for show..."
                  className="pr-10"
                />
                <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              
              {/* Search Results */}
              {searchQuery.length >= 2 && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg border border-gray-200">
                  {searchLoading ? (
                    <div className="p-4 text-center text-gray-500">Searching...</div>
                  ) : searchResults && searchResults.length > 0 ? (
                    searchResults.map((result) => (
                      <div
                        key={`${result.source}-${result.id}`}
                        className="cursor-pointer px-4 py-2 hover:bg-gray-100 flex items-center"
                        onClick={() => handleSelectResult(result)}
                      >
                        {result.imageUrl && (
                          <img
                            src={result.imageUrl}
                            alt={result.name}
                            className="h-8 w-8 mr-2 object-cover rounded"
                          />
                        )}
                        <div className="flex-grow">
                          <div className="font-medium">{result.name}</div>
                          <div className="text-xs text-gray-500">
                            {result.source === 'database' ? 
                              <span className="text-green-600 font-medium">In Database</span> :
                             result.source === 'submission' ? 
                              <span className="text-orange-600 font-medium">{result.status}</span> :
                             result.source === 'youtube' ? 'YouTube Channel' : 
                             `${result.releaseYear || 'TV Show'}`}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No results found. Submit this show to our database!
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Form Fields */}
            <FormField
              control={form.control}
              name="showName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Show Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Describe the show and where to watch it (Netflix, YouTube, PBS Kids, etc.)"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="suggestedAgeRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Suggested Age Range (optional)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="e.g., 3-5 years, 8+, teens, etc."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="suggestedThemes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Suggested Themes (optional)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      value={field.value?.join(', ') || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const themes = value.split(',').map(theme => theme.trim()).filter(Boolean);
                        field.onChange(themes);
                      }}
                      placeholder="Enter themes separated by commas (e.g., learning, adventure, friendship)"
                    />
                  </FormControl>
                  <FormDescription>
                    Themes help categorize shows and make them easier to find
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full"
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? "Submitting..." : "Submit Show"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}