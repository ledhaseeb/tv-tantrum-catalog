import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { Award, StarIcon, Trophy, Timer, LineChart, Flame, Users, Calendar, Send, Share } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const UserDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ['/api/user/dashboard'],
    enabled: !!user,
  });
  
  // Extract data from dashboard response
  const userRank = dashboardData?.rank || "TV Watcher";
  const totalPoints = dashboardData?.points || 0;
  const pointsBreakdown = dashboardData?.pointsBreakdown || {};
  const recommendations = dashboardData?.recommendedShows || [];
  const loginStreak = dashboardData?.streak || 0;

  if (!user) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Please Log In</h2>
          <p className="text-gray-500">You need to be logged in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  if (isLoadingDashboard) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="space-y-4">
          <Skeleton className="h-12 w-[250px]" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  const {
    user: userData,
    favorites,
    reviews
  } = dashboardData || {
    user: {},
    favorites: [],
    reviews: []
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex flex-col md:flex-row gap-6 md:items-center mb-8">
        <Avatar className="w-20 h-20">
          <AvatarImage src={user?.profileImageUrl} alt={user?.username} />
          <AvatarFallback className="text-2xl">
            {user?.username?.slice(0, 1).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold">{user?.username || "User"}'s Dashboard</h1>
          <p className="text-gray-500">{user?.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="bg-orange-50 text-orange-500 border-orange-200">
              <Trophy className="w-3 h-3 mr-1" /> {userRank}
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-500 border-blue-200">
              <Award className="w-3 h-3 mr-1" /> {totalPoints} Points
            </Badge>
          </div>
        </div>
      </div>

      {/* Progress to next milestone */}
      <Card className="mb-8">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Progress to Next Milestone</CardTitle>
          <CardDescription>
            {totalPoints} / {nextMilestone} points
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-2" />
          <div className="mt-2 text-sm text-gray-500">
            Earn {nextMilestone - totalPoints} more points to reach the next milestone!
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="content">Your Content</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reviews?.length || 0}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {pointsBreakdown.reviews} Points Earned
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Upvotes Received</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {pointsHistory?.filter((ph: any) => ph.activityType === 'upvote_received').length || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {pointsBreakdown.upvotesReceived} Points Earned
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Research Read</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{readResearch?.length || 0}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {pointsBreakdown.researchRead} Points Earned
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Points Breakdown</CardTitle>
              <CardDescription>How you've earned your points</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <StarIcon className="w-4 h-4 mr-2 text-yellow-500" />
                    <span>Reviews</span>
                  </div>
                  <span className="font-medium">{pointsBreakdown.reviews} points</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Award className="w-4 h-4 mr-2 text-purple-500" />
                    <span>Upvotes Received</span>
                  </div>
                  <span className="font-medium">{pointsBreakdown.upvotesReceived} points</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <LineChart className="w-4 h-4 mr-2 text-blue-500" />
                    <span>Upvotes Given</span>
                  </div>
                  <span className="font-medium">{pointsBreakdown.upvotesGiven} points</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-green-500" />
                    <span>Login Streaks</span>
                  </div>
                  <span className="font-medium">{pointsBreakdown.consecutiveLogins} points</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Send className="w-4 h-4 mr-2 text-indigo-500" />
                    <span>Shares</span>
                  </div>
                  <span className="font-medium">{pointsBreakdown.shares} points</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <UserPlus className="w-4 h-4 mr-2 text-pink-500" />
                    <span>Referrals</span>
                  </div>
                  <span className="font-medium">{pointsBreakdown.referrals} points</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FilePlus2 className="w-4 h-4 mr-2 text-orange-500" />
                    <span>Show Submissions</span>
                  </div>
                  <span className="font-medium">{pointsBreakdown.showSubmissions} points</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-2 text-teal-500" />
                    <span>Research Read</span>
                  </div>
                  <span className="font-medium">{pointsBreakdown.researchRead} points</span>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between font-bold">
                  <span>Total Points</span>
                  <span>{totalPoints} points</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest actions on TV Tantrum</CardDescription>
            </CardHeader>
            <CardContent>
              {pointsHistory?.length > 0 ? (
                <div className="space-y-4">
                  {pointsHistory.slice(0, 10).map((activity: any) => (
                    <div key={activity.id} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0">
                      <div className="bg-gray-100 p-2 rounded-full">
                        {activity.activityType === 'review' && <StarIcon className="w-4 h-4 text-yellow-500" />}
                        {activity.activityType === 'upvote_given' && <LineChart className="w-4 h-4 text-blue-500" />}
                        {activity.activityType === 'upvote_received' && <Award className="w-4 h-4 text-purple-500" />}
                        {activity.activityType === 'login_streak' && <CalendarIcon className="w-4 h-4 text-green-500" />}
                        {activity.activityType === 'share' && <Send className="w-4 h-4 text-indigo-500" />}
                        {activity.activityType === 'referral' && <UserPlus className="w-4 h-4 text-pink-500" />}
                        {activity.activityType === 'show_submission' && <FilePlus2 className="w-4 h-4 text-orange-500" />}
                        {activity.activityType === 'research_read' && <BookOpen className="w-4 h-4 text-teal-500" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-medium">
                            {activity.description || formatActivityType(activity.activityType)}
                          </p>
                          <Badge variant="outline">+{activity.points} points</Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p>No activity yet. Start interacting with TV Tantrum to earn points!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Reviews</CardTitle>
              <CardDescription>Reviews you've written for TV shows</CardDescription>
            </CardHeader>
            <CardContent>
              {reviews?.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review: any) => (
                    <div key={review.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{review.tvShowName || "TV Show"}</h3>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{review.review}</p>
                      <div className="mt-2 text-xs text-gray-500">
                        {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p>You haven't written any reviews yet.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Favorites</CardTitle>
              <CardDescription>TV shows you've added to your favorites</CardDescription>
            </CardHeader>
            <CardContent>
              {favorites?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {favorites.map((show: any) => (
                    <div
                      key={show.id}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="w-12 h-12 rounded-md overflow-hidden">
                        <img
                          src={show.imageUrl || "https://placehold.co/100x100?text=TV"}
                          alt={show.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-medium line-clamp-1">{show.name}</h3>
                        <p className="text-xs text-gray-500">
                          {show.releaseYear}
                          {show.endYear && show.endYear !== show.releaseYear
                            ? ` - ${show.endYear}`
                            : show.isOngoing
                            ? " - Present"
                            : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p>You haven't added any favorites yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper function to format activity types for display
function formatActivityType(type: string): string {
  const formats: Record<string, string> = {
    review: "Added a review",
    upvote_given: "Upvoted a review",
    upvote_received: "Received an upvote",
    login_streak: "Login streak bonus",
    share: "Shared content",
    referral: "Referred a new user",
    show_submission: "Submitted a new show",
    research_read: "Read research content"
  };
  
  return formats[type] || type.replace(/_/g, " ");
}

export default UserDashboard;