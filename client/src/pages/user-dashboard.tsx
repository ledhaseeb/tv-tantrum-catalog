import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Trophy, Star, ThumbsUp, Calendar, Share2, Users, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

// Types for the dashboard
interface UserPoints {
  total: number;
  breakdown: {
    reviews: number;
    upvotesGiven: number;
    upvotesReceived: number;
    consecutiveLogins: number;
    shares: number;
    referrals: number;
    showSubmissions: number;
    researchRead: number;
  };
  nextMilestone: number;
}

interface PointHistoryItem {
  id: number;
  userId: number;
  action: string;
  points: number;
  createdAt: string;
  reference?: string;
  referenceType?: string;
}

interface TvShowRating {
  id: number;
  showId: number;
  userId: number;
  rating: number;
  comment: string;
  createdAt: string;
  tvShow: {
    id: number;
    title: string;
    imageUrl: string;
  };
}

interface FavoriteShow {
  id: number;
  userId: number;
  showId: number;
  createdAt: string;
  tvShow: {
    id: number;
    title: string;
    imageUrl: string;
  };
}

interface ResearchSummary {
  id: number;
  title: string;
  readAt: string;
}

interface LeaderboardUser {
  id: number;
  username: string;
  points: number;
  rank: number;
}

export default function UserDashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  
  // Fetch user points
  const { data: userPoints, isLoading: isPointsLoading } = useQuery<UserPoints>({
    queryKey: ['/api/user/points'],
    enabled: !!user,
  });
  
  // Fetch point history
  const { data: pointHistory, isLoading: isHistoryLoading } = useQuery<PointHistoryItem[]>({
    queryKey: ['/api/user/points/history'],
    enabled: !!user,
  });
  
  // Fetch user ratings
  const { data: userRatings, isLoading: isRatingsLoading } = useQuery<TvShowRating[]>({
    queryKey: ['/api/user/ratings'],
    enabled: !!user,
  });
  
  // Fetch user favorites
  const { data: userFavorites, isLoading: isFavoritesLoading } = useQuery<FavoriteShow[]>({
    queryKey: ['/api/user/favorites'],
    enabled: !!user,
  });
  
  // Fetch research summaries read
  const { data: researchRead, isLoading: isResearchLoading } = useQuery<ResearchSummary[]>({
    queryKey: ['/api/user/research'],
    enabled: !!user,
  });
  
  // Fetch leaderboard
  const { data: leaderboard, isLoading: isLeaderboardLoading } = useQuery<LeaderboardUser[]>({
    queryKey: ['/api/leaderboard'],
  });
  
  const isLoading = 
    isAuthLoading || 
    isPointsLoading || 
    isHistoryLoading || 
    isRatingsLoading || 
    isFavoritesLoading || 
    isResearchLoading || 
    isLeaderboardLoading;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="container py-12 mx-auto text-center">
        <h1 className="text-3xl font-bold mb-6">Access Denied</h1>
        <p className="mb-6">You need to be logged in to view your dashboard.</p>
        <Link href="/auth">
          <Button>Log In</Button>
        </Link>
      </div>
    );
  }
  
  const progressToNextMilestone = userPoints ? 
    Math.min(100, (userPoints.total / userPoints.nextMilestone) * 100) : 0;
  
  const currentRank = leaderboard?.find(u => u.id === parseInt(user.id))?.rank || 0;
  
  return (
    <div className="container py-8 mx-auto">
      <h1 className="text-3xl font-bold mb-2">My Dashboard</h1>
      <p className="text-muted-foreground mb-8">
        Track your activity and rewards
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
              Total Points
            </CardTitle>
            <CardDescription>Your contribution score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{userPoints?.total || 0}</div>
            <div className="mb-2 text-sm text-muted-foreground">
              Next milestone: {userPoints?.nextMilestone || 100} points
            </div>
            <Progress value={progressToNextMilestone} className="h-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Star className="mr-2 h-5 w-5 text-yellow-500" />
              My Activity
            </CardTitle>
            <CardDescription>Recent contributions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span>Reviews</span>
                <span className="font-semibold">{userRatings?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Upvotes Given</span>
                <span className="font-semibold">{userPoints?.breakdown.upvotesGiven || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Upvotes Received</span>
                <span className="font-semibold">{userPoints?.breakdown.upvotesReceived || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Research Summaries Read</span>
                <span className="font-semibold">{researchRead?.length || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5 text-blue-500" />
              Leaderboard Rank
            </CardTitle>
            <CardDescription>Your standing in the community</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">#{currentRank}</div>
            <div className="text-sm space-y-1">
              {leaderboard?.slice(0, 3).map((leader, index) => (
                <div key={leader.id} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Badge variant={index === 0 ? "default" : "outline"} className="mr-2">
                      #{leader.rank}
                    </Badge>
                    <span>{leader.username}</span>
                  </div>
                  <span className="font-semibold">{leader.points} pts</span>
                </div>
              ))}
              {currentRank > 3 && (
                <div className="text-center pt-2">
                  <Link href="/leaderboard">
                    <Button variant="link" size="sm" className="text-xs">
                      View Full Leaderboard
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="ratings" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="ratings" className="flex items-center">
            <Star className="mr-2 h-4 w-4" />
            My Ratings
          </TabsTrigger>
          <TabsTrigger value="favorites" className="flex items-center">
            <Film className="mr-2 h-4 w-4" />
            My Favorites
          </TabsTrigger>
          <TabsTrigger value="points" className="flex items-center">
            <Trophy className="mr-2 h-4 w-4" />
            Points History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="ratings">
          <Card>
            <CardHeader>
              <CardTitle>My Ratings</CardTitle>
              <CardDescription>
                Shows you've rated and reviewed
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userRatings && userRatings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userRatings.map(rating => (
                    <div key={rating.id} className="flex border rounded-lg overflow-hidden">
                      <div className="w-24 h-24 flex-shrink-0">
                        <img 
                          src={rating.tvShow.imageUrl} 
                          alt={rating.tvShow.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-3 flex-1">
                        <Link href={`/show/${rating.showId}`}>
                          <h4 className="font-semibold text-sm mb-1 hover:text-primary-500 line-clamp-1">
                            {rating.tvShow.title}
                          </h4>
                        </Link>
                        <div className="flex items-center mb-1">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star 
                                key={star} 
                                className={`h-3 w-3 ${star <= rating.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {rating.comment || "No comment added"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>You haven't rated any shows yet.</p>
                  <Link href="/browse">
                    <Button variant="link" className="mt-2">
                      Browse Shows to Rate
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="favorites">
          <Card>
            <CardHeader>
              <CardTitle>My Favorites</CardTitle>
              <CardDescription>
                Shows you've added to your favorites
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userFavorites && userFavorites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userFavorites.map(favorite => (
                    <div key={favorite.id} className="flex border rounded-lg overflow-hidden">
                      <div className="w-24 h-24 flex-shrink-0">
                        <img 
                          src={favorite.tvShow.imageUrl} 
                          alt={favorite.tvShow.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-3 flex-1">
                        <Link href={`/show/${favorite.showId}`}>
                          <h4 className="font-semibold text-sm mb-1 hover:text-primary-500 line-clamp-1">
                            {favorite.tvShow.title}
                          </h4>
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          Added {formatDistanceToNow(new Date(favorite.createdAt))} ago
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>You haven't favorited any shows yet.</p>
                  <Link href="/browse">
                    <Button variant="link" className="mt-2">
                      Browse Shows to Favorite
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="points">
          <Card>
            <CardHeader>
              <CardTitle>Points History</CardTitle>
              <CardDescription>
                Track how you've earned points on TV Tantrum
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pointHistory && pointHistory.length > 0 ? (
                <div className="space-y-4">
                  {pointHistory.map(item => (
                    <div key={item.id} className="flex justify-between items-center border-b pb-3">
                      <div className="flex-1">
                        <div className="font-medium">{item.action}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(item.createdAt))} ago
                          {item.referenceType && item.reference && (
                            <span> • {item.referenceType}: {item.reference}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-green-600">
                        +{item.points} points
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No point history available yet.</p>
                  <p className="text-sm mt-2">
                    Earn points by rating shows, receiving upvotes, and more!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}