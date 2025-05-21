import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Lock, Upload, FilePlus2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// Form schema with validation rules
const formSchema = z.object({
  name: z.string().min(3, 'Show name must be at least 3 characters').max(100),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  ageRange: z.string().min(1, 'Please select an age range'),
  episodeLength: z.coerce.number().min(1, 'Episode length must be at least 1 minute').max(180, 'Episode length can\'t exceed 180 minutes'),
  platform: z.string().min(1, 'Please enter at least one platform'),
  additionalNotes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const ShowSubmission = () => {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      ageRange: '',
      episodeLength: 0,
      platform: '',
      additionalNotes: '',
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setImageFile(file);
      
      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to submit a show",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = null;

      // First upload the image if one was provided
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        
        const uploadResponse = await apiRequest('/api/shows/upload-image', {
          method: 'POST',
          body: formData,
        });
        
        if (uploadResponse.ok) {
          const imageData = await uploadResponse.json();
          imageUrl = imageData.imageUrl;
        } else {
          throw new Error('Failed to upload image');
        }
      }

      // Then submit the show data
      const submitResponse = await apiRequest('/api/show-submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          imageUrl,
        }),
      });

      if (submitResponse.ok) {
        toast({
          title: "Show submitted successfully!",
          description: "Thank you for your submission. You've earned 15 points!",
        });
        
        // Navigate back to dashboard or show page
        setLocation('/user-dashboard');
      } else {
        throw new Error('Failed to submit show');
      }
    } catch (error) {
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="container py-8">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-2/3"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-[400px] bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-12">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <Lock className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <CardTitle>Exclusive Feature</CardTitle>
            <CardDescription>
              Show submissions are available only to registered users.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => window.location.href = '/api/login'}>Sign In to Access</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Submit a New Show</h1>
            <p className="text-gray-500">
              Help us grow our database by suggesting shows you love
            </p>
          </div>
          <Badge variant="outline" className="bg-orange-50 text-orange-500 border-orange-200">
            <FilePlus2 className="w-3 h-3 mr-1" /> Earn 15 points for each submission
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Show Information</CardTitle>
            <CardDescription>
              Please provide as much detail as possible about the show you're recommending
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Show Name*</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter the show's full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="ageRange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Age Range*</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select age range" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0-2">0-2 years (Infant)</SelectItem>
                            <SelectItem value="3-5">3-5 years (Preschool)</SelectItem>
                            <SelectItem value="6-8">6-8 years (Early Elementary)</SelectItem>
                            <SelectItem value="9-12">9-12 years (Late Elementary)</SelectItem>
                            <SelectItem value="13+">13+ years (Teen)</SelectItem>
                            <SelectItem value="All Ages">All Ages</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="episodeLength"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Episode Length (minutes)*</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} max={180} {...field} />
                        </FormControl>
                        <FormDescription>
                          Typical episode duration in minutes
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="platform"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Available On*</FormLabel>
                        <FormControl>
                          <Input placeholder="Netflix, YouTube, PBS Kids, etc." {...field} />
                        </FormControl>
                        <FormDescription>
                          Where can this show be watched?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description*</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Provide a detailed description of the show, its themes, characters, and educational value." 
                              className="min-h-[120px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="additionalNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Notes</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Any additional information you'd like to share about the show" 
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <FormLabel>Show Image</FormLabel>
                    <div className="mt-2 flex items-center gap-4">
                      <div className="shrink-0 h-32 w-32 rounded-md overflow-hidden bg-gray-100 border flex items-center justify-center">
                        {imagePreview ? (
                          <img 
                            src={imagePreview} 
                            alt="Show preview" 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Upload className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('image-upload')?.click()}
                          className="mb-2"
                        >
                          Select Image
                        </Button>
                        <Input 
                          id="image-upload"
                          type="file" 
                          accept="image/*" 
                          className="hidden"
                          onChange={handleImageChange}
                        />
                        <p className="text-xs text-gray-500">
                          Optional. Upload a poster or promotional image for the show.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation('/')}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Show'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ShowSubmission;