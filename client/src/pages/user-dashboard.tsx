import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Award, 
  Star, 
  ThumbsUp, 
  Send, 
  TrendingUp,
  Calendar,
  BookOpen
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

interface UserDashboardData {
  user: {
    id: number;
    username: string;
    totalPoints: number;
    profileBio: string | null;
  };
  pointsHistory: PointHistory[];
  favorites: Favorite[];
  reviews: Review[];
  readResearch: ResearchSummary[];
  submissions: ShowSubmission[];
}

interface PointHistory {
  id: number;
  userId: number;
  points: number;
  reason: string;
  createdAt: string;
}

interface Favorite {
  id: number;
  userId: number;
  tvShowId: number;
  createdAt: string;
  tvShow: {
    id: number;
    name: string;
    imageUrl: string;
  };
}

interface Review {
  id: number;
  userId: number;
  tvShowId: number;
  userName: string;
  rating: number;
  review: string;
  createdAt: string;
  tvShow?: {
    id: number;
    name: string;
    imageUrl: string;
  };
}

interface ResearchSummary {
  id: number;
  title: string;
  summary: string;
  fullText: string;
  source: string;
  publishDate: string;
}

interface ShowSubmission {
  id: number;
  userId: number;
  name: string;
  description: string;
  ageRange: string;
  creator: string;
  status: "pending" | "approved" | "rejected";
  reason: string | null;
  createdAt: string;
}

interface LeaderboardUser {
  id: number;
  username: string;
  totalPoints: number;
}

