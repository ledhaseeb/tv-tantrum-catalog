import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Award, Send, ThumbsUp } from "lucide-react";

// Form validation schema
const submitShowSchema = z.object({
  name: z.string().min(2, "Show name must be at least 2 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  ageRange: z.string().min(1, "Please select an age range"),
  creator: z.string().min(2, "Creator name must be at least 2 characters"),
  releaseYear: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  country: z.string().optional(),
  platform: z.string().optional(),
  additionalDetails: z.string().optional(),
});

type SubmitShowFormValues = z.infer<typeof submitShowSchema>;

export default function SubmitShow() {
  const { user } = useAuth();
  // Using window.location for navigation instead of useNavigate
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with default values
  const form = useForm<SubmitShowFormValues>({
    resolver: zodResolver(submitShowSchema),
    defaultValues: {
      name: "",
      description: "",
      ageRange: "",
      creator: "",
      releaseYear: "",
      country: "",
      platform: "",
      additionalDetails: "",
    },
  });

  // Handle form submission
  const submitMutation = useMutation({
    mutationFn: (data: SubmitShowFormValues) => {
      return apiRequest("/api/show-submissions", {
        method: "POST",
        data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Show submitted successfully!",
        description: "You've earned points for your contribution. Thank you!",
        variant: "default",
      });
      window.location.href = "/user-dashboard?tab=submissions";
    },
    onError: (error) => {
      toast({
        title: "Failed to submit show",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: SubmitShowFormValues) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to submit a show",
        variant: "destructive",
      });
      window.location.href = "/auth";
      return;
    }

    setIsSubmitting(true);
    submitMutation.mutate(data);
  };

  if (!user) {
    return (
      <div className="container max-w-3xl mx-auto py-8 px-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Submit a Show</CardTitle>
            <CardDescription>
              Please log in to submit a new show for consideration
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Link href="/auth"><Button>Login / Register</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Submit a Show</h1>
        <p className="text-muted-foreground">
          Help us expand our database by suggesting shows not yet included
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Benefits of Contributing</CardTitle>
          <CardDescription>
            Earn points and help other parents discover great content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
              <Award className="h-8 w-8 text-primary mb-2" />
              <span className="text-lg font-bold">Earn 25 Points</span>
              <p className="text-sm text-center text-muted-foreground">
                Get points for each approved submission
              </p>
            </div>
            <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
              <ThumbsUp className="h-8 w-8 text-primary mb-2" />
              <span className="text-lg font-bold">Help the Community</span>
              <p className="text-sm text-center text-muted-foreground">
                Share your discoveries with other parents
              </p>
            </div>
            <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
              <Send className="h-8 w-8 text-primary mb-2" />
              <span className="text-lg font-bold">Climb the Leaderboard</span>
              <p className="text-sm text-center text-muted-foreground">
                Increase your rank in the community
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Show Details</CardTitle>
          <CardDescription>
            Fill in as much information as you can about the show
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Show Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter the full name of the show" {...field} />
                    </FormControl>
                    <FormDescription>
                      Please provide the complete and official title of the show
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          <SelectItem value="0-2">0-2 years (Infants)</SelectItem>
                          <SelectItem value="2-4">2-4 years (Toddlers)</SelectItem>
                          <SelectItem value="4-6">4-6 years (Preschool)</SelectItem>
                          <SelectItem value="6-9">6-9 years (Elementary)</SelectItem>
                          <SelectItem value="9-12">9-12 years (Pre-teen)</SelectItem>
                          <SelectItem value="12+">12+ years (Teen)</SelectItem>
                          <SelectItem value="All ages">All ages</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose the most appropriate age range for the show
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
                      <FormLabel>Creator/Producer*</FormLabel>
                      <FormControl>
                        <Input placeholder="Creator or production company" {...field} />
                      </FormControl>
                      <FormDescription>
                        Who created or produces this show?
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
                      <FormLabel>Release Year</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Year the show was first released"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        When did the show first premiere?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country of Origin</FormLabel>
                      <FormControl>
                        <Input placeholder="Country where the show was produced" {...field} />
                      </FormControl>
                      <FormDescription>
                        Where was the show created?
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
                    <FormLabel>Available On</FormLabel>
                    <FormControl>
                      <Input placeholder="Where can the show be watched? (e.g., Netflix, YouTube, PBS Kids)" {...field} />
                    </FormControl>
                    <FormDescription>
                      List platforms or channels where the show is available
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
                        placeholder="Provide a brief description of the show, its content, characters, and educational value"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Include details about the show's style, content, and what children might learn
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="additionalDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Information</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any other details you think would be helpful (episode length, sensory considerations, themes, etc.)"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional: Add any other information that might help parents decide if this show is appropriate
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <CardFooter className="px-0 pt-4 pb-0 flex flex-col sm:flex-row gap-4">
                <Button
                  type="submit"
                  className="w-full sm:w-auto"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Show
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => window.location.href = "/user-dashboard"}
                >
                  Cancel
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>
          Show submissions are reviewed by our team. You'll earn points if your submission is approved.
        </p>
      </div>
    </div>
  );
}