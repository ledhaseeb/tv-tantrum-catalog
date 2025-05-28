import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Plus, Send } from 'lucide-react';

interface ShowSubmissionFormProps {
  onSuccess?: () => void;
}

export function ShowSubmissionForm({ onSuccess }: ShowSubmissionFormProps) {
  const [showName, setShowName] = useState('');
  const [whereTheyWatch, setWhereTheyWatch] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async (data: { showName: string; whereTheyWatch: string }) => {
      const response = await fetch('/api/show-submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit show');
      }
      
      return await response.json();
    },
    onSuccess: (response) => {
      // Use setTimeout to avoid React's setState warning during render
      setTimeout(() => {
        // Check if this was a new submission or a duplicate
        const isNewSubmission = response.isNewSubmission !== false;
        
        if (isNewSubmission) {
          toast({
            title: "Show submitted successfully!",
            description: "Thank you for your suggestion. We'll review it soon.",
          });
        } else {
          toast({
            title: "Already requested!",
            description: "This show has been suggested before. We've noted your interest.",
          });
        }

        // Reset form
        setShowName('');
        setWhereTheyWatch('');
        
        // Invalidate user submissions query to refresh any lists
        queryClient.invalidateQueries({ queryKey: ['/api/show-submissions/my'] });
        
        onSuccess?.();
      }, 0);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: error.message || "Something went wrong. Please try again.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!showName.trim() || !whereTheyWatch.trim()) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in both fields.",
      });
      return;
    }

    submitMutation.mutate({
      showName: showName.trim(),
      whereTheyWatch: whereTheyWatch.trim(),
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-blue-600" />
          Suggest a Show
        </CardTitle>
        <CardDescription>
          Help us grow our database by suggesting shows you love!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="showName">Show Name</Label>
            <Input
              id="showName"
              type="text"
              placeholder="e.g., Bluey, Peppa Pig, etc."
              value={showName}
              onChange={(e) => setShowName(e.target.value)}
              disabled={submitMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whereTheyWatch">Where do you watch it?</Label>
            <Textarea
              id="whereTheyWatch"
              placeholder="e.g., Netflix in Australia, Disney+ UK, PBS Kids America, YouTube, etc."
              value={whereTheyWatch}
              onChange={(e) => setWhereTheyWatch(e.target.value)}
              disabled={submitMutation.isPending}
              rows={3}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Show
              </>
            )}
          </Button>
        </form>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Earn 20 points</strong> when your suggested show gets added to our database!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}