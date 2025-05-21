import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Loader2, Send, Upload, FilePlus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { queryClient } from "@/lib/queryClient";

// Form schema
const showSubmissionSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(100, "Title cannot exceed 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description cannot exceed 1000 characters"),
  network: z.string().min(2, "Network must be at least 2 characters").optional(),
  releaseYear: z.string()
    .regex(/^\d{4}$/, "Please enter a valid year (e.g., 2023)")
    .refine(year => {
      const numYear = parseInt(year);
      const currentYear = new Date().getFullYear();
      return numYear >= 1920 && numYear <= currentYear + 1;
    }, "Year must be between 1920 and the next year"),
  ageGroup: z.string().min(1, "Please select an age group"),
  youtubeChannelId: z.string().optional(),
  sensoryDetails: z.string().max(500, "Sensory details cannot exceed 500 characters").optional(),
  reasonForSubmission: z.string().min(10, "Please explain why this show should be added").max(500, "Reason cannot exceed 500 characters"),
});

type ShowSubmissionFormValues = z.infer<typeof showSubmissionSchema>;

export default function ShowSubmissionPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<ShowSubmissionFormValues>({
    resolver: zodResolver(showSubmissionSchema),
    defaultValues: {
      title: "",
      description: "",
      network: "",
      releaseYear: new Date().getFullYear().toString(),
      ageGroup: "",
      youtubeChannelId: "",
      sensoryDetails: "",
      reasonForSubmission: "",
    },
  });
  
  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    
    if (file) {
      // Validate the file is an image
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file (JPEG, PNG, etc.)",
          variant: "destructive",
        });
        return;
      }
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };
  
  const onSubmit = async (values: ShowSubmissionFormValues) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // Create form data to handle file upload
      const formData = new FormData();
      
      // Add all form values to FormData
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });
      
      // Add the image file if one was selected
      if (selectedFile) {
        formData.append('imageFile', selectedFile);
      }
      
      // Submit the form
      const response = await fetch('/api/show-submissions', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit show');
      }
      
      // Success!
      toast({
        title: "Show submitted successfully",
        description: "Thank you for your submission! You've earned points for contributing.",
      });
      
      // Reset form
      form.reset();
      setSelectedFile(null);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/user/points'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/points/history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/show-submissions'] });
      
      // Redirect to user dashboard
      setLocation('/user-dashboard');
      
    } catch (error) {
      toast({
        title: "Error submitting show",
        description: "There was a problem submitting your show. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="container py-12 mx-auto text-center">
        <h1 className="text-3xl font-bold mb-6">Exclusive Feature</h1>
        <p className="mb-6">You need to be logged in to submit show recommendations.</p>
        <Link href="/auth">
          <Button>Log In</Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container py-8 mx-auto">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Submit a Show</h1>
        <p className="text-muted-foreground mb-8">
          Help us grow our database by recommending a children's show
        </p>
        
        <Card>
          <CardHeader>
            <CardTitle>Show Submission Form</CardTitle>
            <CardDescription>
              Complete this form to suggest a show for our platform. 
              You'll earn points for each approved submission!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Show Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter the show title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="network"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Network/Studio</FormLabel>
                        <FormControl>
                          <Input placeholder="PBS Kids, Disney Jr, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="releaseYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Release Year *</FormLabel>
                        <FormControl>
                          <Input placeholder="2023" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="ageGroup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Age Group *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an age group" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="infant">Infant (0-1)</SelectItem>
                          <SelectItem value="toddler">Toddler (1-3)</SelectItem>
                          <SelectItem value="preschool">Preschool (3-5)</SelectItem>
                          <SelectItem value="early_elementary">Early Elementary (5-7)</SelectItem>
                          <SelectItem value="elementary">Elementary School (7-10)</SelectItem>
                          <SelectItem value="middle_school">Middle School (10-13)</SelectItem>
                          <SelectItem value="all_ages">All Ages</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Show Description *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe what the show is about..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="youtubeChannelId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>YouTube Channel ID (if applicable)</FormLabel>
                      <FormControl>
                        <Input placeholder="UCXdl5KdsuoPNUMIzJNePdJw" {...field} />
                      </FormControl>
                      <FormDescription>
                        If this is a YouTube show, please provide the channel ID
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="sensoryDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sensory Details</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any notable sensory aspects of the show? (e.g., flashing lights, loud noises, calm music)"
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="reasonForSubmission"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Why should we add this show? *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us why this show would be valuable for our platform..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-2">
                  <FormLabel htmlFor="imageUpload">Show Image</FormLabel>
                  <div className="border-2 border-dashed rounded-md p-6 text-center">
                    <input
                      id="imageUpload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    
                    {!selectedFile ? (
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Upload className="h-10 w-10 text-muted-foreground" />
                        <div className="text-sm text-muted-foreground">
                          Drag and drop or click to upload a show image
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => document.getElementById('imageUpload')?.click()}
                          type="button"
                        >
                          <FilePlus className="h-4 w-4 mr-2" />
                          Select File
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">
                          Selected file: {selectedFile.name}
                        </div>
                        <div className="flex justify-center">
                          <img 
                            src={URL.createObjectURL(selectedFile)} 
                            alt="Preview" 
                            className="max-h-48 object-contain rounded-md" 
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedFile(null)}
                          type="button"
                        >
                          Change Image
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Please upload an image in JPG, PNG, or WebP format up to 5MB.
                  </p>
                </div>
              
                <div className="bg-blue-50 p-4 rounded-md border border-blue-200 flex items-start">
                  <Info className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Submission Guidelines</p>
                    <p>
                      Our team will review your submission within 7-10 business days. 
                      If approved, you'll earn 50 points and the show will be added to our database. 
                      Submissions with complete information and high-quality images have a higher chance of approval.
                    </p>
                  </div>
                </div>
              
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Submit Show Recommendation
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}