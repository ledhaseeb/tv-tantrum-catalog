import { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Film, PlusCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Form validation schema
const submitShowSchema = z.object({
  showName: z.string().min(1, "Show name is required"),
  description: z.string().min(5, "Please provide a more detailed description"),
  ageRange: z.string().min(1, "Age range is required"),
  platform: z.string().min(1, "Platform is required"),
  releaseYear: z.coerce
    .number()
    .min(1950, "Must be after 1950")
    .max(new Date().getFullYear() + 1, `Must be before ${new Date().getFullYear() + 1}`),
  creator: z.string().optional(),
  additionalInfo: z.string().optional(),
});

type FormValues = z.infer<typeof submitShowSchema>;

export default function SubmitShowPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);
  const queryClient = useQueryClient();
  
  // Redirect if not logged in
  if (!user) {
    navigate('/auth');
    return null;
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(submitShowSchema),
    defaultValues: {
      showName: '',
      description: '',
      ageRange: '',
      platform: '',
      releaseYear: new Date().getFullYear(),
      creator: '',
      additionalInfo: '',
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiRequest('/api/user/submissions', 'POST', data);
    },
    onSuccess: () => {
      setIsSubmitSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['/api/user/submissions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/points-history'] });
      toast({
        title: 'Show submitted successfully!',
        description: 'Thank you for contributing. You\'ve earned points for your submission.',
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error submitting show',
        description: error.message || 'There was an error submitting your show. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    submitMutation.mutate(data);
  };

  return (
    <main className="container py-8 px-4 max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Submit a Show</h1>
        <p className="text-muted-foreground">
          Help us grow our database by submitting shows that you'd like to see added. You'll earn points for each approved submission.
        </p>
      </div>

      {isSubmitSuccess ? (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <CardTitle className="text-green-800">Submission Successful!</CardTitle>
            </div>
            <CardDescription className="text-green-700">
              Thank you for contributing to our database. Your submission will be reviewed by our team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-white rounded-md p-4 mb-4 border border-green-200">
              <div className="flex items-center gap-2 mb-4">
                <Info className="h-5 w-5 text-primary" />
                <h3 className="font-medium">What happens next?</h3>
              </div>
              <ol className="list-decimal ml-5 space-y-2 text-sm">
                <li>Our team will review your submission to ensure it meets our criteria.</li>
                <li>If approved, the show will be added to our database and you'll earn additional points.</li>
                <li>You'll be notified once the review is complete.</li>
              </ol>
            </div>
          </CardContent>
          <CardFooter className="flex gap-4">
            <Button onClick={() => setIsSubmitSuccess(false)} variant="outline">
              Submit Another Show
            </Button>
            <Button onClick={() => navigate('/dashboard')} variant="default">
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Film className="h-5 w-5 text-primary" />
              <CardTitle>Show Details</CardTitle>
            </div>
            <CardDescription>
              Please provide as much detail as possible to help us evaluate your submission.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Submission Guidelines</AlertTitle>
              <AlertDescription>
                Only submit shows that are appropriate for children. All submissions are reviewed by our team before being added to the database.
              </AlertDescription>
            </Alert>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="showName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Show Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter the full name of the show" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter the official title of the show as it appears on the platform.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="platform"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platform*</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select platform" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Netflix">Netflix</SelectItem>
                            <SelectItem value="Disney+">Disney+</SelectItem>
                            <SelectItem value="YouTube">YouTube</SelectItem>
                            <SelectItem value="Amazon Prime">Amazon Prime</SelectItem>
                            <SelectItem value="Hulu">Hulu</SelectItem>
                            <SelectItem value="Apple TV+">Apple TV+</SelectItem>
                            <SelectItem value="PBS Kids">PBS Kids</SelectItem>
                            <SelectItem value="HBO Max">HBO Max</SelectItem>
                            <SelectItem value="Paramount+">Paramount+</SelectItem>
                            <SelectItem value="Nickelodeon">Nickelodeon</SelectItem>
                            <SelectItem value="Cartoon Network">Cartoon Network</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Where can this show be watched?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ageRange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Age Range*</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select age range" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0-2 years">0-2 years (Infant/Toddler)</SelectItem>
                            <SelectItem value="2-4 years">2-4 years (Preschool)</SelectItem>
                            <SelectItem value="4-6 years">4-6 years (Early Elementary)</SelectItem>
                            <SelectItem value="6-9 years">6-9 years (Elementary)</SelectItem>
                            <SelectItem value="9-12 years">9-12 years (Pre-Teen)</SelectItem>
                            <SelectItem value="12+ years">12+ years (Teen)</SelectItem>
                            <SelectItem value="All ages">All ages</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          What age group is this show designed for?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="releaseYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Release Year*</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>
                          When was this show first released?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="creator"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Creator/Production Company</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter creator or production company" {...field} />
                        </FormControl>
                        <FormDescription>
                          Who created or produced this show?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description*</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter a detailed description of the show"
                          className="min-h-[120px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a summary of the show's content, themes, and any other relevant information.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="additionalInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Information</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any other information about the show"
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Any additional details that might help our review team (optional).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full md:w-auto"
                    disabled={submitMutation.isPending}
                  >
                    {submitMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Submit Show
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </main>
  );
}