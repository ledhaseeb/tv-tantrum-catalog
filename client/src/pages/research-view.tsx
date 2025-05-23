import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, BookOpen, Calendar, FileText, Award } from 'lucide-react';

const ResearchView = () => {
  const { id } = useParams();
  const [research, setResearch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchResearch() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/research/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch research');
        }
        
        const data = await response.json();
        setResearch(data);
      } catch (error) {
        console.error('Error fetching research:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchResearch();
  }, [id]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(date);
  };

  // Format category name for display
  const formatCategoryName = (category) => {
    if (!category) return 'General';
    return category.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-[150px]" />
          </div>
          <Skeleton className="h-10 w-[300px]" />
          <div className="flex gap-2 my-4">
            <Skeleton className="h-6 w-[100px]" />
            <Skeleton className="h-6 w-[100px]" />
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle>Error Loading Research</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error}</p>
            <Button asChild>
              <Link href="/research">Back to Research</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!research) {
    return (
      <div className="container py-8">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle>Research Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">The research summary you're looking for doesn't exist or has been removed.</p>
            <Button asChild>
              <Link href="/research">Browse All Research</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/research">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Research
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <div className="mb-6">
            {research.category && (
              <Badge variant="outline" className="mb-2">
                {formatCategoryName(research.category)}
              </Badge>
            )}
            <h1 className="text-3xl font-bold mb-3">{research.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
              {research.publishedDate && (
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{formatDate(research.publishedDate)}</span>
                </div>
              )}
              {research.source && (
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  <span>{research.source}</span>
                </div>
              )}
            </div>

            <Badge variant="outline" className="bg-blue-50 text-blue-500 border-blue-200">
              <Award className="w-3 h-3 mr-1" /> Reading research earns points
            </Badge>
          </div>

          {research.imageUrl && (
            <div className="mb-6 rounded-lg overflow-hidden">
              <img
                src={research.imageUrl}
                alt={research.title}
                className="w-full h-auto"
              />
            </div>
          )}

          <div className="prose prose-p:text-base prose-headings:font-semibold max-w-none">
            {/* Display summary first */}
            <div className="bg-gray-50 p-6 rounded-lg mb-8 border border-gray-100">
              <h3 className="text-xl font-semibold mb-4">Summary</h3>
              <p>{research.summary}</p>
            </div>

            {/* Display full text if available */}
            {research.fullText && (
              <div className="space-y-6">
                {research.fullText.split('\n\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="sticky top-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About This Research</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {research.source && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Source</h4>
                    <p className="text-sm text-gray-600">{research.source}</p>
                  </div>
                )}
                
                {research.publishedDate && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Published</h4>
                    <p className="text-sm text-gray-600">{formatDate(research.publishedDate)}</p>
                  </div>
                )}

                {research.category && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Category</h4>
                    <p className="text-sm text-gray-600">{formatCategoryName(research.category)}</p>
                  </div>
                )}

                <Separator />

                <div className="pt-2">
                  <div className="p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
                    <div className="flex items-center font-medium">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Sign in to track your reading
                    </div>
                    <p className="text-blue-600 text-xs mt-1">Earn 5 points for each research summary you read</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearchView;