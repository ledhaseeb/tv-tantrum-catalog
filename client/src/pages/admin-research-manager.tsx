import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { FileUploader } from "@/components/FileUploader";
import { 
  Edit, 
  Trash2, 
  PlusCircle, 
  FileText, 
  ExternalLink,
  Search,
  Image as ImageIcon
} from "lucide-react";

// Define the form schema
const researchSchema = z.object({
  headline: z.string().min(3, "Headline must be at least 3 characters"),
  subHeadline: z.string().optional(),
  summary: z.string().min(10, "Summary must be at least 10 characters"),
  keyFindings: z.string().optional(),
  studyDetails: z.string().optional(),
  graphExplanation: z.string().optional(),
  implications: z.string().optional(),
  fullStudyLink: z.string().url("Please enter a valid URL").optional(),
  category: z.string().min(1, "Category is required"),
  source: z.string().optional(),
  publishedDate: z.string().optional()
});

// Research categories
const researchCategories = [
  "Screen Time and Behavioral Impacts",
  "Learning and Cognitive Development",
  "Social and Emotional Development",
  "Digital Literacy",
  "Media Content Analysis",
  "Parental Mediation Strategies",
  "Technology and Physical Health",
  "Research Methodology"
];

// Example sources for dropdown
const exampleSources = [
  "Journal of Pediatrics, 2024",
  "Developmental Psychology, 2024",
  "JAMA Pediatrics, 2023",
  "Journal of Children and Media, 2024",
  "Media Psychology, 2023",
  "Journal of Communication, 2024",
  "Child Development, 2023",
  "Pediatrics, 2024"
];

type ResearchSummary = {
  id: number;
  title: string;
  summary: string;
  fullText?: string;
  category: string;
  imageUrl?: string;
  source?: string;
  originalUrl?: string;
  publishedDate?: string;
  createdAt: string;
  updatedAt: string;
};

