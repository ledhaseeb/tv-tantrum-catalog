import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const linkUpdateSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
});

const ResearchLinkUpdater = () => {
  const [selectedResearch, setSelectedResearch] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: researchList, isLoading: isLoadingResearch } = useQuery({
    queryKey: ["/api/research"],
  });

  const form = useForm({
    resolver: zodResolver(linkUpdateSchema),
    defaultValues: {
      url: "",
    },
  });

  const updateResearchMutation = useMutation({
    mutationFn: async (data: { id: number; url: string }) => {
      return apiRequest(`/api/research/${data.id}/update-link`, {
        method: "POST",
        body: JSON.stringify({ originalUrl: data.url }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/research"] });
      toast({
        title: "Link updated",
        description: "The research link has been updated successfully",
      });
      form.reset();
      setSelectedResearch(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update the research link",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof linkUpdateSchema>) => {
    if (selectedResearch) {
      updateResearchMutation.mutate({ id: selectedResearch, url: data.url });
    }
  };

  const handleSelect = (id: number) => {
    setSelectedResearch(id);
    // Find if research already has a link
    const research = researchList?.find((r: any) => r.id === id);
    if (research?.originalUrl) {
      form.setValue("url", research.originalUrl);
    } else {
      form.reset();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Research Link Updater</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>Research Articles</CardTitle>
              <CardDescription>
                Select a research article to update its original source link
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingResearch ? (
                <div>Loading research articles...</div>
              ) : (
                <div className="space-y-4">
                  {researchList?.map((research: any) => (
                    <div 
                      key={research.id} 
                      className={`p-4 border rounded-md cursor-pointer ${
                        selectedResearch === research.id 
                          ? "border-blue-500 bg-blue-50" 
                          : "hover:border-gray-400"
                      }`}
                      onClick={() => handleSelect(research.id)}
                    >
                      <div className="font-medium">{research.title}</div>
                      <div className="text-sm text-gray-500 mt-1">{research.category}</div>
                      {research.originalUrl && (
                        <div className="text-xs text-green-600 mt-2">
                          Has link: {research.originalUrl}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Update Link</CardTitle>
              <CardDescription>
                {selectedResearch 
                  ? "Enter the original research URL" 
                  : "Select a research article first"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Original Research URL</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="https://..." 
                            disabled={!selectedResearch}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    disabled={!selectedResearch || updateResearchMutation.isPending}
                    className="w-full"
                  >
                    {updateResearchMutation.isPending ? "Updating..." : "Update Link"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResearchLinkUpdater;