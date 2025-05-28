import React, { useState, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { Award, Star as StarIcon, Trophy, Timer, LineChart, Flame, Users, Calendar as CalendarIcon, Send, Share, UserPlus, FilePlus2, BookOpen, Heart, X, Camera, Upload } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ShowCard from '@/components/ShowCard';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

const UserDashboard = () => {
  const { user, toggleFavorite } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Profile image upload mutation
  const uploadProfileImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('profileImage', file);
      
      const response = await fetch('/api/user/profile-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload profile image');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Profile image updated!",
        description: "Your profile picture has been successfully updated.",
      });
      // Invalidate user queries to refresh the profile image
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/dashboard'] });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: "Failed to upload profile image. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      setIsUploadingImage(true);
      uploadProfileImageMutation.mutate(file);
      setIsUploadingImage(false);
    }
  };

  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ['/api/user/dashboard'],
    enabled: !!user,
  });
  
  // Extract data from dashboard response
  const userRank = dashboardData?.rank || "TV Watcher";
  const totalPoints = dashboardData?.points || 0;
  const pointsBreakdown = dashboardData?.pointsBreakdown || {};
  const pointsHistory = dashboardData?.pointsHistory || [];
  const recommendations = dashboardData?.recommendedShows || [];
  // Removed login streak since we're using login rewards instead
  const readResearch = dashboardData?.readResearch || [];
  const topUsers = dashboardData?.topUsers || [];
  const recentActivity = dashboardData?.recentActivity || [];
  
  // Calculate next milestone and progress
  const nextMilestone = Math.ceil(totalPoints / 100) * 100 + 100;
  const progress = (totalPoints % 100) / 100 * 100;

  if (isLoadingDashboard) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Please wait while your dashboard loads</h2>
          <p className="text-gray-500">We're gathering your latest activity and points...</p>
        </div>
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
        <div className="relative group">
          <Avatar className="w-20 h-20">
            <AvatarImage src={user?.profileImageUrl} alt={user?.username} />
            <AvatarFallback className="text-2xl">
              {user?.username?.slice(0, 1).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          
          {/* Profile Image Upload Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:text-white hover:bg-transparent p-1"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage || uploadProfileImageMutation.isPending}
            >
              {isUploadingImage || uploadProfileImageMutation.isPending ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Camera className="w-5 h-5" />
              )}
            </Button>
          </div>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
        
        <div className="flex-1">
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
          
          {/* Upload Profile Image Button - Mobile */}
          <div className="md:hidden mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage || uploadProfileImageMutation.isPending}
              className="w-full"
            >
              {isUploadingImage || uploadProfileImageMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Profile Picture
                </>
              )}
            </Button>
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

                {/* Removed login streaks since we're using login rewards instead */}

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Timer className="w-4 h-4 mr-2 text-cyan-500" />
                    <span>Login Rewards</span>
                  </div>
                  <span className="font-medium">{pointsBreakdown.loginRewards || 0} points</span>
                </div>

                {/* Shares section removed - points only awarded for successful referrals */}

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
              {(reviews?.length > 0 || pointsHistory?.length > 0) ? (
                <div className="space-y-4">
                  {/* Create a combined array of all activities */}
                  {(() => {
                    // Convert reviews to a standard format matching activities
                    const reviewActivities = reviews.map((review: any) => ({
                      id: `review-${review.id}`,
                      type: 'review',
                      review,
                      description: `Review of ${review.showName || review.tvShowName || "TV Show"}`,
                      points: 10,
                      createdAt: new Date(review.createdAt),
                      activityType: 'review'
                    }));
                    
                    // Convert points history records
                    const otherActivities = pointsHistory
                      .filter((activity: any) => activity.activityType !== 'review') // Skip reviews as we handle them above
                      .map((activity: any) => ({
                        id: `activity-${activity.id}`,
                        type: 'pointsHistory',
                        activity,
                        description: activity.description || formatActivityType(activity.activityType),
                        points: activity.points,
                        createdAt: new Date(activity.createdAt),
                        activityType: activity.activityType
                      }));
                    
                    // Combine and sort all activities by date (newest first)
                    const allActivities = [...reviewActivities, ...otherActivities]
                      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                    
                    // Return the sorted activities as JSX
                    return allActivities.map((item) => (
                      <div key={item.id} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0">
                        <div className="bg-gray-100 p-2 rounded-full">
                          {item.activityType === 'review' && <StarIcon className="w-4 h-4 text-yellow-500" />}
                          {item.activityType === 'upvote_given' && <LineChart className="w-4 h-4 text-blue-500" />}
                          {item.activityType === 'upvote_received' && <Award className="w-4 h-4 text-purple-500" />}
                          {item.activityType === 'login_streak' && <CalendarIcon className="w-4 h-4 text-green-500" />}
                          {item.activityType === 'login_reward' && <Timer className="w-4 h-4 text-cyan-500" />}
                          {/* Show icon for historical share activities, though they no longer earn points */}
                          {item.activityType === 'share' && <Send className="w-4 h-4 text-gray-400" />}
                          {item.activityType === 'referral' && <UserPlus className="w-4 h-4 text-pink-500" />}
                          {item.activityType === 'show_submission' && <FilePlus2 className="w-4 h-4 text-orange-500" />}
                          {item.activityType === 'research_read' && <BookOpen className="w-4 h-4 text-teal-500" />}
                          {item.activityType === 'favorite_added' && <Heart className="w-4 h-4 text-red-500" />}
                          {item.activityType === 'points_deducted' && <X className="w-4 h-4 text-red-500" />}
                          {/* Check description for favorite activities */}
                          {item.description && item.description.includes('to favorites') && <Heart className="w-4 h-4 text-red-500" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <p className="font-medium">
                              {item.description}
                            </p>
                            <Badge variant="outline">{item.points > 0 ? `+${item.points}` : item.points} points</Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ));
                  })()}
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
                        <h3 className="font-medium">{review.showName || review.tvShowName || "TV Show"}</h3>
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {favorites.map((show: any) => (
                    <div key={show.id} className="rounded-lg">
                      <ShowCard 
                        show={show} 
                        viewMode="grid" 
                        onClick={() => {
                          // Navigate to show details
                          window.location.href = `/show/${show.id}`;
                        }}
                        isMobile={true}
                      />
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