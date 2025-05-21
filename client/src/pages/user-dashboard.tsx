import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Award, BookOpen, Check, PlusCircle, Star, ThumbsUp, Trophy, UserRound } from "lucide-react";

const UserDashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch user points
  const { data: userPoints, isLoading: isLoadingPoints } = useQuery({
    queryKey: ['/api/user/points'],
    enabled: !!user?.id,
  });

  // Fetch user point history
  const { data: pointHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['/api/user/points/history'],
    enabled: !!user?.id,
  });

  // Fetch user reviews
  const { data: userReviews, isLoading: isLoadingReviews } = useQuery({
    queryKey: ['/api/user/reviews'],
    enabled: !!user?.id,
  });

  // Fetch user read research
  const { data: researchRead, isLoading: isLoadingResearch } = useQuery({
    queryKey: ['/api/user/research/read'],
    enabled: !!user?.id,
  });

  // Fetch user show submissions
  const { data: submissions, isLoading: isLoadingSubmissions } = useQuery({
    queryKey: ['/api/user/submissions'],
    enabled: !!user?.id,
  });

  // Fetch user favorites
  const { data: favorites, isLoading: isLoadingFavorites } = useQuery({
    queryKey: ['/api/user/favorites'],
    enabled: !!user?.id,
  });

  // Fetch global leaderboard
  const { data: leaderboard, isLoading: isLoadingLeaderboard } = useQuery({
    queryKey: ['/api/leaderboard'],
  });

  // Determine user's rank level based on points
  const getUserRank = (points: number) => {
    if (points >= 1000) return { name: "TV Expert", color: "text-purple-500", progress: 100 };
    if (points >= 500) return { name: "TV Enthusiast", color: "text-blue-500", progress: 70 };
    if (points >= 250) return { name: "TV Fan", color: "text-green-500", progress: 50 };
    if (points >= 100) return { name: "TV Viewer", color: "text-yellow-500", progress: 30 };
    return { name: "TV Newcomer", color: "text-gray-500", progress: 10 };
  };

  const userRank = user?.points ? getUserRank(user.points) : getUserRank(0);
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (!user) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Please Log In</CardTitle>
            <CardDescription>
              You need to be logged in to view your dashboard.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isLoading = isLoadingPoints || isLoadingHistory || isLoadingReviews || 
                    isLoadingResearch || isLoadingSubmissions || isLoadingFavorites || 
                    isLoadingLeaderboard;

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3">
          {/* User Profile Card */}
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Your Profile</CardTitle>
                <Button variant="ghost" size="sm">Edit</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={user.avatarUrl || ""} />
                  <AvatarFallback className="text-2xl bg-primary/10">
                    {user.username?.substring(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-2xl font-bold">{user.username}</h3>
                <p className="text-muted-foreground mb-2">{user.email}</p>
                <Badge className={userRank.color}>{userRank.name}</Badge>
                
                <div className="w-full mt-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Level Progress</span>
                    <span className="text-sm font-semibold">{user.points || 0} points</span>
                  </div>
                  <Progress value={userRank.progress} className="h-2" />
                </div>
                
                <div className="flex flex-col w-full mt-6">
                  <div className="flex justify-between py-2 border-b">
                    <span>Member Since</span>
                    <span className="font-semibold">{formatDate(user.createdAt)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>Last Active</span>
                    <span className="font-semibold">{formatDate(user.lastLoginDate || user.createdAt)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span>Reviews</span>
                    <span className="font-semibold">{userReviews?.length || 0}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Badges Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                <span>Your Badges</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className={`flex flex-col items-center justify-center p-4 rounded-lg ${userReviews?.length ? 'bg-primary/10' : 'bg-muted'}`}>
                  <Star className={`h-8 w-8 mb-2 ${userReviews?.length ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                  <span className="text-sm font-medium">Reviewer</span>
                </div>
                
                <div className={`flex flex-col items-center justify-center p-4 rounded-lg ${user.points >= 100 ? 'bg-primary/10' : 'bg-muted'}`}>
                  <Trophy className={`h-8 w-8 mb-2 ${user.points >= 100 ? 'text-blue-500' : 'text-muted-foreground'}`} />
                  <span className="text-sm font-medium">Point Collector</span>
                </div>
                
                <div className={`flex flex-col items-center justify-center p-4 rounded-lg ${researchRead?.length >= 3 ? 'bg-primary/10' : 'bg-muted'}`}>
                  <BookOpen className={`h-8 w-8 mb-2 ${researchRead?.length >= 3 ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <span className="text-sm font-medium">Researcher</span>
                </div>
                
                <div className={`flex flex-col items-center justify-center p-4 rounded-lg ${pointHistory?.filter(p => p.type === 'upvote_received').length >= 5 ? 'bg-primary/10' : 'bg-muted'}`}>
                  <ThumbsUp className={`h-8 w-8 mb-2 ${pointHistory?.filter(p => p.type === 'upvote_received').length >= 5 ? 'text-purple-500' : 'text-muted-foreground'}`} />
                  <span className="text-sm font-medium">Influencer</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:w-2/3">
          <Tabs defaultValue="activity" className="space-y-4">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="research">Research</TabsTrigger>
              <TabsTrigger value="submissions">Submissions</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
            </TabsList>
            
            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your recent activity and points earned</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingHistory ? (
                    <div className="text-center py-4">Loading activity...</div>
                  ) : pointHistory?.length ? (
                    <div className="space-y-4">
                      {pointHistory.slice(0, 10).map((activity) => (
                        <div key={activity.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                          <div className="bg-primary/10 p-2 rounded-full">
                            {activity.type === 'login' && <UserRound className="h-5 w-5" />}
                            {activity.type === 'review_created' && <Star className="h-5 w-5" />}
                            {activity.type === 'upvote_given' && <ThumbsUp className="h-5 w-5" />}
                            {activity.type === 'upvote_received' && <ThumbsUp className="h-5 w-5" />}
                            {activity.type === 'research_read' && <BookOpen className="h-5 w-5" />}
                            {activity.type === 'show_submission' && <PlusCircle className="h-5 w-5" />}
                            {activity.type === 'submission_approved' && <Check className="h-5 w-5" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{activity.description}</p>
                            <p className="text-muted-foreground text-sm">{formatDate(activity.createdAt)}</p>
                          </div>
                          <Badge variant="outline" className="text-green-500">+{activity.points} points</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No activity recorded yet. Start interacting with the site to earn points!
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Leaderboard */}
              <Card>
                <CardHeader>
                  <CardTitle>Community Leaderboard</CardTitle>
                  <CardDescription>Top users by points</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingLeaderboard ? (
                    <div className="text-center py-4">Loading leaderboard...</div>
                  ) : leaderboard?.length ? (
                    <div className="space-y-2">
                      {leaderboard.map((leaderUser, index) => (
                        <div key={leaderUser.id} className={`flex items-center p-3 rounded-lg ${leaderUser.id === user.id ? 'bg-primary/10 font-medium' : ''}`}>
                          <div className="flex items-center flex-1 gap-3">
                            <span className={`
                              w-7 h-7 flex items-center justify-center rounded-full font-bold
                              ${index === 0 ? 'bg-yellow-500 text-white' : 
                                index === 1 ? 'bg-gray-300 text-gray-800' : 
                                index === 2 ? 'bg-amber-700 text-white' : 'bg-gray-100 text-gray-600'}
                            `}>
                              {index + 1}
                            </span>
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={leaderUser.avatarUrl || ""} />
                              <AvatarFallback>
                                {leaderUser.username?.substring(0, 2).toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span>{leaderUser.username}</span>
                          </div>
                          <Badge variant="outline" className="ml-auto">{leaderUser.points} points</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No leaderboard data available.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Reviews Tab */}
            <TabsContent value="reviews" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Your Reviews</CardTitle>
                    <CardDescription>Reviews you've left on shows</CardDescription>
                  </div>
                  <Button size="sm">New Review</Button>
                </CardHeader>
                <CardContent>
                  {isLoadingReviews ? (
                    <div className="text-center py-4">Loading reviews...</div>
                  ) : userReviews?.length ? (
                    <div className="space-y-6">
                      {userReviews.map((review) => (
                        <div key={review.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-lg">Show #{review.tvShowId}</h4>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
                              ))}
                            </div>
                          </div>
                          <p className="text-muted-foreground text-sm mb-3">{formatDate(review.createdAt)}</p>
                          <p>{review.review}</p>
                          <div className="flex items-center justify-between mt-4">
                            <Badge variant="outline" className="flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3" /> {review.upvotes || 0}
                            </Badge>
                            <Button variant="outline" size="sm" className="flex items-center gap-1">
                              <ArrowUpRight className="h-4 w-4" /> View Show
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      You haven't written any reviews yet. Start rating shows to share your opinions!
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Research Tab */}
            <TabsContent value="research" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Research Summaries Read</CardTitle>
                  <CardDescription>Track your research progress</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingResearch ? (
                    <div className="text-center py-4">Loading research data...</div>
                  ) : researchRead?.length ? (
                    <div className="space-y-4">
                      {researchRead.map((read) => (
                        <div key={read.id} className="flex items-center justify-between border-b py-3 last:border-0">
                          <div>
                            <h4 className="font-medium">Research #{read.researchId}</h4>
                            <p className="text-muted-foreground text-sm">Read on {formatDate(read.readAt)}</p>
                          </div>
                          <Button variant="outline" size="sm" className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" /> Read Again
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      You haven't read any research summaries yet. Explore our research section to learn more about child development and media!
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Submissions Tab */}
            <TabsContent value="submissions" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Your Show Submissions</CardTitle>
                    <CardDescription>Shows you've suggested for our database</CardDescription>
                  </div>
                  <Button size="sm">Submit New Show</Button>
                </CardHeader>
                <CardContent>
                  {isLoadingSubmissions ? (
                    <div className="text-center py-4">Loading submissions...</div>
                  ) : submissions?.length ? (
                    <div className="space-y-4">
                      {submissions.map((submission) => (
                        <div key={submission.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold">{submission.name}</h4>
                              <p className="text-muted-foreground text-sm">Submitted on {formatDate(submission.createdAt)}</p>
                            </div>
                            <Badge 
                              className={
                                submission.status === 'approved' ? 'bg-green-500' : 
                                submission.status === 'rejected' ? 'bg-red-500' : 
                                'bg-yellow-500'
                              }
                            >
                              {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="mt-2 line-clamp-2">{submission.description}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge variant="outline">{submission.ageRange}</Badge>
                            <Badge variant="outline">{submission.platform}</Badge>
                            {submission.releaseYear && <Badge variant="outline">{submission.releaseYear}</Badge>}
                          </div>
                          {submission.adminNotes && (
                            <div className="mt-3 p-3 bg-muted rounded-md">
                              <p className="text-sm font-medium">Admin Notes:</p>
                              <p className="text-sm">{submission.adminNotes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      You haven't submitted any shows yet. Help us grow our database by suggesting shows!
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Favorites Tab */}
            <TabsContent value="favorites" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Your Favorites</CardTitle>
                  <CardDescription>Shows you've saved as favorites</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingFavorites ? (
                    <div className="text-center py-4">Loading favorites...</div>
                  ) : favorites?.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {favorites.map((favorite) => (
                        <div key={favorite.id} className="border rounded-lg overflow-hidden flex flex-col">
                          <div className="aspect-video bg-muted relative overflow-hidden">
                            {favorite.imageUrl ? (
                              <img src={favorite.imageUrl} alt={favorite.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                <span className="text-lg font-semibold">{favorite.name.charAt(0)}</span>
                              </div>
                            )}
                          </div>
                          <div className="p-4 flex-1 flex flex-col">
                            <h4 className="font-semibold mb-1">{favorite.name}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{favorite.description}</p>
                            <div className="mt-auto pt-2 flex justify-between items-center">
                              <Badge variant="outline">{favorite.ageRange}</Badge>
                              <Button variant="outline" size="sm" className="flex items-center gap-1">
                                <ArrowUpRight className="h-4 w-4" /> View
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      You haven't saved any favorites yet. Browse shows and click the heart icon to add them here!
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;