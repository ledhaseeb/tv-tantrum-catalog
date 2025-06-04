import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AlertCircle, Database, Refresh, Settings, Sync, Check, X } from "lucide-react";

export default function NotionSyncPage() {
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

  // Get Notion status
  const { data: notionStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/notion/status'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Sync all data mutation
  const syncAllMutation = useMutation({
    mutationFn: () => apiRequest('/api/notion/sync', 'POST'),
    onSuccess: () => {
      toast({
        title: "Sync Complete",
        description: "All data has been successfully synced to Notion.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notion/status'] });
      setIsSyncing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync data to Notion.",
        variant: "destructive",
      });
      setIsSyncing(false);
    },
  });

  // Sync recent data mutation
  const syncRecentMutation = useMutation({
    mutationFn: () => apiRequest('/api/notion/sync/recent', 'POST'),
    onSuccess: () => {
      toast({
        title: "Recent Sync Complete",
        description: "Recent data has been synced to Notion.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notion/status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync recent data.",
        variant: "destructive",
      });
    },
  });

  // Clear and resync mutation
  const clearResyncMutation = useMutation({
    mutationFn: () => apiRequest('/api/notion/clear-resync', 'POST'),
    onSuccess: () => {
      toast({
        title: "Clear & Resync Complete",
        description: "All Notion databases have been cleared and resynced.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notion/status'] });
      setIsSyncing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Clear & Resync Failed",
        description: error.message || "Failed to clear and resync databases.",
        variant: "destructive",
      });
      setIsSyncing(false);
    },
  });

  const handleFullSync = () => {
    setIsSyncing(true);
    syncAllMutation.mutate();
  };

  const handleRecentSync = () => {
    syncRecentMutation.mutate();
  };

  const handleClearResync = () => {
    if (confirm("This will clear all existing data in Notion and resync everything. Are you sure?")) {
      setIsSyncing(true);
      clearResyncMutation.mutate();
    }
  };

  if (statusLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  const isConnected = notionStatus?.connected;
  const databases = notionStatus?.databases || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notion Integration</h1>
          <p className="text-muted-foreground">
            Manage your Notion database synchronization
          </p>
        </div>
        <Badge variant={isConnected ? "default" : "destructive"}>
          {isConnected ? (
            <>
              <Check className="mr-1 h-3 w-3" />
              Connected
            </>
          ) : (
            <>
              <X className="mr-1 h-3 w-3" />
              Disconnected
            </>
          )}
        </Badge>
      </div>

      <Separator />

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Connection Status
          </CardTitle>
          <CardDescription>
            Current status of your Notion integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-4 w-4" />
                <span>Successfully connected to Notion</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Page ID: {notionStatus?.pageId}
              </div>
              {notionStatus?.lastSync && (
                <div className="text-sm text-muted-foreground">
                  Last sync: {new Date(notionStatus.lastSync).toLocaleString()}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>Unable to connect to Notion. Please check your credentials.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Database Status */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Databases
            </CardTitle>
            <CardDescription>
              Notion databases created for TV Tantrum data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {databases.map((db: any) => (
                <div key={db.id} className="p-4 border rounded-lg">
                  <h3 className="font-medium">{db.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {db.recordCount || 0} records
                  </p>
                  <Badge variant="outline" className="mt-2">
                    {db.id.slice(0, 8)}...
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync Actions */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sync className="h-5 w-5" />
              Synchronization
            </CardTitle>
            <CardDescription>
              Sync your PostgreSQL data with Notion databases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button
                onClick={handleRecentSync}
                disabled={syncRecentMutation.isPending}
                variant="outline"
                className="h-20 flex-col"
              >
                <Refresh className="h-6 w-6 mb-2" />
                <span>Sync Recent</span>
                <span className="text-xs text-muted-foreground">Last 24 hours</span>
              </Button>

              <Button
                onClick={handleFullSync}
                disabled={isSyncing || syncAllMutation.isPending}
                className="h-20 flex-col"
              >
                <Sync className="h-6 w-6 mb-2" />
                <span>Full Sync</span>
                <span className="text-xs text-muted-foreground">All data</span>
              </Button>

              <Button
                onClick={handleClearResync}
                disabled={isSyncing || clearResyncMutation.isPending}
                variant="destructive"
                className="h-20 flex-col"
              >
                <Database className="h-6 w-6 mb-2" />
                <span>Clear & Resync</span>
                <span className="text-xs text-muted-foreground">Fresh start</span>
              </Button>
            </div>

            {(isSyncing || syncAllMutation.isPending || clearResyncMutation.isPending) && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Syncing data to Notion...</span>
                </div>
                <p className="text-sm text-blue-600 mt-1">
                  This may take several minutes for large datasets.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions for setup */}
      {!isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
            <CardDescription>
              Follow these steps to connect your Notion workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Go to <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">https://www.notion.so/my-integrations</a></li>
              <li>Create a new integration with the name "TV Tantrum Integration"</li>
              <li>Copy the integration secret</li>
              <li>Create or open a Notion page where you want to store the data</li>
              <li>Connect your integration to that page via the page settings</li>
              <li>Add your credentials to the application secrets</li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}