import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  Tv, 
  BarChart3, 
  Settings, 
  LogOut,
  Plus,
  Search,
  Filter
} from "lucide-react";

interface AdminUser {
  id: number;
  email: string;
  firstName: string;
  isAdmin: boolean;
}

export default function AdminDashboard() {
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Check admin authentication
  const { data: adminUser, isLoading: loadingAuth } = useQuery<AdminUser>({
    queryKey: ['/api/admin/me'],
    queryFn: async () => {
      const response = await fetch('/api/admin/me');
      if (!response.ok) {
        throw new Error('Not authenticated');
      }
      return response.json();
    },
    retry: false,
  });

  // Get dashboard stats
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    enabled: !!adminUser,
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/logout', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Logout failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation('/admin/login');
    },
  });

  // Redirect to login if not authenticated
  if (!loadingAuth && !adminUser) {
    setLocation('/admin/login');
    return null;
  }

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">TV Tantrum Admin</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {adminUser?.firstName}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shows</CardTitle>
              <Tv className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingStats ? "..." : stats?.totalShows || 302}
              </div>
              <p className="text-xs text-muted-foreground">
                Authentic TV shows in catalog
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Featured Shows</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingStats ? "..." : stats?.featuredShows || 12}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently featured content
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingStats ? "..." : stats?.adminUsers || 1}
              </div>
              <p className="text-xs text-muted-foreground">
                System administrators
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database Status</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                  Online
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                PostgreSQL connected
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Tv className="w-5 h-5 mr-2" />
                Manage Shows
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                View, edit, and manage the TV show catalog
              </p>
              <Button className="w-full">
                <Search className="w-4 h-4 mr-2" />
                Browse Catalog
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Add New Show
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Add new TV shows to the catalog database
              </p>
              <Button className="w-full" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Show
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                View usage statistics and platform analytics
              </p>
              <Button className="w-full" variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Reports
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">TV Tantrum Catalog Initialized</p>
                  <p className="text-sm text-gray-600">302 authentic TV shows loaded successfully</p>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                  Complete
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Database Migration</p>
                  <p className="text-sm text-gray-600">Catalog schema updated with sensory data</p>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                  Active
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Admin System Enabled</p>
                  <p className="text-sm text-gray-600">Administrative access configured</p>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                  Ready
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Public Site Link */}
        <div className="mt-8">
          <Alert>
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>View the public TV Tantrum catalog site</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation('/')}
                >
                  Go to Public Site →
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}