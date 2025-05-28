import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'wouter';
import { BookOpen, BookText, ArrowRight, Lock } from 'lucide-react';

const Research = () => {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  // Using Link component for navigation instead of useLocation

  const { data: summaries, isLoading: isLoadingSummaries } = useQuery({
    queryKey: ['/api/research'],
    enabled: !!user,
  });

  // Define categories based on actual database categories
  const categories = [
    { id: 'all', name: 'All Research' },
    { id: 'Child Psychology', name: 'Child Psychology' },
    { id: 'Cognitive Development', name: 'Cognitive Development' },
    { id: 'Learning Outcomes', name: 'Learning Outcomes' },
    { id: 'Media Effects', name: 'Media Effects' },
    { id: 'Parental Guidance', name: 'Parental Guidance' },
    { id: 'Social Development', name: 'Social Development' },
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
  const categorizedSummaries = summaries && Array.isArray(summaries) ? summaries.reduce((acc: Record<string, any[]>, summary: any) => {
    const categoryId = summary.category || 'uncategorized';
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(summary);
    return acc;
  }, {} as Record<string, any[]>) : {};

  // Count items per category
  const categoryCounts: Record<string, number> = {};
  if (summaries && Array.isArray(summaries)) {
    categories.forEach(category => {
      if (category.id === 'all') {
        categoryCounts[category.id] = summaries.length;
      } else {
        categoryCounts[category.id] = categorizedSummaries[category.id]?.length || 0;
      }
    });
  }

  // Get all unique categories from the data
  const dataCategories = new Set(
    summaries && Array.isArray(summaries) 
      ? summaries.map((summary: any) => summary.category || 'uncategorized')
      : []
  );

  // Filter summaries based on active category
  const filteredSummaries = activeCategory === 'all'
    ? (summaries || [])
    : (categorizedSummaries[activeCategory] || []);

  const handleReadMore = (summaryId: number) => {
    // Use window.location instead of navigate for consistent navigation approach
    window.location.href = `/research/${summaryId}`;
  };

  return (
    <div className="container max-w-[1100px] py-8 px-6 md:px-8">
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

      {/* Mobile: Dropdown selector */}
      <div className="block md:hidden mb-8">
        <Select value={activeCategory} onValueChange={setActiveCategory}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a category">
              {categories.find(cat => cat.id === activeCategory)?.name}
              {categoryCounts && categoryCounts[activeCategory] > 0 && (
                <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full">
                  {categoryCounts[activeCategory]}
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center justify-between w-full">
                  <span>{category.name}</span>
                  {categoryCounts && categoryCounts[category.id] > 0 && (
                    <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full">
                      {categoryCounts[category.id]}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: Tab interface */}
      <Tabs 
        defaultValue="all" 
        value={activeCategory} 
        onValueChange={setActiveCategory} 
        className="hidden md:block mb-14"
      >
        <TabsList className="flex flex-wrap mb-10 px-1 justify-center gap-2">
          {categories.map((category) => (
            <TabsTrigger 
              key={category.id}
              value={category.id}
              className={`flex flex-col items-center py-2 px-3 ${category.id === 'all' ? 'min-w-[100px]' : 'min-w-[150px]'} h-auto`}
            >
              <span className="text-center">
                {category.id === 'all' ? category.name : 
                  category.name.split(' and ').map((part, i) => (
                    <span key={i} className="block">
                      {part}{i < category.name.split(' and ').length - 1 && ' &'}
                    </span>
                  ))
                }
              </span>
              {categoryCounts && categoryCounts[category.id] > 0 && 
                <span className="mt-1 text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full">
                  {categoryCounts[category.id]}
                </span>
              }
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Content display for both mobile and desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeCategory === 'all'
          ? (summaries && Array.isArray(summaries) ? summaries.map((summary: any) => (
              <ResearchCard key={summary.id} summary={summary} onReadMore={handleReadMore} />
            )) : null)
          : (categorizedSummaries[activeCategory] && Array.isArray(categorizedSummaries[activeCategory]) 
              ? categorizedSummaries[activeCategory].map((summary: any) => (
                  <ResearchCard key={summary.id} summary={summary} onReadMore={handleReadMore} />
                ))
              : (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <BookText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No research summaries found in this category</p>
                </div>
              )
            )}
      </div>
    </div>
  );
};

interface ResearchCardProps {
  summary: any;
  onReadMore: (id: number) => void;
}

const ResearchCard = ({ summary, onReadMore }: ResearchCardProps) => {
  // Format category name for display
  const formatCategoryName = (category: string) => {
    if (!category) return 'General';
    return category.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(date);
  };

  return (
    <Card className="h-full flex flex-col">
      {summary.imageUrl && (
        <div className="relative w-full h-48 overflow-hidden">
          <img 
            src={summary.imageUrl} 
            alt={summary.title}
            className="w-full h-full object-contain bg-gray-50 transition-transform hover:scale-105"
          />
        </div>
      )}
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <Badge variant="outline" className="mb-2">
            {formatCategoryName(summary.category)}
          </Badge>
          {summary.hasRead && (
            <Badge variant="secondary" className="bg-green-50 text-green-600 border-green-200">
              Read
            </Badge>
          )}
        </div>
        <CardTitle className="text-xl">{summary.title}</CardTitle>
        {summary.publishedDate && (
          <CardDescription className="mt-1 text-sm text-gray-500">
            {formatDate(summary.publishedDate)}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-gray-500 line-clamp-3">
          {summary.summary}
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