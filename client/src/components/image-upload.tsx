import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  imageUrl: string | null;
  onImageChange: (imageUrl: string) => void;
  className?: string;
}

export function ImageUpload({ imageUrl, onImageChange, className = '' }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file (JPEG, PNG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Image must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    // Show preview immediately
    const objectUrl = URL.createObjectURL(file);
    setUploadPreview(objectUrl);

    // Upload to server
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/shows/upload-image', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to upload image');
      }

      const data = await response.json();
      
      // Use the optimized image path
      onImageChange(data.optimizedPath);
      
      toast({
        title: 'Image uploaded',
        description: 'Image has been uploaded and optimized successfully',
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      // Revert preview on error
      setUploadPreview(null);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      // Reset the input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Determine which image to display (preview, existing, or placeholder)
  const displayImage = uploadPreview || imageUrl;

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <Label htmlFor="show-image" className="block mb-2">
          Show Image
        </Label>
        <div className="border rounded-md p-4 flex flex-col items-center justify-center bg-muted/20">
          <div className="relative w-full h-48 mb-4 flex items-center justify-center overflow-hidden bg-gray-50 rounded-md">
            {isUploading ? (
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin mb-2" />
                <p>Uploading and optimizing...</p>
              </div>
            ) : displayImage ? (
              <img
                src={displayImage}
                alt="Show preview"
                className="max-h-full object-contain"
                onError={() => {
                  setUploadPreview(null);
                  toast({
                    title: 'Image error',
                    description: 'Could not load the image',
                    variant: 'destructive',
                  });
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="h-16 w-16 mb-2" />
                <p>No image selected</p>
              </div>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            id="show-image"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          
          <Button
            type="button"
            variant="outline"
            onClick={handleFileSelect}
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {isUploading ? 'Uploading...' : 'Upload Image'}
          </Button>
          
          <p className="text-xs mt-2 text-muted-foreground text-center max-w-md">
            Upload a portrait-style image for the show (recommended ratio 3:4).
            The image will be automatically optimized for web display.
          </p>
        </div>
      </div>
    </div>
  );
}