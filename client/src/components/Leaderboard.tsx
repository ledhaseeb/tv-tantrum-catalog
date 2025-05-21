import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const Leaderboard = () => {
  const { data: users, isLoading } = useQuery({
    queryKey: ['/api/leaderboard'],
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center">Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="flex-shrink-0 font-bold text-gray-400 w-6 text-center">
                  {i + 1}
                </div>
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center">Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users?.slice(0, 5).map((user: any, index: number) => (
            <div key={user.id} className="flex items-center gap-4">
              <div className="flex-shrink-0 font-bold text-gray-400 w-6 text-center">
                {index + 1}
              </div>
              <Avatar>
                <AvatarImage src={user.profileImageUrl} alt={user.username} />
                <AvatarFallback>
                  {user.username?.slice(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium">{user.username}</div>
              </div>
              <Badge variant="secondary" className="ml-auto">
                {user.totalPoints} Points
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default Leaderboard;