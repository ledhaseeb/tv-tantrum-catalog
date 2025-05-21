import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Award,
  BookOpen,
  Clock,
  ExternalLink,
  CheckCircle2,
  Globe,
  Calendar,
  BookMarked,
} from "lucide-react";

interface ResearchSummary {
  id: number;
  title: string;
  summary: string;
  fullText: string;
  source: string;
  publishDate: string;
  hasRead?: boolean;
  category?: string;
}

export default function Research() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedTab, setSelectedTab] = useState("all");
  const [expandedSummary, setExpandedSummary] = useState<number | null>(null);

  // Fetch research summaries
  const { data: summaries, isLoading, refetch } = useQuery({
    queryKey: ['/api/research'],
    queryFn: async () => {
      const response = await fetch('/api/research');
      if (!response.ok) {
        throw new Error('Failed to fetch research summaries');
      }
      const data = await response.json();
      return data as ResearchSummary[];
    },
  });

  // Mark research as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (researchId: number) => {
      return apiRequest(`/api/research/${researchId}/mark-read`, "POST");
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "Research marked as read",
        description: "You've earned points for reading research!",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to mark research as read",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    },
  });

  const handleMarkAsRead = (id: number) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to track your research reading",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }

    markAsReadMutation.mutate(id);
  };

  // Filter summaries based on selected tab
  const filteredSummaries = summaries?.filter((summary) => {
    if (selectedTab === "all") return true;
    if (selectedTab === "read") return summary.hasRead;
    if (selectedTab === "unread") return !summary.hasRead;
    return summary.category === selectedTab;
  });

  // Count read summaries
  const readCount = summaries?.filter((summary) => summary.hasRead).length || 0;
  const totalCount = summaries?.length || 0;
  const unreadCount = totalCount - readCount;

  // Calculate reading time in minutes (approx 200 words per minute)
  const calculateReadingTime = (text: string) => {
    const wordCount = text.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / 200));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-lg">Loading research summaries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">Research Library</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Explore research about children's media, screen time, and developmental impacts.
          Earn points by reading these research summaries!
        </p>
      </div>

      {!user ? (
        <Card className="mb-8">
          <CardHeader className="text-center">
            <CardTitle>Login Required</CardTitle>
            <CardDescription>
              Please log in to track your reading and earn points
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Button onClick={() => setLocation("/auth")}>Login / Register</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-muted/40">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center">
                <BookMarked className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Summaries</p>
                <h3 className="text-2xl font-bold">{totalCount}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-muted/40">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Read</p>
                <h3 className="text-2xl font-bold">{readCount}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-muted/40">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center">
                <Award className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Points Earned</p>
                <h3 className="text-2xl font-bold">{readCount * 10}</h3>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 sm:grid-cols-5 max-w-3xl mx-auto">
          <TabsTrigger value="all">
            All
            <Badge variant="outline" className="ml-2">
              {totalCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            <Badge variant="outline" className="ml-2">
              {unreadCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="read">
            Read
            <Badge variant="outline" className="ml-2">
              {readCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="screentime">Screen Time</TabsTrigger>
          <TabsTrigger value="development">Development</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-6">
          {filteredSummaries?.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-xl font-medium mb-2">No research summaries found</h3>
              <p className="text-muted-foreground">
                {selectedTab === "read" 
                  ? "You haven't read any research summaries yet."
                  : "No research summaries in this category."}
              </p>
              {selectedTab === "read" && (
                <Button onClick={() => setSelectedTab("unread")} className="mt-4">
                  Browse Unread Summaries
                </Button>
              )}
            </div>
          ) : (
            filteredSummaries?.map((summary) => (
              <Card key={summary.id} className={summary.hasRead ? "border-primary/30" : ""}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">
                        {summary.title}
                        {summary.hasRead && (
                          <span className="inline-flex items-center ml-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="flex flex-wrap gap-2 mt-2">
                        <span className="inline-flex items-center">
                          <Globe className="h-3.5 w-3.5 mr-1" />
                          {summary.source}
                        </span>
                        <span className="inline-flex items-center">
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          {new Date(summary.publishDate).toLocaleDateString()}
                        </span>
                        <span className="inline-flex items-center">
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          {calculateReadingTime(summary.fullText)} min read
                        </span>
                      </CardDescription>
                    </div>
                    {summary.hasRead && (
                      <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary">
                        Read
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      {expandedSummary === summary.id 
                        ? summary.fullText
                        : summary.summary}
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      {expandedSummary === summary.id ? (
                        <Button 
                          variant="outline" 
                          onClick={() => setExpandedSummary(null)}
                        >
                          Show Less
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          onClick={() => setExpandedSummary(summary.id)}
                        >
                          Read Full Text
                        </Button>
                      )}
                      
                      {!summary.hasRead && (
                        <Button 
                          variant="default"
                          onClick={() => handleMarkAsRead(summary.id)}
                          disabled={markAsReadMutation.isPending}
                        >
                          {markAsReadMutation.isPending ? (
                            <>
                              <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Marking as Read...
                            </>
                          ) : (
                            <>
                              <BookOpen className="h-4 w-4 mr-2" />
                              Mark as Read (+10 pts)
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Separator className="my-12" />

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Why Read Research?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Staying informed about the latest research helps you make better decisions about your child's media consumption.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Informed Decisions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Research provides evidence-based insights to help you make better choices about the content your children consume.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Earn Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Reading research summaries earns you 10 points per article, helping you climb our community leaderboard.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Access Original Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We provide links to original research papers and articles so you can explore topics in greater depth.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}