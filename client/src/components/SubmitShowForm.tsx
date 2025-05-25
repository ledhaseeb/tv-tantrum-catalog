import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Search, Youtube, Database, Film, ArrowUpDown, Check, ChevronsUpDown, Tv } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define a schema for show submission
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Show name must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  ageRange: z.string().min(1, {
    message: "Please select an age range.",
  }),
  episodeLength: z.coerce.number().optional(),
  platform: z.string().optional(),
  additionalNotes: z.string().optional(),
  videoSampleUrl: z.string().url().optional().or(z.literal("")),
});

// Type for API search results
type SearchResult = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  source: string;
  releaseYear?: string;
};

// Type for show submission
type ShowSubmission = z.infer<typeof formSchema>;

export default function SubmitShowForm() {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchSource, setSearchSource] = useState<string>("all");
  const [tab, setTab] = useState("manual");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form definition
  const form = useForm<ShowSubmission>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      ageRange: "",
      episodeLength: undefined,
      platform: "",
      additionalNotes: "",
      videoSampleUrl: "",
    },
  });

  // Mutation for submitting a show
  const submitMutation = useMutation({
    mutationFn: (data: ShowSubmission) => apiRequest("/api/show-submissions", {
      method: "POST",
      data,
    }),
    onSuccess: () => {
      toast({
        title: "Show submitted successfully!",
        description: "Thank you for your submission. You've earned 5 points!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/show-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/dashboard"] });
      form.reset();
      setSelectedResult(null);
      setSearchTerm("");
      setSearchResults([]);
    },
    onError: (error) => {
      toast({
        title: "Failed to submit show",
        description: error.message || "There was an error submitting your show. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Query for similar show submissions (autocomplete)
  const { data: similarSubmissions } = useQuery({
    queryKey: ["/api/show-submissions/search", debouncedSearchTerm],
    queryFn: () => 
      debouncedSearchTerm.length >= 2 
        ? apiRequest(`/api/show-submissions/search?q=${encodeURIComponent(debouncedSearchTerm)}`)
        : Promise.resolve([]),
    enabled: debouncedSearchTerm.length >= 2,
  });

  // Query for external API results
  const { data: externalResults, isLoading: isLoadingExternal } = useQuery({
    queryKey: ["/api/lookup/show", debouncedSearchTerm, searchSource],
    queryFn: () => 
      debouncedSearchTerm.length >= 2 
        ? apiRequest(`/api/lookup/show?q=${encodeURIComponent(debouncedSearchTerm)}&source=${searchSource}`)
        : Promise.resolve([]),
    enabled: tab === "search" && debouncedSearchTerm.length >= 2,
  });

  // Update search results when external API results change
  useEffect(() => {
    if (externalResults) {
      setSearchResults(externalResults);
    }
  }, [externalResults]);

  // Handle show submission
  const onSubmit = (data: ShowSubmission) => {
    submitMutation.mutate(data);
  };

  // Handle selecting a search result
  const handleSelectResult = (result: SearchResult) => {
    setSelectedResult(result);
    
    // Update form values based on the selected result
    form.setValue("name", result.name);
    
    if (result.description) {
      form.setValue("description", result.description);
    }
    
    // Close the search popover
    setOpen(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Submit a Show</CardTitle>
        <CardDescription>
          Request a new show to be added to our database. You'll earn points when your submission is approved!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">
              <Tv className="h-4 w-4 mr-2" />
              Manual Entry
            </TabsTrigger>
            <TabsTrigger value="search">
              <Search className="h-4 w-4 mr-2" />
              Smart Lookup
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual" className="space-y-4 mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Show Name*</FormLabel>
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Input
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                setSearchTerm(e.target.value);
                              }}
                              placeholder="Enter show name"
                            />
                          </FormControl>
                        </PopoverTrigger>
                        {similarSubmissions && similarSubmissions.length > 0 && (
                          <PopoverContent className="w-[400px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search shows..." />
                              <CommandEmpty>No similar submissions found.</CommandEmpty>
                              <CommandGroup heading="Similar submissions">
                                <ScrollArea className="h-[200px]">
                                  {similarSubmissions.map((item) => (
                                    <CommandItem
                                      key={item.id}
                                      value={item.name}
                                      onSelect={() => {
                                        form.setValue("name", item.name);
                                        setOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 ${
                                          field.value === item.name ? "opacity-100" : "opacity-0"
                                        }`}
                                      />
                                      {item.name} 
                                      {item.count > 1 && (
                                        <span className="ml-2 text-xs text-muted-foreground">
                                          (Submitted {item.count} times)
                                        </span>
                                      )}
                                    </CommandItem>
                                  ))}
                                </ScrollArea>
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        )}
                      </Popover>
                      <FormDescription>
                        The name of the TV show or YouTube channel you want to submit.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description*</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide a description of the show"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Please provide a brief description of the show.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="ageRange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age Range*</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select age range" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0-2">0-2 years</SelectItem>
                            <SelectItem value="3-5">3-5 years</SelectItem>
                            <SelectItem value="6-8">6-8 years</SelectItem>
                            <SelectItem value="9-12">9-12 years</SelectItem>
                            <SelectItem value="13+">13+ years</SelectItem>
                            <SelectItem value="All ages">All ages</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The target age range for the show.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="episodeLength"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Episode Length (minutes)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="30"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Average length of each episode in minutes.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Where to Watch</FormLabel>
                      <FormControl>
                        <Input placeholder="Netflix, Disney+, YouTube, etc." {...field} />
                      </FormControl>
                      <FormDescription>
                        Where can this show be watched?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="videoSampleUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video Sample URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://youtube.com/watch?v=..." {...field} />
                      </FormControl>
                      <FormDescription>
                        Optional: Link to a video sample of the show (YouTube, Vimeo, etc.)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="additionalNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional information you'd like to share"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional: Any other information about the show you think would be helpful.
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
          </TabsContent>
          
          <TabsContent value="search" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <FormLabel htmlFor="search">Search for a Show</FormLabel>
                <div className="flex gap-2">
                  <Input
                    id="search"
                    placeholder="Search for a show or YouTube channel"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={searchSource} onValueChange={setSearchSource}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      <SelectItem value="youtube">
                        <div className="flex items-center">
                          <Youtube className="mr-2 h-4 w-4" />
                          YouTube
                        </div>
                      </SelectItem>
                      <SelectItem value="omdb">
                        <div className="flex items-center">
                          <Film className="mr-2 h-4 w-4" />
                          OMDB
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-muted-foreground">
                  Search for shows across YouTube and OMDB databases.
                </p>
              </div>

              {isLoadingExternal && searchTerm.length >= 2 ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : searchResults && searchResults.length > 0 ? (
                <ScrollArea className="h-[300px] border rounded-md">
                  <div className="p-4 grid grid-cols-1 gap-4">
                    {searchResults.map((result) => (
                      <div
                        key={`${result.source}-${result.id}`}
                        className={`flex items-start p-3 rounded-md cursor-pointer hover:bg-accent ${
                          selectedResult?.id === result.id && selectedResult?.source === result.source
                            ? "bg-accent"
                            : ""
                        }`}
                        onClick={() => handleSelectResult(result)}
                      >
                        {result.imageUrl ? (
                          <img
                            src={result.imageUrl}
                            alt={result.name}
                            className="w-16 h-16 object-cover rounded-md mr-4"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center mr-4">
                            {result.source === "youtube" ? (
                              <Youtube className="h-6 w-6 text-muted-foreground" />
                            ) : (
                              <Film className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{result.name}</h4>
                            <span className="text-xs px-2 py-1 rounded-full bg-muted">
                              {result.source === "youtube" ? "YouTube" : "OMDB"}
                            </span>
                          </div>
                          {result.releaseYear && (
                            <p className="text-sm text-muted-foreground">
                              Released: {result.releaseYear}
                            </p>
                          )}
                          {result.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {result.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : searchTerm.length >= 2 ? (
                <div className="text-center p-4 border rounded-md bg-muted/20">
                  <p>No results found. Try a different search term.</p>
                </div>
              ) : null}

              {selectedResult && (
                <div className="border rounded-md p-4 mt-4 bg-muted/20">
                  <h3 className="font-medium mb-2">Selected: {selectedResult.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use this information to fill out the show submission form.
                  </p>
                  <Button 
                    onClick={() => setTab("manual")} 
                    className="w-full"
                  >
                    Continue to Form
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between text-sm text-muted-foreground">
        <p>* Required fields</p>
        <p>Earn 5 points for each submission!</p>
      </CardFooter>
    </Card>
  );
}