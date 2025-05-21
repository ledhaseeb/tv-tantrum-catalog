import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { BookOpen, BookText, ArrowRight, Lock } from 'lucide-react';

const Research = () => {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const [, setLocation] = useLocation();

  const { data: summaries, isLoading: isLoadingSummaries } = useQuery({
    queryKey: ['/api/research'],
    enabled: !!user,
  });

  // Define categories
  const categories = [
    { id: 'all', name: 'All Research' },
    { id: 'sensory', name: 'Sensory Impact' },
    { id: 'development', name: 'Child Development' },
    { id: 'parenting', name: 'Parenting Tips' },
    { id: 'education', name: 'Educational Content' },
  ];

  if (isLoadingAuth) {
    return (
      <div className="container py-8">
        <div className="space-y-4">
          <Skeleton className="h-12 w-[250px]" />
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
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
            <CardTitle>Exclusive Content</CardTitle>
            <CardDescription>
              Research summaries are available only to registered users.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => window.location.href = '/api/login'}>Sign In to Access</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isLoadingSummaries) {
    return (
      <div className="container py-8">
        <div className="space-y-4">
          <Skeleton className="h-12 w-[250px]" />
          <div className="flex gap-2 overflow-x-auto py-2">
            {categories.map((_, i) => (
              <Skeleton key={i} className="h-8 w-[120px]" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[250px] w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Group research by category
  const categorizedSummaries = summaries?.reduce((acc: any, summary: any) => {
    const categoryId = summary.category || 'uncategorized';
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(summary);
    return acc;
  }, {});

  // Get all unique categories from the data
  const dataCategories = new Set(summaries?.map((summary: any) => summary.category || 'uncategorized'));

  // Filter summaries based on active category
  const filteredSummaries = activeCategory === 'all'
    ? summaries
    : categorizedSummaries?.[activeCategory] || [];

  const handleReadMore = (summaryId: number) => {
    setLocation(`/research/${summaryId}`);
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Research Summaries</h1>
          <p className="text-gray-500">
            Discover the latest research on children's media and development
          </p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-500 border-blue-200">
          <BookOpen className="w-3 h-3 mr-1" /> Earn 5 points for each summary you read
        </Badge>
      </div>

      <Tabs 
        defaultValue="all" 
        value={activeCategory} 
        onValueChange={setActiveCategory} 
        className="mb-8"
      >
        <TabsList className="flex mb-6 overflow-x-auto pb-2 px-1">
          {categories.map((category) => (
            <TabsTrigger 
              key={category.id}
              value={category.id}
              className="min-w-[120px] flex-shrink-0"
            >
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.id === 'all'
                ? summaries?.map((summary: any) => (
                    <ResearchCard key={summary.id} summary={summary} onReadMore={handleReadMore} />
                  ))
                : categorizedSummaries?.[category.id]?.map((summary: any) => (
                    <ResearchCard key={summary.id} summary={summary} onReadMore={handleReadMore} />
                  )) || (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      <BookText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p>No research summaries found in this category</p>
                    </div>
                  )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

interface ResearchCardProps {
  summary: any;
  onReadMore: (id: number) => void;
}

const ResearchCard = ({ summary, onReadMore }: ResearchCardProps) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <Badge variant="outline" className="mb-2">
            {summary.category || 'General'}
          </Badge>
          {summary.read && (
            <Badge variant="secondary" className="bg-green-50 text-green-600 border-green-200">
              Read
            </Badge>
          )}
        </div>
        <CardTitle className="text-xl">{summary.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-gray-500 line-clamp-3">
          {summary.content.substring(0, 150)}...
        </p>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-between"
          onClick={() => onReadMore(summary.id)}
        >
          <span>Read More</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default Research;