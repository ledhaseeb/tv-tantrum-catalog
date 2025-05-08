import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, Edit, RefreshCw } from 'lucide-react';
import { TvShow } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [shows, setShows] = useState<TvShow[]>([]);
  const [filteredShows, setFilteredShows] = useState<TvShow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedShow, setSelectedShow] = useState<TvShow | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form state
  const [formState, setFormState] = useState({
    name: '',
    description: '',
    ageRange: '',
    stimulationScore: 3,
    interactivityLevel: 'Medium',
    dialogueIntensity: 'Medium',
    soundEffectsLevel: 'Medium',
    themes: [] as string[],
    overallRating: 3
  });

  // Check if user is admin
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You need admin privileges to access this page.",
        variant: "destructive"
      });
      setLocation('/');
    }
  }, [isLoading, isAdmin, setLocation, toast]);

  // Load all shows
  useEffect(() => {
    const fetchShows = async () => {
      try {
        const data = await fetch('/api/shows').then(res => res.json());
        setShows(data);
        setFilteredShows(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching shows:', error);
        toast({
          title: "Error",
          description: "Failed to load shows. Please try again.",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    };

    fetchShows();
  }, [toast]);

  // Handle search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredShows(shows);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = shows.filter(show => 
        show.name.toLowerCase().includes(term) || 
        (show.description && show.description.toLowerCase().includes(term))
      );
      setFilteredShows(filtered);
    }
  }, [searchTerm, shows]);

  // Refresh data from GitHub
  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      const response = await apiRequest('POST', '/api/refresh-data');
      const data = await response.json();
      
      toast({
        title: "Data Refreshed",
        description: `Successfully refreshed ${data.count} shows from GitHub.`,
      });
      
      // Reload shows
      const updatedShows = await fetch('/api/shows').then(res => res.json());
      setShows(updatedShows);
      setFilteredShows(updatedShows);
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Error",
        description: "Failed to refresh data from GitHub.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Open edit dialog
  const handleEditShow = (show: TvShow) => {
    setSelectedShow(show);
    setFormState({
      name: show.name,
      description: show.description || '',
      ageRange: show.ageRange || '',
      stimulationScore: show.stimulationScore,
      interactivityLevel: show.interactivityLevel || 'Medium',
      dialogueIntensity: show.dialogueIntensity || 'Medium',
      soundEffectsLevel: show.soundEffectsLevel || 'Medium',
      themes: show.themes || [],
      overallRating: show.overallRating
    });
    setIsDialogOpen(true);
  };

  // Update show
  const handleUpdateShow = async () => {
    if (!selectedShow) return;
    
    setIsUpdating(true);
    try {
      const response = await apiRequest('PATCH', `/api/shows/${selectedShow.id}`, formState);
      const updatedShow = await response.json();
      
      // Update shows in state
      setShows(prev => prev.map(show => 
        show.id === updatedShow.id ? updatedShow : show
      ));
      setFilteredShows(prev => prev.map(show => 
        show.id === updatedShow.id ? updatedShow : show
      ));
      
      toast({
        title: "Show Updated",
        description: `Successfully updated ${updatedShow.name}.`,
      });
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error updating show:', error);
      toast({
        title: "Error",
        description: "Failed to update show. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Admin Dashboard</CardTitle>
              <CardDescription>Manage TV shows and settings</CardDescription>
            </div>
            <Button 
              onClick={handleRefreshData} 
              disabled={isRefreshing}
              variant="outline"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="shows">
        <TabsList className="mb-4">
          <TabsTrigger value="shows">TV Shows</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="shows">
          <Card>
            <CardHeader>
              <CardTitle>TV Shows</CardTitle>
              <CardDescription>
                View and manage all TV shows in the database
              </CardDescription>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Search shows..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Age Range</TableHead>
                      <TableHead>Stimulation</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredShows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No shows found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredShows.map((show) => (
                        <TableRow key={show.id}>
                          <TableCell>{show.id}</TableCell>
                          <TableCell className="font-medium">{show.name}</TableCell>
                          <TableCell>{show.ageRange || 'N/A'}</TableCell>
                          <TableCell>{show.stimulationScore}/5</TableCell>
                          <TableCell>{show.overallRating}/5</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditShow(show)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter>
              <div className="text-sm text-muted-foreground">
                Showing {filteredShows.length} of {shows.length} shows
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Configure system-wide settings and options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Settings options will be available in a future update.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Show Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit TV Show</DialogTitle>
            <DialogDescription>
              Update the details for {selectedShow?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={formState.name}
                onChange={(e) => setFormState({...formState, name: e.target.value})}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={formState.description}
                onChange={(e) => setFormState({...formState, description: e.target.value})}
                className="col-span-3"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ageRange" className="text-right">
                Age Range
              </Label>
              <Input
                id="ageRange"
                value={formState.ageRange}
                onChange={(e) => setFormState({...formState, ageRange: e.target.value})}
                className="col-span-3"
                placeholder="e.g. 3-5"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stimulationScore" className="text-right">
                Stimulation Score
              </Label>
              <Select 
                value={String(formState.stimulationScore)}
                onValueChange={(value) => setFormState({...formState, stimulationScore: parseInt(value)})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select stimulation score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Very Low</SelectItem>
                  <SelectItem value="2">2 - Low</SelectItem>
                  <SelectItem value="3">3 - Medium</SelectItem>
                  <SelectItem value="4">4 - High</SelectItem>
                  <SelectItem value="5">5 - Very High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="interactivityLevel" className="text-right">
                Interactivity
              </Label>
              <Select 
                value={formState.interactivityLevel}
                onValueChange={(value) => setFormState({...formState, interactivityLevel: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select interactivity level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Low-Moderate">Low-Moderate</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Moderate-High">Moderate-High</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dialogueIntensity" className="text-right">
                Dialogue Intensity
              </Label>
              <Select 
                value={formState.dialogueIntensity}
                onValueChange={(value) => setFormState({...formState, dialogueIntensity: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select dialogue intensity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Low-Moderate">Low-Moderate</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Moderate-High">Moderate-High</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="soundEffectsLevel" className="text-right">
                Sound Effects
              </Label>
              <Select 
                value={formState.soundEffectsLevel}
                onValueChange={(value) => setFormState({...formState, soundEffectsLevel: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select sound effects level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Low-Moderate">Low-Moderate</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Moderate-High">Moderate-High</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="overallRating" className="text-right">
                Overall Rating
              </Label>
              <Select 
                value={String(formState.overallRating)}
                onValueChange={(value) => setFormState({...formState, overallRating: parseInt(value)})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select overall rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Poor</SelectItem>
                  <SelectItem value="2">2 - Fair</SelectItem>
                  <SelectItem value="3">3 - Good</SelectItem>
                  <SelectItem value="4">4 - Very Good</SelectItem>
                  <SelectItem value="5">5 - Excellent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateShow} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}