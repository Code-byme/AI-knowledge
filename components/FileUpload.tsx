'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  File, 
  FileText, 
  FileImage, 
  FileCode, 
  X, 
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface FileUploadProps {
  onUploadSuccess?: () => void;
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size too large. Maximum 10MB allowed.');
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/markdown',
      'application/json',
      'text/csv'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('File type not supported. Allowed: PDF, TXT, DOC, DOCX, MD, JSON, CSV');
      return;
    }

    setSelectedFile(file);
    setTitle(file.name.replace(/\.[^/.]+$/, '')); // Remove extension for title
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      await response.json();
      toast.success('File uploaded successfully!');
      
      // Reset form
      setSelectedFile(null);
      setTitle('');
      setUploadProgress(0);
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setTitle('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <File className="h-8 w-8 text-red-500" />;
    if (fileType.includes('text')) return <FileText className="h-8 w-8 text-blue-500" />;
    if (fileType.includes('image')) return <FileImage className="h-8 w-8 text-green-500" />;
    if (fileType.includes('json') || fileType.includes('code')) return <FileCode className="h-8 w-8 text-purple-500" />;
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary transition-colors">
        <CardContent className="p-6">
          {!selectedFile ? (
            <div
              className={`relative flex flex-col items-center justify-center py-12 px-6 text-center transition-colors ${
                dragActive 
                  ? 'bg-primary/5 border-primary' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 rounded-full bg-primary/10">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Upload your documents</h3>
                  <p className="text-sm text-muted-foreground">
                    Drag and drop files here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports PDF, TXT, DOC, DOCX, MD, JSON, CSV (max 10MB)
                  </p>
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="mt-4"
                >
                  Choose Files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileInputChange}
                  className="hidden"
                  accept=".txt,.doc,.docx,.md,.json,.csv"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {getFileIcon(selectedFile.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)} • {selectedFile.type}
                  </p>
                </div>
                <Button
                  onClick={removeFile}
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Document Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for your document"
                  className="w-full"
                />
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  onClick={handleUpload}
                  disabled={uploading || !title.trim()}
                  className="flex-1"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Document
                    </>
                  )}
                </Button>
                <Button
                  onClick={removeFile}
                  variant="outline"
                  disabled={uploading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
