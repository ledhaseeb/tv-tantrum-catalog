import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, BookOpen, BookmarkPlus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface ResearchSummary {
  id: number;
  title: string;
  content: string;
  category: string;
  publishedAt: string;
  readCount: number;
  isRead?: boolean;
}

export default function ResearchPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  
  // Fetch research summaries
  const { data: researchSummaries, isLoading: isSummariesLoading } = useQuery<ResearchSummary[]>({
    queryKey: ['/api/research-summaries'],
    enabled: !!user,
  });
  
  // Mark research as read mutation
  const markAsRead = useMutation({
    mutationFn: async (summaryId: number) => {
      const response = await fetch(`/api/research-summaries/${summaryId}/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark research as read');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/research-summaries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/points'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/points/history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/research'] });
      
      toast({
        title: "Research summary marked as read",
        description: "You've earned points for reading this research!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark research as read. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const isLoading = isAuthLoading || isSummariesLoading;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="container py-12 mx-auto text-center">
        <h1 className="text-3xl font-bold mb-6">Exclusive Content</h1>
        <p className="mb-6">You need to be logged in to access research summaries.</p>
        <Link href="/auth">
          <Button>Log In</Button>
        </Link>
      </div>
    );
  }
  
  // Group summaries by category
  const categories = researchSummaries 
    ? ['all', ...new Set(researchSummaries.map(summary => summary.category))]
    : ['all'];
  
  // Filter summaries by active category
  const filteredSummaries = researchSummaries 
    ? activeCategory === 'all' 
        ? researchSummaries 
        : researchSummaries.filter(summary => summary.category === activeCategory)
    : [];
  
  return (
    <div className="container py-8 mx-auto">
      <div className="flex items-center mb-8">
        <BookOpen className="h-8 w-8 mr-3 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Research Summaries</h1>
          <p className="text-muted-foreground">
            Exclusive content for registered users
          </p>
        </div>
      </div>
      
      <div className="mb-8">
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="mb-8">
            {categories.map(category => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSummaries.map(summary => (
              <Card key={summary.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl line-clamp-2 mb-2">{summary.title}</CardTitle>
                    {summary.isRead ? (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        <span>Read</span>
                      </Badge>
                    ) : null}
                  </div>
                  <CardDescription>
                    Published {formatDistanceToNow(new Date(summary.publishedAt))} ago
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-muted-foreground line-clamp-4 mb-4">
                    {summary.content.substring(0, 300)}...
                  </p>
                  <Badge variant="secondary" className="capitalize">
                    {summary.category}
                  </Badge>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                  <span className="text-xs text-muted-foreground">
                    {summary.readCount} {summary.readCount === 1 ? 'person' : 'people'} read this
                  </span>
                  <Link href={`/research/${summary.id}`}>
                    <Button
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      {summary.isRead ? (
                        <>Read Again</>
                      ) : (
                        <>
                          <BookmarkPlus className="h-4 w-4 mr-1" />
                          Read & Earn Points
                        </>
                      )}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </Tabs>
      </div>
      
      {filteredSummaries.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">No research summaries available</h3>
          <p className="text-muted-foreground mb-6">
            Check back later for new research summaries in this category
          </p>
        </div>
      )}
    </div>
  );
}

export function ResearchDetailPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, params] = useLocation('/research/:id');
  const summaryId = params ? parseInt(params.id) : 0;
  
  // Fetch specific research summary
  const { data: summary, isLoading: isSummaryLoading } = useQuery<ResearchSummary>({
    queryKey: [`/api/research-summaries/${summaryId}`],
    enabled: !!summaryId && !!user,
  });
  
  // Mark research as read mutation
  const markAsRead = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/research-summaries/${summaryId}/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark research as read');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/research-summaries/${summaryId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/points'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/points/history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/research'] });
      
      toast({
        title: "Research summary marked as read",
        description: "You've earned points for reading this research!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark research as read. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const isLoading = isAuthLoading || isSummaryLoading;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="container py-12 mx-auto text-center">
        <h1 className="text-3xl font-bold mb-6">Exclusive Content</h1>
        <p className="mb-6">You need to be logged in to access research summaries.</p>
        <Link href="/auth">
          <Button>Log In</Button>
        </Link>
      </div>
    );
  }
  
  if (!summary) {
    return (
      <div className="container py-12 mx-auto text-center">
        <h1 className="text-3xl font-bold mb-6">Research Summary Not Found</h1>
        <p className="mb-6">The research summary you're looking for doesn't exist or has been removed.</p>
        <Link href="/research">
          <Button>Back to Research</Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container py-8 mx-auto max-w-4xl">
      <Link href="/research" className="flex items-center text-primary hover:underline mb-6">
        <BookOpen className="h-4 w-4 mr-2" />
        Back to Research Summaries
      </Link>
      
      <div className="bg-white rounded-lg overflow-hidden shadow-sm border">
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <Badge variant="secondary" className="capitalize">
              {summary.category}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Published {formatDistanceToNow(new Date(summary.publishedAt))} ago
            </span>
          </div>
          
          <h1 className="text-3xl font-bold mb-6">{summary.title}</h1>
          
          <div className="prose max-w-none">
            {summary.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-4">{paragraph}</p>
            ))}
          </div>
          
          <div className="mt-12 pt-6 border-t flex items-center justify-between">
            <div>
              <span className="text-sm text-muted-foreground">
                {summary.readCount} {summary.readCount === 1 ? 'person' : 'people'} read this
              </span>
            </div>
            
            {!summary.isRead && (
              <Button 
                onClick={() => markAsRead.mutate()}
                disabled={markAsRead.isPending}
                className="flex items-center gap-1"
              >
                {markAsRead.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Mark as Read & Earn Points
              </Button>
            )}
            
            {summary.isRead && (
              <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                You've read this
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}