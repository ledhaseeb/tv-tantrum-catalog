import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Check, Filter, Clock, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ResearchSummary {
  id: number;
  title: string;
  content: string;
  category: string;
  pointsValue: number;
  createdAt: string;
}

export default function ResearchPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Redirect if not logged in
  if (!user) {
    navigate('/auth');
    return null;
  }

  // Fetch all research summaries
  const { data: researchSummaries = [], isLoading } = useQuery({
    queryKey: ['/api/research-summaries'],
    enabled: !!user
  });

  // Fetch user's read research
  const { data: readResearch = [] } = useQuery({
    queryKey: ['/api/user/research/read'],
    enabled: !!user
  });

  // Mark research as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (researchId: number) => {
      return apiRequest('/api/user/research/read', 'POST', { researchId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/research/read'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/points-history'] });
      toast({
        title: 'Research marked as read',
        description: 'You have earned points for reading this research summary.'
      });
    }
  });

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Filter research summaries based on search query and category filter
  const filteredSummaries = (researchSummaries as ResearchSummary[]).filter(summary => {
    const matchesSearch = summary.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          summary.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = !filter || summary.category === filter;
    return matchesSearch && matchesFilter;
  });

  // Get unique categories
  const categories = [...new Set((researchSummaries as ResearchSummary[]).map(summary => summary.category))];

  // Check if a research summary has been read
  const isRead = (id: number) => {
    return (readResearch as any[]).some(read => read.researchId === id);
  };

  const handleMarkAsRead = (summaryId: number) => {
    if (isRead(summaryId)) {
      toast({
        title: 'Already read',
        description: 'You have already read this research summary.'
      });
      return;
    }
    
    markAsReadMutation.mutate(summaryId);
  };

  return (
    <main className="container py-8 px-4 max-w-6xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Research Summaries</h1>
        <p className="text-muted-foreground">
          Learn about children's media consumption and earn points for reading research summaries.
        </p>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="all">All Research</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="read">Read</TabsTrigger>
          </TabsList>
          
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search research..."
              className="pl-8 w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={filter === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setFilter(null)}
            >
              All Categories
            </Badge>
            {categories.map(category => (
              <Badge
                key={category}
                variant={filter === category ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setFilter(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        )}

        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-muted-foreground">Loading research summaries...</p>
            </div>
          ) : filteredSummaries.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">No research summaries found</h3>
              <p className="mt-2 text-muted-foreground">
                {searchQuery || filter
                  ? "Try adjusting your search or filter"
                  : "Check back soon for new research summaries"}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSummaries.map((summary) => (
                <ResearchCard
                  key={summary.id}
                  summary={summary}
                  isRead={isRead(summary.id)}
                  onMarkAsRead={handleMarkAsRead}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-muted-foreground">Loading research summaries...</p>
            </div>
          ) : filteredSummaries.filter(summary => !isRead(summary.id)).length === 0 ? (
            <div className="text-center py-12">
              <Check className="mx-auto h-12 w-12 text-green-500 opacity-70" />
              <h3 className="mt-4 text-lg font-medium">You've read all the research summaries</h3>
              <p className="mt-2 text-muted-foreground">
                Great job! Check back soon for new research.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSummaries
                .filter(summary => !isRead(summary.id))
                .map((summary) => (
                  <ResearchCard
                    key={summary.id}
                    summary={summary}
                    isRead={false}
                    onMarkAsRead={handleMarkAsRead}
                    formatDate={formatDate}
                  />
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="read" className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-muted-foreground">Loading research summaries...</p>
            </div>
          ) : filteredSummaries.filter(summary => isRead(summary.id)).length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">No read research summaries</h3>
              <p className="mt-2 text-muted-foreground">
                Start reading to earn points and track your progress.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSummaries
                .filter(summary => isRead(summary.id))
                .map((summary) => (
                  <ResearchCard
                    key={summary.id}
                    summary={summary}
                    isRead={true}
                    onMarkAsRead={handleMarkAsRead}
                    formatDate={formatDate}
                  />
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}

interface ResearchCardProps {
  summary: ResearchSummary;
  isRead: boolean;
  onMarkAsRead: (id: number) => void;
  formatDate: (date: string) => string;
}

function ResearchCard({ summary, isRead, onMarkAsRead, formatDate }: ResearchCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <Badge variant="outline" className="mb-2">
            {summary.category}
          </Badge>
          {isRead && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-none">
              <Check className="mr-1 h-3 w-3" />
              Read
            </Badge>
          )}
        </div>
        <CardTitle className="text-xl">{summary.title}</CardTitle>
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5 mr-1" />
          <span>{formatDate(summary.createdAt)}</span>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className={expanded ? "" : "line-clamp-4"}>
          <p className="text-sm text-gray-700 whitespace-pre-line">
            {summary.content}
          </p>
        </div>
        {summary.content.length > 300 && (
          <Button 
            variant="link" 
            className="p-0 h-auto text-sm mt-2" 
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Show less" : "Read more"}
          </Button>
        )}
      </CardContent>
      <Separator />
      <CardFooter className="flex justify-between pt-4">
        <div className="flex items-center">
          <BookOpen className="text-primary h-4 w-4 mr-1" />
          <span className="text-sm font-medium">{summary.pointsValue} points</span>
        </div>
        <Button 
          variant={isRead ? "outline" : "default"} 
          size="sm" 
          onClick={() => onMarkAsRead(summary.id)}
          disabled={isRead}
        >
          {isRead ? "Already Read" : "Mark as Read"}
        </Button>
      </CardFooter>
    </Card>
  );
}