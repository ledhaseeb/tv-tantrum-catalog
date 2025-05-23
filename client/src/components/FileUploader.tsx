import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface FileUploaderProps {
  onUploadComplete: (url: string) => void;
  onUploadStart?: () => void;
  onUploadError?: (error: string) => void;
  folder?: string;
  allowedTypes?: string[];
  maxSizeMB?: number;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onUploadComplete,
  onUploadStart,
  onUploadError,
  folder = 'uploads',
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  maxSizeMB = 5
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      setUploadStatus('error');
      setStatusMessage(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
      if (onUploadError) onUploadError(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
      return;
    }

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setUploadStatus('error');
      setStatusMessage(`File too large. Maximum size: ${maxSizeMB}MB`);
      if (onUploadError) onUploadError(`File too large. Maximum size: ${maxSizeMB}MB`);
      return;
    }

    // Start upload
    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);
    if (onUploadStart) onUploadStart();

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
      // Use fetch API instead of XMLHttpRequest for better error handling
      setUploadProgress(10); // Show initial progress
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      setUploadProgress(90); // Almost done
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Upload response:', data);
      
      if (data.url) {
        setUploadStatus('success');
        setStatusMessage('File uploaded successfully');
        setUploadProgress(100);
        onUploadComplete(data.url);
      } else {
        throw new Error('Server did not return a file URL');
      }
      
      setIsUploading(false);
    } catch (error) {
      setIsUploading(false);
      setUploadStatus('error');
      setStatusMessage(`Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (onUploadError) onUploadError(`Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={allowedTypes.join(',')}
        className="hidden"
      />
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition cursor-pointer" onClick={triggerFileInput}>
        {uploadStatus === 'idle' && (
          <>
            <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-2 text-sm text-gray-600">
              <p className="font-medium">Click to upload or drag and drop</p>
              <p className="text-xs">
                {allowedTypes.map(type => type.replace('image/', '.')).join(', ')} up to {maxSizeMB}MB
              </p>
            </div>
          </>
        )}
        
        {uploadStatus === 'uploading' && (
          <div className="space-y-2">
            <div className="animate-pulse flex justify-center">
              <UploadCloud className="h-12 w-12 text-primary" />
            </div>
            <p className="text-sm text-gray-600">Uploading file...</p>
            <Progress value={uploadProgress} className="h-2 w-full" />
            <p className="text-xs text-gray-500">{uploadProgress}%</p>
          </div>
        )}
        
        {uploadStatus === 'success' && (
          <div className="space-y-2">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <p className="text-sm text-green-600">{statusMessage}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={(e) => {
                e.stopPropagation();
                setUploadStatus('idle');
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
            >
              Upload another
            </Button>
          </div>
        )}
        
        {uploadStatus === 'error' && (
          <div className="space-y-2">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <p className="text-sm text-red-600">{statusMessage}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={(e) => {
                e.stopPropagation();
                setUploadStatus('idle');
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
            >
              Try again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploader;