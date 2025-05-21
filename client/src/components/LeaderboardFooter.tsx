import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Medal, Trophy, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

interface LeaderboardUser {
  id: number;
  username: string;
  totalPoints: number;
  rank?: number;
}

export default function LeaderboardFooter() {
  const { data: leaderboard, isLoading, error } = useQuery({
    queryKey: ['/api/leaderboard'],
    queryFn: async () => {
      const response = await fetch('/api/leaderboard?limit=5');
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      return response.json() as Promise<LeaderboardUser[]>;
    },
  });

  // Add rank to each user
  const rankedLeaderboard = leaderboard?.map((user, index) => ({
    ...user,
    rank: index + 1,
  })) || [];

  return (
    <div className="w-full bg-gradient-to-r from-primary/5 to-primary/10 py-6">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xl font-semibold flex items-center">
              <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
              Top Contributors
            </h3>
            <p className="text-sm text-muted-foreground">
              Join the leaderboard by rating shows, submitting content, and sharing with friends
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard" className="flex items-center">
              View Full Leaderboard
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {isLoading && 
            Array(5).fill(0).map((_, i) => (
              <Card key={i} className="bg-card/60">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          }
          
          {error && (
            <div className="col-span-full text-center p-4 text-muted-foreground">
              Unable to load leaderboard data
            </div>
          )}

          {rankedLeaderboard.map((user) => (
            <Card key={user.id} className={`bg-card/60 ${user.rank === 1 ? 'border-yellow-400 shadow-md' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10 border-2 border-background">
                      <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary">
                        {user.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {user.rank && (
                      <span className="absolute -bottom-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-background text-xs font-bold">
                        {user.rank}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-medium truncate max-w-[120px]">
                      {user.username}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Trophy className="h-3 w-3 text-yellow-500 mr-1" />
                      {user.totalPoints.toLocaleString()} points
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}