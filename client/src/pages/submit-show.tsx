import { useQuery } from '@tanstack/react-query';
import { ShowSubmissionForm } from '@/components/ShowSubmissionForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, Users } from 'lucide-react';
import { format } from 'date-fns';

interface ShowSubmission {
  id: number;
  show_name: string;
  where_they_watch: string;
  status: 'pending' | 'approved' | 'rejected';
  request_count: number;
  created_at: string;
}

export default function SubmitShowPage() {
  const { data: submissions = [], isLoading, error } = useQuery<ShowSubmission[]>({
    queryKey: ['/api/show-submissions/my'],
    queryFn: async () => {
      const res = await fetch('/api/show-submissions/my');
      if (!res.ok) {
        throw new Error('Failed to fetch submissions');
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Suggest a Show
        </h1>
        <p className="text-lg text-gray-600">
          Help us build the world's best database of children's shows
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Submission Form */}
        <div>
          <ShowSubmissionForm />
        </div>

        {/* User's Previous Submissions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Your Submissions</CardTitle>
              <CardDescription>
                Track the status of your show suggestions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>You haven't submitted any shows yet.</p>
                  <p className="text-sm">Submit your first show to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {submission.show_name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {submission.where_they_watch}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Submitted {format(new Date(submission.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(submission.status)}
                            <Badge className={getStatusColor(submission.status)}>
                              {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                            </Badge>
                          </div>
                          {submission.request_count > 1 && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Users className="h-3 w-3" />
                              {submission.request_count} requests
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Information Section */}
      <div className="mt-12 grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-lg">Earn Points</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600">
              Get 20 points when your suggested show is approved and added to our database.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-lg">Smart Detection</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600">
              If someone already suggested the same show, we'll increase its priority instead of creating duplicates.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <CardTitle className="text-lg">Admin Review</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600">
              Our team reviews all submissions to ensure quality and accuracy before adding them to the database.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}