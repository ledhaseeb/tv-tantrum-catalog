import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  User, Award, BookOpen, PlusCircle, Star, Heart, Clock, Users, Share2, Calendar, 
  TrendingUp, ThumbsUp, MessageSquare, Trophy
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface PointsHistory {
  id: number;
  userId: number;
  points: number;
  activityType: string;
  createdAt: string;
  description: string | null;
}

interface LeaderboardUser {
  id: number;
  username: string;
  totalPoints: number;
}

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const queryClient = useQueryClient();

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Fetch user points history
  const { data: pointsHistory = [] } = useQuery({
    queryKey: ['/api/user/points-history'],
    enabled: !!user
  });

  // Fetch user's read research summaries
  const { data: readResearch = [] } = useQuery({
    queryKey: ['/api/user/research/read'],
    enabled: !!user
  });

  // Fetch user's submitted shows
  const { data: submissions = [] } = useQuery({
    queryKey: ['/api/user/submissions'],
    enabled: !!user
  });

  // Fetch user's reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ['/api/user/reviews'],
    enabled: !!user
  });

  // Fetch user's favorites
  const { data: favorites = [] } = useQuery({
    queryKey: ['/api/user/favorites'],
    enabled: !!user
  });

  // Fetch leaderboard
  const { data: leaderboard = [] } = useQuery({
    queryKey: ['/api/leaderboard'],
    enabled: !!user
  });

  // Update profile bio mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (bio: string) => {
      return apiRequest('/api/user/profile', 'POST', { bio });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: 'Profile Updated',
        description: 'Your profile bio has been updated successfully!'
      });
    }
  });

  if (!user) {
    return null; // Redirecting to login
  }

  // Helper function to get badge color based on points
  const getBadgeLevel = (points: number) => {
    if (points >= 1000) return 'Platinum';
    if (points >= 500) return 'Gold';
    if (points >= 200) return 'Silver';
    if (points >= 50) return 'Bronze';
    return 'Beginner';
  };

  // Helper function to get next level threshold
  const getNextLevelThreshold = (points: number) => {
    if (points < 50) return 50;
    if (points < 200) return 200;
    if (points < 500) return 500;
    if (points < 1000) return 1000;
    return points + 500; // Just keep going
  };

  // Progress to next level
  const nextLevel = getNextLevelThreshold(user.totalPoints || 0);
  const currentLevelMin = points => {
    if (points >= 1000) return 1000;
    if (points >= 500) return 500;
    if (points >= 200) return 200;
    if (points >= 50) return 50;
    return 0;
  };
  const progressToNextLevel = ((user.totalPoints - currentLevelMin(user.totalPoints)) / 
                              (nextLevel - currentLevelMin(user.totalPoints))) * 100;

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get icon for activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'rating': return <MessageSquare className="w-4 h-4 mr-2" />;
      case 'upvote': return <ThumbsUp className="w-4 h-4 mr-2" />;
      case 'research': return <BookOpen className="w-4 h-4 mr-2" />;
      case 'login': return <Clock className="w-4 h-4 mr-2" />;
      case 'referral': return <Users className="w-4 h-4 mr-2" />;
      case 'share': return <Share2 className="w-4 h-4 mr-2" />;
      case 'favorite': return <Heart className="w-4 h-4 mr-2" />;
      case 'submission': return <PlusCircle className="w-4 h-4 mr-2" />;
      default: return <Award className="w-4 h-4 mr-2" />;
    }
  };

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="grid gap-8 md:grid-cols-[300px_1fr]">
        {/* Profile sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={`https://avatars.dicebear.com/api/initials/${user.username}.svg`} />
                  <AvatarFallback className="text-lg">{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-center text-xl">{user.username}</CardTitle>
              <div className="flex justify-center mt-2">
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  {getBadgeLevel(user.totalPoints || 0)} Level
                </Badge>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm text-muted-foreground mb-1">
                  <span>Progress to next level</span>
                  <span>{user.totalPoints || 0} / {nextLevel}</span>
                </div>
                <Progress value={progressToNextLevel} className="h-2" />
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-2xl font-bold">{user.totalPoints || 0}</p>
              <p className="text-sm text-muted-foreground">Total Points</p>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div>
                  <p className="text-lg font-medium">{reviews.length}</p>
                  <p className="text-xs text-muted-foreground">Reviews</p>
                </div>
                <div>
                  <p className="text-lg font-medium">{favorites.length}</p>
                  <p className="text-xs text-muted-foreground">Favorites</p>
                </div>
                <div>
                  <p className="text-lg font-medium">{readResearch.length}</p>
                  <p className="text-xs text-muted-foreground">Research</p>
                </div>
                <div>
                  <p className="text-lg font-medium">{submissions.length}</p>
                  <p className="text-xs text-muted-foreground">Submissions</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/profile/edit">
                  <User className="w-4 h-4 mr-2" />
                  Edit Profile
                </Link>
              </Button>
              {user.isAdmin && (
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/admin">
                    <Award className="w-4 h-4 mr-2" />
                    Admin Dashboard
                  </Link>
                </Button>
              )}
            </CardFooter>
          </Card>
          
          {/* Leaderboard card (for mobile screens) */}
          <Card className="md:hidden">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                Top Contributors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.slice(0, 5).map((leader: LeaderboardUser, index) => (
                  <div key={leader.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 
                        ${index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-300' : 
                          index === 2 ? 'bg-amber-700' : 'bg-gray-200'}`}>
                        <span className="text-xs font-bold text-white">{index + 1}</span>
                      </div>
                      <span className="font-medium">{leader.username}</span>
                    </div>
                    <span className="font-semibold">{leader.totalPoints} pts</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main content */}
        <div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview">
                <TrendingUp className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="activity">
                <Clock className="w-4 h-4 mr-2" />
                Activity
              </TabsTrigger>
              <TabsTrigger value="research">
                <BookOpen className="w-4 h-4 mr-2" />
                Research
              </TabsTrigger>
              <TabsTrigger value="shows">
                <Star className="w-4 h-4 mr-2" />
                My Shows
              </TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Calendar className="w-5 h-5 mr-2 inline" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pointsHistory.length === 0 ? (
                    <p className="text-muted-foreground text-center py-6">No recent activity found.</p>
                  ) : (
                    <div className="space-y-4">
                      {pointsHistory.slice(0, 5).map((activity: PointsHistory) => (
                        <div key={activity.id} className="flex items-start justify-between pb-4 border-b">
                          <div className="flex items-start">
                            <div className="bg-primary/10 p-2 rounded-full mr-3">
                              {getActivityIcon(activity.activityType)}
                            </div>
                            <div>
                              <p className="font-medium">{activity.description || activity.activityType}</p>
                              <p className="text-sm text-muted-foreground">{formatDate(activity.createdAt)}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className={activity.points > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}>
                            {activity.points > 0 ? '+' : ''}{activity.points} pts
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab('activity')}>
                    View All Activity
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Quick Stats */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-base flex items-center">
                      <Star className="w-4 h-4 mr-2 text-primary" />
                      Reviews
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-2xl font-bold">{reviews.length}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-base flex items-center">
                      <Heart className="w-4 h-4 mr-2 text-red-500" />
                      Favorites
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-2xl font-bold">{favorites.length}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-base flex items-center">
                      <BookOpen className="w-4 h-4 mr-2 text-blue-500" />
                      Research Read
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-2xl font-bold">{readResearch.length}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-base flex items-center">
                      <PlusCircle className="w-4 h-4 mr-2 text-green-500" />
                      Show Submissions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-2xl font-bold">{submissions.length}</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Activity Tab */}
            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Points History</CardTitle>
                  <CardDescription>
                    View all your earned points and activities.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pointsHistory.length === 0 ? (
                    <p className="text-muted-foreground text-center py-6">No activity history found.</p>
                  ) : (
                    <div className="space-y-4">
                      {pointsHistory.map((activity: PointsHistory) => (
                        <div key={activity.id} className="flex items-start justify-between pb-4 border-b">
                          <div className="flex items-start">
                            <div className="bg-primary/10 p-2 rounded-full mr-3">
                              {getActivityIcon(activity.activityType)}
                            </div>
                            <div>
                              <p className="font-medium">{activity.description || activity.activityType}</p>
                              <p className="text-sm text-muted-foreground">{formatDate(activity.createdAt)}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className={activity.points > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}>
                            {activity.points > 0 ? '+' : ''}{activity.points} pts
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Research Tab */}
            <TabsContent value="research">
              <Card>
                <CardHeader>
                  <CardTitle>Research Summaries</CardTitle>
                  <CardDescription>
                    Track the research summaries you've read.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {readResearch.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                      <p className="mt-4 text-muted-foreground">You haven't read any research summaries yet.</p>
                      <Button variant="outline" className="mt-4" asChild>
                        <Link href="/research">
                          Explore Research
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {readResearch.map((item: any) => (
                        <div key={item.id} className="flex items-start justify-between p-4 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{item.title}</h4>
                            <p className="text-sm text-muted-foreground">Read on {formatDate(item.readAt)}</p>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/research/${item.id}`}>
                              Read Again
                            </Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* My Shows Tab */}
            <TabsContent value="shows" className="space-y-6">
              {/* Favorites */}
              <Card>
                <CardHeader>
                  <CardTitle>My Favorites</CardTitle>
                  <CardDescription>Shows you've added to your favorites.</CardDescription>
                </CardHeader>
                <CardContent>
                  {favorites.length === 0 ? (
                    <div className="text-center py-8">
                      <Heart className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                      <p className="mt-4 text-muted-foreground">You haven't added any favorites yet.</p>
                      <Button variant="outline" className="mt-4" asChild>
                        <Link href="/browse">
                          Browse Shows
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                      {favorites.map((show: any) => (
                        <Link key={show.id} href={`/show/${show.id}`}>
                          <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                            <div className="aspect-video relative">
                              <img 
                                src={show.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'} 
                                alt={show.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="p-3">
                              <h4 className="font-medium truncate">{show.name}</h4>
                              <p className="text-sm text-muted-foreground">{show.ageRange}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* My Reviews */}
              <Card>
                <CardHeader>
                  <CardTitle>My Reviews</CardTitle>
                  <CardDescription>Reviews you've written for shows.</CardDescription>
                </CardHeader>
                <CardContent>
                  {reviews.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                      <p className="mt-4 text-muted-foreground">You haven't written any reviews yet.</p>
                      <Button variant="outline" className="mt-4" asChild>
                        <Link href="/browse">
                          Find Shows to Review
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review: any) => (
                        <div key={review.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <Link href={`/show/${review.tvShowId}`}>
                              <h4 className="font-medium text-primary hover:underline">{review.showName}</h4>
                            </Link>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-700">{review.review}</p>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</span>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <ThumbsUp className="h-3 w-3 mr-1" />
                              <span>{review.upvotes}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* My Submissions */}
              <Card>
                <CardHeader>
                  <CardTitle>My Show Submissions</CardTitle>
                  <CardDescription>Shows you've requested to be added to our database.</CardDescription>
                </CardHeader>
                <CardContent>
                  {submissions.length === 0 ? (
                    <div className="text-center py-8">
                      <PlusCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                      <p className="mt-4 text-muted-foreground">You haven't submitted any show requests yet.</p>
                      <Button variant="outline" className="mt-4" asChild>
                        <Link href="/submit-show">
                          Submit a Show
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {submissions.map((submission: any) => (
                        <div key={submission.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{submission.showName}</h4>
                              <p className="text-sm text-muted-foreground">{submission.platform || 'Platform not specified'}</p>
                            </div>
                            <Badge variant={
                              submission.status === 'approved' ? 'outline' : 
                              submission.status === 'pending' ? 'secondary' : 'destructive'
                            }>
                              {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 mt-2 line-clamp-2">{submission.description}</p>
                          <p className="text-xs text-muted-foreground mt-2">Submitted on {formatDate(submission.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/submit-show">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Submit a New Show
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Leaderboard (desktop/tablet only) */}
        <div className="hidden md:block md:col-span-2 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                Top Contributors
              </CardTitle>
              <CardDescription>
                Users with the most points
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard.slice(0, 10).map((leader: LeaderboardUser, index) => (
                  <div key={leader.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 
                        ${index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-300' : 
                          index === 2 ? 'bg-amber-700' : 'bg-gray-200'}`}>
                        <span className="text-xs font-bold text-white">{index + 1}</span>
                      </div>
                      <span className="font-medium">{leader.username}</span>
                    </div>
                    <span className="font-semibold">{leader.totalPoints} pts</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}