export default function UserDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch user dashboard data
  const { data, isLoading } = useQuery({
    queryKey: ['/api/user/dashboard'],
    enabled: !!user,
  });

  // Fetch leaderboard data
  const { data: leaderboard, isLoading: isLeaderboardLoading } = useQuery({
    queryKey: ['/api/leaderboard'],
  });

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>User Dashboard</CardTitle>
            <CardDescription>
              Please log in to view your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Button asChild>
              <Link href="/auth">Login / Register</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dashboardData = data as UserDashboardData;
  
  // Calculate user level based on points
  const userPoints = dashboardData?.user?.totalPoints || 0;
  const userLevel = Math.floor(userPoints / 100) + 1;
  const pointsToNextLevel = (userLevel * 100) - userPoints;
  const progressPercent = ((userPoints % 100) / 100) * 100;

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* User profile card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <div className="bg-primary rounded-full flex items-center justify-center h-full w-full">
                  <User className="h-8 w-8 text-primary-foreground" />
                </div>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{dashboardData.user.username}</CardTitle>
                <CardDescription>{dashboardData.user.profileBio || "No bio added yet"}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                <Star className="h-8 w-8 text-primary mb-2" />
                <span className="text-2xl font-bold">{dashboardData.reviews.length}</span>
                <span className="text-sm text-muted-foreground">Reviews</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                <ThumbsUp className="h-8 w-8 text-primary mb-2" />
                <span className="text-2xl font-bold">{dashboardData.favorites.length}</span>
                <span className="text-sm text-muted-foreground">Favorites</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                <BookOpen className="h-8 w-8 text-primary mb-2" />
                <span className="text-2xl font-bold">{dashboardData.readResearch.length}</span>
                <span className="text-sm text-muted-foreground">Research Read</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Points and level card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2 text-primary" />
              Level {userLevel}
            </CardTitle>
            <CardDescription>
              {pointsToNextLevel} points to level {userLevel + 1}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <span className="block mb-2 text-sm font-medium">
                Progress to next level:
              </span>
              <Progress value={progressPercent} className="h-2" />
            </div>
            <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
              <span className="text-sm font-medium">Total Points:</span>
              <Badge variant="secondary" className="text-lg">
                {userPoints} pts
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-5 max-w-3xl mx-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="points">Points</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="research">Research</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 mr-2" />
                  Recent Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.reviews.slice(0, 3).map((review) => (
                      <div key={review.id} className="flex items-start gap-3 pb-3 border-b">
                        <div className="h-10 w-10 flex items-center justify-center bg-muted rounded-md">
                          <Star className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h4 className="font-medium">{review.tvShow?.name || `Show #${review.tvShowId}`}</h4>
                            <div className="flex items-center">
                              {Array(5).fill(0).map((_, idx) => (
                                <Star 
                                  key={idx} 
                                  className={`h-4 w-4 ${idx < review.rating ? 'text-primary fill-primary' : 'text-muted-foreground'}`} 
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{review.review}</p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                    {dashboardData.reviews.length > 3 && (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setActiveTab("reviews")}
                      >
                        View All Reviews
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">You haven't reviewed any shows yet.</p>
                    <Button asChild className="mt-2">
                      <Link href="/browse">Browse Shows</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLeaderboardLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(leaderboard as LeaderboardUser[])?.slice(0, 5).map((leaderUser, index) => (
                      <div key={leaderUser.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                            index === 1 ? 'bg-gray-100 text-gray-800' :
                            index === 2 ? 'bg-amber-100 text-amber-800' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {index + 1}
                          </div>
                          <span className="font-medium">{leaderUser.username}</span>
                        </div>
                        <Badge>{leaderUser.totalPoints} pts</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData.pointsHistory.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.pointsHistory.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className="h-10 w-10 flex items-center justify-center bg-muted rounded-md">
                          {activity.reason.includes('review') ? (
                            <Star className="h-5 w-5 text-primary" />
                          ) : activity.reason.includes('upvote') ? (
                            <ThumbsUp className="h-5 w-5 text-primary" />
                          ) : activity.reason.includes('research') ? (
                            <BookOpen className="h-5 w-5 text-primary" />
                          ) : activity.reason.includes('login') ? (
                            <Calendar className="h-5 w-5 text-primary" />
                          ) : (
                            <Award className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h4 className="font-medium">{activity.reason}</h4>
                            <Badge variant="outline" className="text-primary">
                              +{activity.points} pts
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(activity.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No activity yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Points Tab */}
        <TabsContent value="points">
          <Card>
            <CardHeader>
              <CardTitle>Points History</CardTitle>
              <CardDescription>
                View all your points earned from various activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData.pointsHistory.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.pointsHistory.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 pb-3 border-b">
                      <div className="h-12 w-12 flex items-center justify-center bg-muted rounded-md">
                        {activity.reason.includes('review') ? (
                          <Star className="h-6 w-6 text-primary" />
                        ) : activity.reason.includes('upvote') ? (
                          <ThumbsUp className="h-6 w-6 text-primary" />
                        ) : activity.reason.includes('research') ? (
                          <BookOpen className="h-6 w-6 text-primary" />
                        ) : activity.reason.includes('login') ? (
                          <Calendar className="h-6 w-6 text-primary" />
                        ) : (
                          <Award className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{activity.reason}</h4>
                            <span className="text-sm text-muted-foreground">
                              {new Date(activity.createdAt).toLocaleDateString()} at {new Date(activity.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-primary text-lg">
                            +{activity.points} pts
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No points history yet.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Earn points by rating shows, upvoting reviews, reading research, and more!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle>Your Reviews</CardTitle>
              <CardDescription>
                All the reviews you've written for TV shows
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData.reviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {dashboardData.reviews.map((review) => (
                    <Card key={review.id} className="overflow-hidden">
                      <div className="flex h-full">
                        <div className="w-1/3 bg-muted">
                          {review.tvShow?.imageUrl ? (
                            <img 
                              src={review.tvShow.imageUrl} 
                              alt={review.tvShow.name} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Star className="h-12 w-12 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="w-2/3 p-4">
                          <h3 className="font-bold mb-2">
                            {review.tvShow?.name || `Show #${review.tvShowId}`}
                          </h3>
                          <div className="flex mb-2">
                            {Array(5).fill(0).map((_, idx) => (
                              <Star 
                                key={idx} 
                                className={`h-4 w-4 ${idx < review.rating ? 'text-primary fill-primary' : 'text-muted-foreground'}`} 
                              />
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-3">{review.review}</p>
                          <div className="mt-2 text-xs text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="px-0"
                            asChild
                          >
                            <Link href={`/show/${review.tvShowId}`}>
                              View Show
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">You haven't reviewed any shows yet.</p>
                  <Button asChild className="mt-4">
                    <Link href="/browse">Browse Shows to Review</Link>
                  </Button>
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
                Research articles you've read about children's media
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData.readResearch.length > 0 ? (
                <div className="space-y-6">
                  {dashboardData.readResearch.map((research) => (
                    <Card key={research.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <CardTitle>{research.title}</CardTitle>
                        <CardDescription>
                          Source: {research.source} | {new Date(research.publishDate).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{research.summary}</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-4"
                          asChild
                        >
                          <Link href={`/research/${research.id}`}>
                            Read Full Article
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">You haven't read any research summaries yet.</p>
                  <Button asChild className="mt-4">
                    <Link href="/research">Browse Research</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Submissions Tab */}
        <TabsContent value="submissions">
          <Card>
            <CardHeader>
              <CardTitle>Show Submissions</CardTitle>
              <CardDescription>
                TV shows you've submitted for consideration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 flex justify-end">
                <Button asChild>
                  <Link href="/submit-show">
                    <Send className="h-4 w-4 mr-2" />
                    Submit New Show
                  </Link>
                </Button>
              </div>
              {dashboardData.submissions.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.submissions.map((submission) => (
                    <Card key={submission.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle>{submission.name}</CardTitle>
                          <Badge 
                            className={
                              submission.status === "approved" ? "bg-green-500" :
                              submission.status === "rejected" ? "bg-red-500" :
                              "bg-yellow-500"
                            }
                          >
                            {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                          </Badge>
                        </div>
                        <CardDescription>
                          Submitted on {new Date(submission.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="mb-2"><span className="font-medium">Age Range:</span> {submission.ageRange}</p>
                        <p className="mb-2"><span className="font-medium">Creator:</span> {submission.creator}</p>
                        <p className="mb-4 text-muted-foreground">{submission.description}</p>
                        
                        {submission.status === "rejected" && submission.reason && (
                          <div className="bg-muted p-3 rounded-md mt-2">
                            <p className="font-medium">Reason for rejection:</p>
                            <p className="text-sm text-muted-foreground">{submission.reason}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Send className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">You haven't submitted any shows yet.</p>
                  <Button asChild className="mt-4">
                    <Link href="/submit-show">
                      Submit Your First Show
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Leaderboard footer section */}
      <div className="mt-12">
        <Separator className="mb-8" />
        <h2 className="text-2xl font-bold mb-6 text-center">Community Leaderboard</h2>
        
        {isLeaderboardLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(leaderboard as LeaderboardUser[])?.slice(0, 9).map((leaderUser, index) => (
              <Card key={leaderUser.id} className={
                index < 3 ? "border-2 " + 
                (index === 0 ? "border-yellow-400" : 
                 index === 1 ? "border-gray-400" : 
                 "border-amber-600") : ""
              }>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-amber-100 text-amber-800' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{leaderUser.username}</h3>
                      <div className="flex items-center">
                        <Award className="h-4 w-4 text-primary mr-1" />
                        <span className="text-sm font-medium text-muted-foreground">
                          Level {Math.floor(leaderUser.totalPoints / 100) + 1}
                        </span>
                      </div>
                    </div>
                    <div className="ml-auto">
                      <Badge className="text-lg">{leaderUser.totalPoints} pts</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}