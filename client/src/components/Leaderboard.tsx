import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrophyIcon, AwardIcon, Medal } from 'lucide-react';

export function Leaderboard() {
  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ['/api/leaderboard'],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Top Contributors</CardTitle>
          <CardDescription>Users with the most points</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-4 w-10" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const topUsers = leaderboardData || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Top Contributors</CardTitle>
        <CardDescription>Users with the most points</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topUsers.length > 0 ? (
            topUsers.map((user: any, index: number) => (
              <div key={user.id} className="flex items-center gap-4">
                <div className="flex-shrink-0 w-8 text-center">
                  {index === 0 && (
                    <TrophyIcon className="h-6 w-6 text-yellow-500" />
                  )}
                  {index === 1 && (
                    <TrophyIcon className="h-6 w-6 text-gray-400" />
                  )}
                  {index === 2 && (
                    <TrophyIcon className="h-6 w-6 text-amber-700" />
                  )}
                  {index > 2 && (
                    <span className="text-gray-500 font-medium">{index + 1}</span>
                  )}
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.profileImageUrl} alt={user.username} />
                  <AvatarFallback>
                    {user.username?.slice(0, 1).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{user.username}</p>
                </div>
                <Badge variant="outline" className="ml-auto bg-orange-50 text-orange-600 border-orange-200">
                  {user.totalPoints} pts
                </Badge>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p>No users with points yet.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default Leaderboard;