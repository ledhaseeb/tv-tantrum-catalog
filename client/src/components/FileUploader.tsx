import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface FileUploaderProps {
  accept?: string;
  maxSize?: number; // size in bytes
  onChange?: (files: FileList | null) => void;
  multiple?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  accept = "*",
  maxSize = 10 * 1024 * 1024, // Default 10MB
  onChange,
  multiple = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    
    if (!files || files.length === 0) {
      onChange?.(null);
      return;
    }

    // Check file size
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > maxSize) {
        setError(`File "${files[i].name}" is too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`);
        e.target.value = "";
        onChange?.(null);
        return;
      }
    }

    setError(null);
    onChange?.(files);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    
    // Check if file type is acceptable
    if (accept !== "*") {
      const acceptedTypes = accept.split(",");
      for (let i = 0; i < files.length; i++) {
        const fileType = files[i].type;
        if (!acceptedTypes.some(type => {
          if (type.endsWith('/*')) {
            const mainType = type.split('/')[0];
            return fileType.startsWith(`${mainType}/`);
          }
          return type === fileType;
        })) {
          setError(`File "${files[i].name}" is not an accepted file type.`);
          return;
        }
      }
    }
    
    // Check file size
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > maxSize) {
        setError(`File "${files[i].name}" is too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`);
        return;
      }
    }
    
    setError(null);
    onChange?.(files);
    
    // Update the file input
    if (fileInputRef.current) {
      // Create a new DataTransfer object
      const dataTransfer = new DataTransfer();
      
      // Use only the first file if multiple is false
      const filesToAdd = multiple ? files : [files[0]];
      
      // Add the files to the DataTransfer object
      for (let i = 0; i < filesToAdd.length; i++) {
        dataTransfer.items.add(filesToAdd[i]);
      }
      
      // Set the files of the file input
      fileInputRef.current.files = dataTransfer.files;
    }
  };

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept={accept}
          onChange={handleFileChange}
          multiple={multiple}
        />
        <Upload className="h-10 w-10 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 mb-1">
          Drag and drop your {multiple ? "files" : "file"} here or click to browse
        </p>
        <p className="text-xs text-gray-500">
          {accept === "*"
            ? "All file types accepted"
            : `Accepted: ${accept.replace(/\*/g, "any")}`}
          , max size: {Math.round(maxSize / 1024 / 1024)}MB
        </p>
      </div>
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  );
};