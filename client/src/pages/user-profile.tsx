import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Calendar, Trophy, Book } from 'lucide-react';
import { getCurrentBadge } from '@/lib/badges';

function formatActivityType(type: string): string {
  switch (type) {
    case 'review':
      return 'Review';
    case 'login_reward':
      return 'Login Reward';
    case 'upvote_given':
      return 'Upvote Given';
    case 'upvote_received':
      return 'Upvote Received';
    case 'share':
      return 'Share';
    case 'referral':
      return 'Referral';
    case 'show_submission':
      return 'Show Submission';
    case 'research_read':
      return 'Research Read';
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
}

export default function UserProfile() {
  const { userId } = useParams();

  const { data: profileData, isLoading } = useQuery({
    queryKey: [`/api/user/profile/${userId}`],
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Loading user profile...</h2>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">User not found</h2>
          <p className="text-muted-foreground">This user profile doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const user = profileData.user || {};
  const totalPoints = Number(profileData.points) || 0;
  const reviews = Array.isArray(profileData.reviews) ? profileData.reviews : [];
  const favorites = Array.isArray(profileData.favorites) ? profileData.favorites : [];
  const recentActivity = Array.isArray(profileData.pointsHistory) ? profileData.pointsHistory : [];

  // Get current badge based on points
  const currentBadge = getCurrentBadge(totalPoints);

  // Get user's background color preference and convert to hex
  const getHexColor = (color: string) => {
    const colorMap: { [key: string]: string } = {
      'bg-red-500': '#ef4444',
      'bg-orange-500': '#f97316',
      'bg-yellow-500': '#eab308',
      'bg-green-500': '#22c55e',
      'bg-blue-500': '#3b82f6',
      'bg-purple-500': '#a855f7',
      'bg-pink-500': '#ec4899',
      'bg-indigo-500': '#6366f1',
      'bg-cyan-500': '#06b6d4',
      'bg-teal-500': '#14b8a6',
      'bg-lime-500': '#84cc16',
      'bg-amber-500': '#f59e0b'
    };
    return colorMap[color] || color || '#a855f7';
  };
  
  const userBackgroundColor = getHexColor(user?.background_color || user?.backgroundColor || 'bg-purple-500');

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-4 mb-4">
          {/* User Badge */}
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl"
            style={{ backgroundColor: userBackgroundColor }}
          >
            {currentBadge.emoji}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{String(user.username || 'Unknown User')}'s Profile</h1>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-4">
          <Badge variant="secondary" className="text-sm">
            {currentBadge.emoji} {currentBadge.name}
          </Badge>
          <Badge variant="outline" className="text-sm">
            <Trophy className="w-4 h-4 mr-1" />
            {totalPoints || 0} Points
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reviews Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Recent Reviews ({reviews.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reviews.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No reviews yet</p>
            ) : (
              <div className="space-y-4">
                {reviews.slice(0, 5).map((review: any) => (
                  <div key={review.id} className="border-b border-gray-200 last:border-b-0 pb-3 last:pb-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{review.showName || 'Unknown Show'}</h4>
                        <div className="flex items-center gap-1 my-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        {review.review && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{review.review}</p>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground ml-2">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
                {reviews.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center">
                    And {reviews.length - 5} more reviews...
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Favorites Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="w-5 h-5" />
              Favorite Shows ({favorites.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {favorites.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No favorites yet</p>
            ) : (
              <div className="space-y-2">
                {favorites.slice(0, 8).map((show: any) => (
                  <div key={show.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                    <img
                      src={show.imageUrl}
                      alt={show.name}
                      className="w-10 h-10 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{show.name}</h4>
                      <p className="text-xs text-muted-foreground">{show.ageRange}</p>
                    </div>
                  </div>
                ))}
                {favorites.length > 8 && (
                  <p className="text-sm text-muted-foreground text-center">
                    And {favorites.length - 8} more favorites...
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Section */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.slice(0, 10).map((activity: any, index: number) => (
                  <div key={`${activity.id}-${index}`} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        {activity.activityType === 'review' && <Star className="w-4 h-4 text-blue-600" />}
                        {activity.activityType === 'login_reward' && <Calendar className="w-4 h-4 text-green-600" />}
                        {activity.activityType === 'research_read' && <Book className="w-4 h-4 text-purple-600" />}
                        {!['review', 'login_reward', 'research_read'].includes(activity.activityType) && 
                          <Trophy className="w-4 h-4 text-orange-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{formatActivityType(activity.activityType)}</p>
                        <p className="text-xs text-muted-foreground">{activity.description || ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">+{activity.points}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.createdAt ? new Date(activity.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}