const AdminResearchManager: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedResearch, setSelectedResearch] = useState<ResearchSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const queryClient = useQueryClient();

  const { data: researchList, isLoading: isLoadingResearch } = useQuery<ResearchSummary[]>({
    queryKey: ["/api/research"],
  });

  const form = useForm<z.infer<typeof researchSchema>>({
    resolver: zodResolver(researchSchema),
    defaultValues: {
      headline: "",
      subHeadline: "",
      summary: "",
      keyFindings: "",
      studyDetails: "",
      graphExplanation: "",
      implications: "",
      fullStudyLink: "",
      category: "",
      source: "",
      publishedDate: ""
    },
  });

  // When selecting a research to edit, populate the form
  useEffect(() => {
    if (selectedResearch && isEditMode) {
      form.reset({
        headline: selectedResearch.title || "",
        subHeadline: selectedResearch.summary || "",
        summary: selectedResearch.summary || "",
        keyFindings: selectedResearch.fullText?.split("Key Findings:")[1]?.split("Study Details:")[0]?.trim() || "",
        studyDetails: selectedResearch.fullText?.split("Study Details:")[1]?.split("Graph Explanation:")[0]?.trim() || "",
        graphExplanation: selectedResearch.fullText?.split("Graph Explanation:")[1]?.split("Implications:")[0]?.trim() || "",
        implications: selectedResearch.fullText?.split("Implications:")[1]?.trim() || "",
        fullStudyLink: selectedResearch.originalUrl || "",
        category: selectedResearch.category || "",
        source: selectedResearch.source || "",
        publishedDate: selectedResearch.publishedDate ? format(new Date(selectedResearch.publishedDate), "yyyy-MM-dd") : ""
      });
    }
  }, [selectedResearch, isEditMode, form]);

  // Create new research
  const createResearchMutation = useMutation({
    mutationFn: async (data: z.infer<typeof researchSchema>) => {
      // Format the fullText from the form fields
      const fullText = `
${data.subHeadline}

Key Findings:
${data.keyFindings}

Study Details:
${data.studyDetails}

${data.graphExplanation ? `Graph Explanation:
${data.graphExplanation}

` : ''}Implications:
${data.implications}

For the full study click here: ${data.source}
`.trim();

      // Create FormData for image upload
      const formData = new FormData();
      formData.append("title", data.headline);
      formData.append("summary", data.summary);
      formData.append("fullText", fullText);
      formData.append("category", data.category);
      formData.append("source", data.source);
      formData.append("originalUrl", data.fullStudyLink);
      
      if (data.publishedDate) {
        formData.append("publishedDate", data.publishedDate);
      }
      
      if (imageFile) {
        formData.append("image", imageFile);
      }

      return apiRequest("/api/research", {
        method: "POST",
        body: formData,
        headers: {
          // Don't set Content-Type with FormData, browser will set it with boundary
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/research"] });
      toast({
        title: "Research Created",
        description: "The research summary has been created successfully.",
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create research summary",
        variant: "destructive",
      });
    },
  });

  // Update existing research
  const updateResearchMutation = useMutation({
    mutationFn: async (data: { id: number; formData: z.infer<typeof researchSchema> }) => {
      // Format the fullText from the form fields
      const fullText = `
${data.formData.subHeadline}

Key Findings:
${data.formData.keyFindings}

Study Details:
${data.formData.studyDetails}

${data.formData.graphExplanation ? `Graph Explanation:
${data.formData.graphExplanation}

` : ''}Implications:
${data.formData.implications}

For the full study click here: ${data.formData.source}
`.trim();

      // Create FormData for image upload
      const formData = new FormData();
      formData.append("title", data.formData.headline);
      formData.append("summary", data.formData.summary);
      formData.append("fullText", fullText);
      formData.append("category", data.formData.category);
      formData.append("source", data.formData.source);
      formData.append("originalUrl", data.formData.fullStudyLink);
      
      if (data.formData.publishedDate) {
        formData.append("publishedDate", data.formData.publishedDate);
      }
      
      if (imageFile) {
        formData.append("image", imageFile);
      }

      return apiRequest(`/api/research/${data.id}`, {
        method: "PUT",
        body: formData,
        headers: {
          // Don't set Content-Type with FormData, browser will set it with boundary
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/research"] });
      toast({
        title: "Research Updated",
        description: "The research summary has been updated successfully.",
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update research summary",
        variant: "destructive",
      });
    },
  });

  // Delete research
  const deleteResearchMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/research/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/research"] });
      toast({
        title: "Research Deleted",
        description: "The research summary has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete research summary",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    form.reset({
      headline: "",
      subHeadline: "",
      summary: "",
      keyFindings: "",
      studyDetails: "",
      graphExplanation: "",
      implications: "",
      fullStudyLink: "",
      category: "",
      source: "",
      publishedDate: ""
    });
    setImageFile(null);
    setIsFormOpen(false);
    setIsEditMode(false);
    setSelectedResearch(null);
  };

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      setImageFile(files[0]);
    }
  };

  const onSubmit = (data: z.infer<typeof researchSchema>) => {
    if (isEditMode && selectedResearch) {
      updateResearchMutation.mutate({ id: selectedResearch.id, formData: data });
    } else {
      createResearchMutation.mutate(data);
    }
  };

  const handleEditResearch = (research: ResearchSummary) => {
    setSelectedResearch(research);
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const handleDeleteResearch = (id: number) => {
    if (window.confirm("Are you sure you want to delete this research summary? This action cannot be undone.")) {
      deleteResearchMutation.mutate(id);
    }
  };

  // Filter research by category and search term
  const filteredResearch = researchList?.filter(research => {
    const matchesCategory = activeTab === "all" || research.category === activeTab;
    const matchesSearch = searchTerm === "" || 
      research.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (research.summary && research.summary.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  // Group research by category
  const categoryCounts = researchList?.reduce((acc: Record<string, number>, research) => {
    acc[research.category] = (acc[research.category] || 0) + 1;
    return acc;
  }, { all: researchList.length }) || { all: 0 };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Research Manager</h1>
          <p className="text-gray-600 mt-1">Manage research summaries for the application</p>
        </div>
        <Button 
          onClick={() => {
            resetForm();
            setIsEditMode(false);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-1"
        >
          <PlusCircle size={16} />
          Add Research
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative w-full max-w-md mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            className="pl-10"
            placeholder="Search research by title or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto pb-2">
            <TabsList className="mb-2 flex-wrap">
              <TabsTrigger value="all">
                All Research ({categoryCounts["all"] || 0})
              </TabsTrigger>
              {researchCategories.map(category => (
                <TabsTrigger key={category} value={category}>
                  {category.split(" ").map(word => word[0].toUpperCase() + word.substring(1)).join(" ")} ({categoryCounts[category] || 0})
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResearch?.map((research) => (
                <ResearchCard 
                  key={research.id}
                  research={research}
                  onEdit={() => handleEditResearch(research)}
                  onDelete={() => handleDeleteResearch(research.id)}
                />
              ))}
              {filteredResearch?.length === 0 && (
                <div className="col-span-full p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
                  No research found. Try a different search term or add new research.
                </div>
              )}
            </div>
          </TabsContent>

          {researchCategories.map(category => (
            <TabsContent key={category} value={category}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredResearch?.map((research) => (
                  <ResearchCard 
                    key={research.id}
                    research={research}
                    onEdit={() => handleEditResearch(research)}
                    onDelete={() => handleDeleteResearch(research.id)}
                  />
                ))}
                {filteredResearch?.length === 0 && (
                  <div className="col-span-full p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
                    No research found in this category. Try adding new research.
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Research" : "Add New Research"}</DialogTitle>
            <DialogDescription>
              Enter the details for the research summary. All fields except Graph Explanation are required.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="headline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Research Headline</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter the main headline" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="subHeadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Research Sub-Headline</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter the sub-headline" />
                        </FormControl>
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
                            {...field} 
                            placeholder="A brief summary of the research"
                            className="min-h-[80px]"
                          />
                        </FormControl>
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
                            {...field} 
                            placeholder="Main findings and results of the research"
                            className="min-h-[120px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="studyDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Study Details</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Methodology, participants, and other study details"
                            className="min-h-[80px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="graphExplanation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Graph Explanation (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Explanation of any graphs or visual data"
                            className="min-h-[80px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="implications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Implications</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="What the research means for parents, educators, or children"
                            className="min-h-[80px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="fullStudyLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link to Full Study</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="https://..." 
                            type="url"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
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
                          {researchCategories.map(category => (
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
                
                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select or enter source" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {exampleSources.map(source => (
                            <SelectItem key={source} value={source}>
                              {source}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                          {...field} 
                          type="date" 
                          placeholder="YYYY-MM-DD"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="mt-4">
                <Label htmlFor="research-image">Upload Research Image</Label>
                <div className="mt-1">
                  <FileUploader 
                    accept="image/*"
                    onChange={handleFileChange}
                    maxSize={5 * 1024 * 1024} // 5MB
                  />
                  {imageFile && (
                    <p className="text-sm text-gray-500 mt-2">
                      Selected: {imageFile.name} ({Math.round(imageFile.size / 1024)} KB)
                    </p>
                  )}
                  {isEditMode && selectedResearch?.imageUrl && !imageFile && (
                    <div className="flex items-center gap-2 mt-2">
                      <ImageIcon size={16} className="text-gray-500" />
                      <span className="text-sm text-gray-500">Current image will be kept if no new image is uploaded</span>
                    </div>
                  )}
                </div>
              </div>
              
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsFormOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createResearchMutation.isPending || updateResearchMutation.isPending}
                >
                  {createResearchMutation.isPending || updateResearchMutation.isPending
                    ? "Saving..."
                    : isEditMode
                      ? "Update Research"
                      : "Save Research"
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface ResearchCardProps {
  research: ResearchSummary;
  onEdit: () => void;
  onDelete: () => void;
}

const ResearchCard: React.FC<ResearchCardProps> = ({ research, onEdit, onDelete }) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg line-clamp-2">{research.title}</CardTitle>
        <CardDescription className="line-clamp-1">{research.category}</CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="h-32 overflow-hidden mb-2 relative rounded-md">
          {research.imageUrl ? (
            <img 
              src={research.imageUrl} 
              alt={research.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
              <FileText size={32} />
            </div>
          )}
        </div>
        <p className="text-sm text-gray-600 line-clamp-3 mt-2">{research.summary}</p>
        {research.originalUrl && (
          <div className="mt-3">
            <a 
              href={research.originalUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs flex items-center text-blue-600 hover:text-blue-800"
            >
              <ExternalLink size={12} className="mr-1" />
              View original study
            </a>
          </div>
        )}
        {research.source && (
          <div className="mt-1 text-xs text-gray-500">{research.source}</div>
        )}
      </CardContent>
      <CardFooter className="pt-0 justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit size={14} className="mr-1" />
          Edit
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 size={14} className="mr-1" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AdminResearchManager;