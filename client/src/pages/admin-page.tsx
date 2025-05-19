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
import { 
  Loader2, 
  Search, 
  Edit, 
  RefreshCw, 
  ImageIcon, 
  User, 
  CheckCircle, 
  XCircle, 
  Clock,
  Shield,
  Check,
  X,
  PlusCircle,
  Upload,
  Image
} from 'lucide-react';
import { ImageUpload } from '@/components/image-upload';
import { TvShow, User as UserType } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';

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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddingShow, setIsAddingShow] = useState(false);
  const [newShowFormState, setNewShowFormState] = useState({
    name: '',
    description: '',
    ageRange: '',
    stimulationScore: 3,
    interactivityLevel: 'Medium',
    dialogueIntensity: 'Medium',
    soundEffectsLevel: 'Medium',
    sceneFrequency: 'Medium',
    musicTempo: 'Medium',
    totalMusicLevel: 'Medium',
    totalSoundEffectTimeLevel: 'Medium',
    animationStyle: '',
    themes: [] as string[],
    imageUrl: '',
    // Adding required database fields with default values to avoid null constraints
    episodeLength: 15, // Default episode length in minutes
    seasons: 1, // Default number of seasons
    releaseYear: new Date().getFullYear(), // Current year
    endYear: null, // Null is acceptable for endYear
    isOngoing: true, // Default to ongoing
    creator: '', // Empty string for creator
    availableOn: [] as string[] // Empty array for available platforms
    // Note: we use stimulationScore for overallRating in the backend
  });
  
  // Redirect if user is not an admin
  useEffect(() => {
    if (user && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You do not have admin privileges to access this page.",
        variant: "destructive",
      });
      setLocation("/home");
    }
  }, [user, isAdmin, toast, setLocation]);
  const [isOptimizingImages, setIsOptimizingImages] = useState(false);
  const [users, setUsers] = useState<Array<Omit<UserType, 'password'>>>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<Array<Omit<UserType, 'password'>>>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isApprovingUser, setIsApprovingUser] = useState(false);

  // Form state
  const [formState, setFormState] = useState({
    name: '',
    description: '',
    ageRange: '',
    stimulationScore: 3, // Default stimulation score - always a whole number
    interactivityLevel: 'Medium',
    dialogueIntensity: 'Medium',
    soundEffectsLevel: 'Medium',
    sceneFrequency: 'Medium',
    musicTempo: 'Medium',
    totalMusicLevel: 'Medium',
    totalSoundEffectTimeLevel: 'Medium',
    animationStyle: '',
    themes: [] as string[],
    imageUrl: ''
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

  // Function to fetch users (used in both effect and manual refresh)
  const fetchUsers = async () => {
    if (!isAdmin) return;
    
    setIsLoadingUsers(true);
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      console.log('Fetched users:', data);
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };
    
  // Load all users (admin only)
  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  // Filter users based on search term
  useEffect(() => {
    if (userSearchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const term = userSearchTerm.toLowerCase();
      const filtered = users.filter(user => 
        user.username?.toLowerCase().includes(term) || 
        user.email.toLowerCase().includes(term)
      );
      setFilteredUsers(filtered);
    }
  }, [userSearchTerm, users]);

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
  
  // Optimize show images using OMDB posters
  const handleOptimizeImages = async () => {
    setIsOptimizingImages(true);
    try {
      const response = await apiRequest('POST', '/api/optimize-images');
      const data = await response.json();
      
      toast({
        title: "Images Optimized",
        description: `Processed ${data.total} shows. Successfully updated ${data.successful} images.`,
      });
      
      // Reload shows to get the updated image URLs
      const updatedShows = await fetch('/api/shows').then(res => res.json());
      setShows(updatedShows);
      setFilteredShows(updatedShows);
    } catch (error) {
      console.error('Error optimizing images:', error);
      toast({
        title: "Error",
        description: "Failed to optimize images. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsOptimizingImages(false);
    }
  };

  // Normalize stimulation metrics between different naming conventions
  const normalizeMetrics = (value: string | null | undefined): string => {
    if (!value) return 'Medium';
    
    // Trim and convert to lowercase for consistent comparison
    const normalizedValue = value.trim().toLowerCase();
    
    // Map various formats to standard values
    if (normalizedValue.includes('low-moderate') || normalizedValue.includes('low to moderate')) {
      return 'Low-Moderate';
    } else if (normalizedValue.includes('moderate-low')) {
      return 'Low-Moderate';
    } else if (normalizedValue.includes('moderate-high') || normalizedValue.includes('moderate to high')) {
      return 'Moderate-High';
    } else if (normalizedValue.includes('high-moderate')) {
      return 'Moderate-High';
    } else if (normalizedValue === 'low') {
      return 'Low';
    } else if (normalizedValue === 'high') {
      return 'High';
    } else if (normalizedValue.includes('moderate')) {
      return 'Medium'; // Convert 'Moderate' to 'Medium' for consistency
    }
    
    return 'Medium'; // Default fallback
  };

  // Helper function to ensure we always have a valid string value
  const ensureValue = (value: string | null | undefined, defaultValue: string = 'Medium'): string => {
    // Return the value if it exists and is not an empty string, otherwise return the default
    return value && value.trim() !== '' ? value : defaultValue;
  };

  // Handler for adding a new show
  const handleAddNewShow = () => {
    // Reset the form state to default values
    setNewShowFormState({
      name: '',
      description: '',
      ageRange: '3-5 years',
      stimulationScore: 3,
      interactivityLevel: 'Medium',
      dialogueIntensity: 'Medium',
      soundEffectsLevel: 'Medium',
      sceneFrequency: 'Medium',
      musicTempo: 'Medium',
      totalMusicLevel: 'Medium',
      totalSoundEffectTimeLevel: 'Medium',
      animationStyle: '',
      themes: [],
      imageUrl: '',
      // Database required fields with default values
      episodeLength: 15,
      seasons: 1,
      releaseYear: new Date().getFullYear(),
      endYear: null,
      isOngoing: true,
      creator: '',
      availableOn: [],
      overallRating: 3
    });
    
    // Open the add show dialog
    setIsAddDialogOpen(true);
  };
  
  // Submit handler for adding a new show
  const handleSubmitNewShow = async () => {
    setIsAddingShow(true);
    
    try {
      // Ensure stimulation score is a whole number
      const formDataWithWholeScore = {
        ...newShowFormState,
        stimulationScore: Math.round(newShowFormState.stimulationScore)
      };
      
      // Convert form values to API format
      const apiFormData = convertFormValuesToApi(formDataWithWholeScore);
      
      // Submit to API
      const response = await apiRequest('POST', '/api/shows', apiFormData);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to add new show');
      }
      
      const newShow = await response.json();
      
      // Add the new show to the state
      setShows(prev => [...prev, newShow]);
      setFilteredShows(prev => [...prev, newShow]);
      
      // Close the dialog
      setIsAddDialogOpen(false);
      
      // Show success message
      toast({
        title: "Show Added",
        description: `Successfully added "${newShow.name}" to the database.`,
      });
    } catch (error) {
      console.error('Error adding new show:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add new show",
        variant: "destructive"
      });
    } finally {
      setIsAddingShow(false);
    }
  };
  
  // Handler for uploading image for a show
  const handleUploadImage = async (showId: number, imageUrl: string) => {
    try {
      if (!imageUrl.trim()) {
        toast({
          title: "Error",
          description: "Please provide a valid image URL",
          variant: "destructive"
        });
        return;
      }
      
      const response = await apiRequest('POST', `/api/shows/${showId}/update-with-local-image`, { imageUrl });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update image');
      }
      
      const updatedShow = await response.json();
      
      // Update the show in state
      setShows(prev => prev.map(show => 
        show.id === showId ? { ...show, imageUrl: updatedShow.show.imageUrl } : show
      ));
      setFilteredShows(prev => prev.map(show => 
        show.id === showId ? { ...show, imageUrl: updatedShow.show.imageUrl } : show
      ));
      
      // If the show being edited is the currently selected show, update it
      if (selectedShow && selectedShow.id === showId) {
        setSelectedShow({ ...selectedShow, imageUrl: updatedShow.show.imageUrl });
      }
      
      // Show success message
      toast({
        title: "Image Updated",
        description: `Successfully updated image for "${updatedShow.show.name}".`,
      });
    } catch (error) {
      console.error('Error updating image:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update image",
        variant: "destructive"
      });
    }
  };
  
  // Open edit dialog
  const handleEditShow = (show: TvShow) => {
    // Log the show object to debug what values we're getting from the API
    console.log("Show data for editing:", JSON.stringify(show, null, 2));

    // Force a fresh fetch of the specific show to ensure we have the latest data
    const fetchCurrentShowData = async () => {
      try {
        const response = await fetch(`/api/shows/${show.id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch show: ${response.statusText}`);
        }
        
        const currentShowData = await response.json();
        console.log("Fresh show data:", JSON.stringify(currentShowData, null, 2));
        
        // Map display values to form values - converting from "Moderate" to correct form values
        // This ensures the edit form and details page values match
        const mappedInteractivityLevel = normalizeMetrics(currentShowData.interactivityLevel);
        const mappedDialogueIntensity = normalizeMetrics(currentShowData.dialogueIntensity);
        const mappedSoundEffectsLevel = normalizeMetrics(currentShowData.soundEffectsLevel);
        const mappedSceneFrequency = normalizeMetrics(currentShowData.sceneFrequency);
        const mappedMusicTempo = normalizeMetrics(currentShowData.musicTempo);
        const mappedTotalMusicLevel = normalizeMetrics(currentShowData.totalMusicLevel);
        const mappedTotalSoundEffectTimeLevel = normalizeMetrics(currentShowData.totalSoundEffectTimeLevel);
        
        console.log("Mapped values:", {
          interactivityLevel: mappedInteractivityLevel,
          dialogueIntensity: mappedDialogueIntensity,
          soundEffectsLevel: mappedSoundEffectsLevel,
          sceneFrequency: mappedSceneFrequency,
          musicTempo: mappedMusicTempo,
          totalMusicLevel: mappedTotalMusicLevel,
          totalSoundEffectTimeLevel: mappedTotalSoundEffectTimeLevel
        });
        
        // Use the freshly fetched show data with normalized values
        setSelectedShow(currentShowData);
        setFormState({
          name: currentShowData.name,
          description: ensureValue(currentShowData.description, ''),
          ageRange: ensureValue(currentShowData.ageRange, ''),
          stimulationScore: currentShowData.stimulationScore,
          interactivityLevel: mappedInteractivityLevel,
          dialogueIntensity: mappedDialogueIntensity,
          soundEffectsLevel: mappedSoundEffectsLevel,
          sceneFrequency: mappedSceneFrequency,
          musicTempo: mappedMusicTempo,
          totalMusicLevel: mappedTotalMusicLevel,
          totalSoundEffectTimeLevel: mappedTotalSoundEffectTimeLevel,
          animationStyle: ensureValue(currentShowData.animationStyle, ''),
          themes: currentShowData.themes || [],
          imageUrl: ensureValue(currentShowData.imageUrl, '')
        });
        
        setIsDialogOpen(true);
      } catch (error) {
        console.error("Error fetching fresh show data:", error);
        // Fall back to using the original show data if the fetch fails
        setSelectedShow(show);
        
        // Apply the same normalization to the original show data
        const mappedInteractivityLevel = normalizeMetrics(show.interactivityLevel);
        const mappedDialogueIntensity = normalizeMetrics(show.dialogueIntensity);
        const mappedSoundEffectsLevel = normalizeMetrics(show.soundEffectsLevel);
        const mappedSceneFrequency = normalizeMetrics(show.sceneFrequency);
        const mappedMusicTempo = normalizeMetrics(show.musicTempo);
        const mappedTotalMusicLevel = normalizeMetrics(show.totalMusicLevel);
        const mappedTotalSoundEffectTimeLevel = normalizeMetrics(show.totalSoundEffectTimeLevel);
        
        setFormState({
          name: show.name,
          description: ensureValue(show.description, ''),
          ageRange: ensureValue(show.ageRange, ''),
          stimulationScore: show.stimulationScore,
          interactivityLevel: mappedInteractivityLevel,
          dialogueIntensity: mappedDialogueIntensity,
          soundEffectsLevel: mappedSoundEffectsLevel,
          sceneFrequency: mappedSceneFrequency,
          musicTempo: mappedMusicTempo,
          totalMusicLevel: mappedTotalMusicLevel,
          totalSoundEffectTimeLevel: mappedTotalSoundEffectTimeLevel,
          animationStyle: ensureValue(show.animationStyle, ''),
          themes: show.themes || [],
          imageUrl: ensureValue(show.imageUrl, '')
        });
        
        setIsDialogOpen(true);
      }
    };
    
    // Call the fetch function
    fetchCurrentShowData();
  };

  // Convert form values back to API format
  const convertFormValuesToApi = (formValues: any) => {
    // Helper function to convert "Medium" back to "Moderate" for API
    const convertMetricValueForApi = (value: string | null | undefined): string | null => {
      if (!value) return null;
      
      // Convert form values back to API format
      if (value === 'Medium') {
        return 'Moderate';
      }
      
      return value;
    };
    
    // Ensure stimulation score is a whole number
    const wholeStimulationScore = Math.round(formValues.stimulationScore);
    console.log(`Rounded stimulation score: ${formValues.stimulationScore} → ${wholeStimulationScore}`);
    
    // Create a new object with converted values
    return {
      ...formValues,
      // Ensure stimulation score is a whole number
      stimulationScore: wholeStimulationScore,
      // Ensure themes is an array
      themes: Array.isArray(formValues.themes) ? formValues.themes : [],
      // Convert form field values back to API format
      interactivityLevel: formValues.interactivityLevel === 'Medium' ? 'Moderate' : formValues.interactivityLevel,
      dialogueIntensity: formValues.dialogueIntensity === 'Medium' ? 'Moderate' : formValues.dialogueIntensity,
      sceneFrequency: formValues.sceneFrequency === 'Medium' ? 'Moderate' : formValues.sceneFrequency,
      musicTempo: formValues.musicTempo === 'Medium' ? 'Moderate' : formValues.musicTempo,
      totalMusicLevel: formValues.totalMusicLevel === 'Medium' ? 'Moderate' : formValues.totalMusicLevel,
      totalSoundEffectTimeLevel: formValues.totalSoundEffectTimeLevel === 'Medium' ? 'Moderate' : formValues.totalSoundEffectTimeLevel,
    };
  };
  
  // Handle user approval/rejection
  const handleUserApproval = async (userId: number, approve: boolean) => {
    setIsApprovingUser(true);
    try {
      const response = await apiRequest('PATCH', `/api/users/${userId}/approve`, { isApproved: approve });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update user approval status');
      }
      
      const updatedUser = await response.json();
      
      // Update the users list
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, isApproved: approve } : user
      ));
      
      setFilteredUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, isApproved: approve } : user
      ));
      
      toast({
        title: approve ? "User Approved" : "User Rejected",
        description: `Successfully ${approve ? 'approved' : 'rejected'} user ${updatedUser.username || updatedUser.email}`,
      });
    } catch (error) {
      console.error('Error updating user approval status:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user approval status",
        variant: "destructive"
      });
    } finally {
      setIsApprovingUser(false);
    }
  };
  
  // Update show
  const handleUpdateShow = async () => {
    if (!selectedShow) return;
    
    setIsUpdating(true);
    try {
      // Convert form values back to API format
      const apiFormData = convertFormValuesToApi(formState);
      
      console.log('Submitting data to API:', apiFormData);
      
      // Make the API request with the converted data
      const updatedShow = await apiRequest('PATCH', `/api/shows/${selectedShow.id}`, apiFormData);
      
      // Update shows in state
      setShows(prev => prev.map(show => 
        show.id === updatedShow.id ? updatedShow : show
      ));
      setFilteredShows(prev => prev.map(show => 
        show.id === updatedShow.id ? updatedShow : show
      ));
      
      // Invalidate any queries that might have stale data
      console.log('Invalidating query cache for:', `/api/shows/${selectedShow.id}`);
      queryClient.invalidateQueries({ queryKey: [`/api/shows/${selectedShow.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/shows'] });
      
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
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="shows">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>TV Shows</CardTitle>
                  <CardDescription>
                    View and manage all TV shows in the database
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => handleAddNewShow()}
                  className="flex items-center"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Show
                </Button>
              </div>
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
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredShows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
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
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage users and approve early access requests
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={fetchUsers}
                  disabled={isLoadingUsers}
                >
                  {isLoadingUsers ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Refresh Users
                </Button>
              </div>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Search users..."
                  className="pl-10"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="flex justify-center items-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground">
                  No users found
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.id}</TableCell>
                          <TableCell>{user.username || '-'}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.country || '-'}</TableCell>
                          <TableCell>
                            {user.isAdmin ? (
                              <div className="flex items-center space-x-1 text-blue-600">
                                <Shield size={16} />
                                <span>Admin</span>
                              </div>
                            ) : user.isApproved ? (
                              <div className="flex items-center space-x-1 text-green-600">
                                <CheckCircle size={16} />
                                <span>Approved</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1 text-orange-600">
                                <Clock size={16} />
                                <span>Pending</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {!user.isAdmin && (
                                <>
                                  {!user.isApproved ? (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="h-8 px-2 text-green-600"
                                      onClick={() => handleUserApproval(user.id, true)}
                                      disabled={isApprovingUser}
                                    >
                                      <Check className="h-4 w-4" />
                                      <span className="ml-1">Approve</span>
                                    </Button>
                                  ) : (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="h-8 px-2 text-red-600"
                                      onClick={() => handleUserApproval(user.id, false)}
                                      disabled={isApprovingUser}
                                    >
                                      <X className="h-4 w-4" />
                                      <span className="ml-1">Revoke</span>
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
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
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Image Optimization</h3>
                <p className="text-muted-foreground mb-4">
                  Replace landscape-oriented images with portrait-style images from OMDB to ensure 
                  consistent portrait layout across the application.
                </p>
                <Button 
                  onClick={handleOptimizeImages} 
                  disabled={isOptimizingImages}
                  className="flex items-center"
                >
                  {isOptimizingImages ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Optimizing Images...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Optimize Show Images
                    </>
                  )}
                </Button>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-muted-foreground">More settings options will be available in future updates.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Show Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
                value={String(Math.round(formState.stimulationScore))}
                onValueChange={(value) => setFormState({...formState, stimulationScore: Math.round(parseInt(value))})}
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
              <Label htmlFor="totalSoundEffectTimeLevel" className="text-right">
                Total Sound Effect Time
              </Label>
              <Select 
                value={formState.totalSoundEffectTimeLevel}
                onValueChange={(value) => setFormState({...formState, totalSoundEffectTimeLevel: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select total sound effect time level" />
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
              <Label htmlFor="sceneFrequency" className="text-right">
                Scene Frequency
              </Label>
              <Select 
                value={formState.sceneFrequency}
                onValueChange={(value) => setFormState({...formState, sceneFrequency: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select scene frequency" />
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
              <Label htmlFor="musicTempo" className="text-right">
                Music Tempo
              </Label>
              <Select 
                value={formState.musicTempo}
                onValueChange={(value) => setFormState({...formState, musicTempo: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select music tempo" />
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
              <Label htmlFor="totalMusicLevel" className="text-right">
                Total Music Level
              </Label>
              <Select 
                value={formState.totalMusicLevel}
                onValueChange={(value) => setFormState({...formState, totalMusicLevel: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select total music level" />
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
              <Label htmlFor="themes" className="text-right">
                Themes
              </Label>
              <Textarea
                id="themes"
                value={Array.isArray(formState.themes) ? formState.themes.join(', ') : ''}
                onChange={(e) => {
                  const themesArray = e.target.value
                    .split(',')
                    .map(theme => theme.trim())
                    .filter(theme => theme !== '');
                  setFormState({...formState, themes: themesArray});
                }}
                className="col-span-3"
                placeholder="Enter themes separated by commas (e.g., 'Education, Adventure, Problem-solving')"
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="animationStyle" className="text-right">
                Animation Style
              </Label>
              <Textarea
                id="animationStyle"
                value={formState.animationStyle}
                onChange={(e) => setFormState({...formState, animationStyle: e.target.value})}
                className="col-span-3"
                placeholder="Describe the animation style (e.g., '3D Animation', 'Stop-motion with hand-crafted models')"
                rows={3}
              />
            </div>
            
            {/* Image Management Section */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-medium mb-2">Image Management</h3>
              
              <div className="flex flex-col gap-4">
                {/* Image Upload Component */}
                <ImageUpload 
                  imageUrl={formState.imageUrl} 
                  onImageChange={(imageUrl) => setFormState({...formState, imageUrl})}
                />
                
                {/* OMDB Image Lookup Button */}
                <div>
                  <p className="text-sm mb-2">Or fetch image from OMDB:</p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex items-center justify-center"
                    onClick={() => {
                      if (selectedShow) {
                        // Call the API to fetch and update the image from OMDB
                        apiRequest('POST', `/api/shows/${selectedShow.id}/update-image`)
                          .then(resp => resp.json())
                          .then(data => {
                            if (data.success) {
                              setFormState(prev => ({...prev, imageUrl: data.show.imageUrl}));
                              toast({
                                title: "Success",
                                description: data.message,
                              });
                            } else {
                              throw new Error(data.message || "Failed to find OMDB image");
                            }
                          })
                          .catch(err => {
                            toast({
                              title: "Error",
                              description: err.message || "Failed to update image from OMDB",
                              variant: "destructive"
                            });
                          });
                      }
                    }}
                  >
                    <Image className="h-4 w-4 mr-2" />
                    Find OMDB Image
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="sticky bottom-0 bg-white pb-2 pt-2">
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

      {/* Add Show Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New TV Show</DialogTitle>
            <DialogDescription>
              Create a new TV show entry in the database.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Show Name
              </Label>
              <Input
                id="name"
                value={newShowFormState.name}
                onChange={(e) => setNewShowFormState({...newShowFormState, name: e.target.value})}
                className="col-span-3"
                placeholder="Official TV show name"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={newShowFormState.description}
                onChange={(e) => setNewShowFormState({...newShowFormState, description: e.target.value})}
                className="col-span-3"
                placeholder="Brief description of the show"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ageRange" className="text-right">
                Age Range
              </Label>
              <Input
                id="ageRange"
                value={newShowFormState.ageRange}
                onChange={(e) => setNewShowFormState({...newShowFormState, ageRange: e.target.value})}
                className="col-span-3"
                placeholder="e.g., '3-5 years' or '8-12 years'"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stimulationScore" className="text-right">
                Stimulation Score (1-5)
              </Label>
              <Input
                id="stimulationScore"
                type="number"
                min={1}
                max={5}
                step={1}
                value={newShowFormState.stimulationScore}
                onChange={(e) => setNewShowFormState({
                  ...newShowFormState, 
                  stimulationScore: Math.round(Number(e.target.value))
                })}
                className="col-span-3"
                placeholder="Enter a whole number from 1-5"
                required
              />
            </div>
            
            {/* 
              Removed "Overall Rating" field since we're using 
              stimulation score for both (they are the same thing) 
            */}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="interactivityLevel" className="text-right">
                Interactivity Level
              </Label>
              <Select 
                value={newShowFormState.interactivityLevel}
                onValueChange={(value) => setNewShowFormState({...newShowFormState, interactivityLevel: value})}
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
                value={newShowFormState.dialogueIntensity}
                onValueChange={(value) => setNewShowFormState({...newShowFormState, dialogueIntensity: value})}
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
                Sound Effects Level
              </Label>
              <Select 
                value={newShowFormState.soundEffectsLevel}
                onValueChange={(value) => setNewShowFormState({...newShowFormState, soundEffectsLevel: value})}
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
              <Label htmlFor="sceneFrequency" className="text-right">
                Scene Frequency
              </Label>
              <Select 
                value={newShowFormState.sceneFrequency}
                onValueChange={(value) => setNewShowFormState({...newShowFormState, sceneFrequency: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select scene frequency" />
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
              <Label htmlFor="musicTempo" className="text-right">
                Music Tempo
              </Label>
              <Select 
                value={newShowFormState.musicTempo}
                onValueChange={(value) => setNewShowFormState({...newShowFormState, musicTempo: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select music tempo" />
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
              <Label htmlFor="totalMusicLevel" className="text-right">
                Total Music Level
              </Label>
              <Select 
                value={newShowFormState.totalMusicLevel}
                onValueChange={(value) => setNewShowFormState({...newShowFormState, totalMusicLevel: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select total music level" />
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
              <Label htmlFor="totalSoundEffectTimeLevel" className="text-right">
                Total Sound Effect Time
              </Label>
              <Select 
                value={newShowFormState.totalSoundEffectTimeLevel}
                onValueChange={(value) => setNewShowFormState({...newShowFormState, totalSoundEffectTimeLevel: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select total sound effect time level" />
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
              <Label htmlFor="themes" className="text-right">
                Themes
              </Label>
              <Textarea
                id="themes"
                value={Array.isArray(newShowFormState.themes) ? newShowFormState.themes.join(', ') : ''}
                onChange={(e) => {
                  const themesArray = e.target.value
                    .split(',')
                    .map(theme => theme.trim())
                    .filter(theme => theme !== '');
                  setNewShowFormState({...newShowFormState, themes: themesArray});
                }}
                className="col-span-3"
                placeholder="Enter themes separated by commas (e.g., 'Education, Adventure, Problem-solving')"
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="animationStyle" className="text-right">
                Animation Style
              </Label>
              <Textarea
                id="animationStyle"
                value={newShowFormState.animationStyle}
                onChange={(e) => setNewShowFormState({...newShowFormState, animationStyle: e.target.value})}
                className="col-span-3"
                placeholder="Describe the animation style (e.g., '3D Animation', 'Stop-motion with hand-crafted models')"
                rows={3}
              />
            </div>
            
            {/* Additional required fields for database */}
            <div className="border-t pt-4 mt-4 mb-4">
              <h3 className="text-md font-medium mb-2">Additional Information</h3>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="episodeLength" className="text-right">
                Episode Length (min)
              </Label>
              <Input
                id="episodeLength"
                type="number"
                value={newShowFormState.episodeLength}
                onChange={(e) => setNewShowFormState({...newShowFormState, episodeLength: Number(e.target.value)})}
                className="col-span-3"
                placeholder="Episode length in minutes"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="seasons" className="text-right">
                Seasons
              </Label>
              <Input
                id="seasons"
                type="number"
                value={newShowFormState.seasons}
                onChange={(e) => setNewShowFormState({...newShowFormState, seasons: Number(e.target.value)})}
                className="col-span-3"
                placeholder="Number of seasons"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="releaseYear" className="text-right">
                Release Year
              </Label>
              <Input
                id="releaseYear"
                type="number"
                value={newShowFormState.releaseYear}
                onChange={(e) => setNewShowFormState({...newShowFormState, releaseYear: Number(e.target.value)})}
                className="col-span-3"
                placeholder="Year the show was released"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="creator" className="text-right">
                Creator/Studio
              </Label>
              <Input
                id="creator"
                value={newShowFormState.creator}
                onChange={(e) => setNewShowFormState({...newShowFormState, creator: e.target.value})}
                className="col-span-3"
                placeholder="Creator or studio name"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="availableOn" className="text-right">
                Available On
              </Label>
              <Textarea
                id="availableOn"
                value={Array.isArray(newShowFormState.availableOn) ? newShowFormState.availableOn.join(', ') : ''}
                onChange={(e) => {
                  const platformsArray = e.target.value
                    .split(',')
                    .map(platform => platform.trim())
                    .filter(platform => platform !== '');
                  setNewShowFormState({...newShowFormState, availableOn: platformsArray});
                }}
                className="col-span-3"
                placeholder="Enter platforms separated by commas (e.g., 'Netflix, Disney+, YouTube')"
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-right col-span-1">
                <Label>Show Image</Label>
              </div>
              <div className="col-span-3">
                <ImageUpload 
                  imageUrl={newShowFormState.imageUrl} 
                  onImageChange={(imageUrl) => setNewShowFormState({...newShowFormState, imageUrl})}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitNewShow} disabled={isAddingShow}>
              {isAddingShow ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding Show...
                </>
              ) : 'Add Show'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}