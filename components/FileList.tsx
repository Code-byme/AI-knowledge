'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  File, 
  FileText, 
  FileImage, 
  FileCode, 
  Download, 
  Trash2, 
  Eye,
  Calendar,
  HardDrive,
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Document {
  id: number;
  title: string;
  file_type: string;
  file_size: number;
  created_at: string;
  file_path: string;
}

interface FileListProps {
  refreshTrigger?: number;
}

export default function FileList({ refreshTrigger }: FileListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchDocuments();
  }, [refreshTrigger]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterType !== 'all') params.append('file_type', filterType);
      
      const response = await fetch(`/api/documents?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`/api/documents?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete document');

      toast.success('Document deleted successfully');
      fetchDocuments();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleDownload = (document: Document) => {
    const link = document.createElement('a');
    link.href = document.file_path;
    link.download = document.title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <File className="h-5 w-5 text-red-500" />;
    if (fileType.includes('text')) return <FileText className="h-5 w-5 text-blue-500" />;
    if (fileType.includes('image')) return <FileImage className="h-5 w-5 text-green-500" />;
    if (fileType.includes('json') || fileType.includes('code')) return <FileCode className="h-5 w-5 text-purple-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const getFileTypeColor = (fileType: string) => {
    if (fileType.includes('pdf')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (fileType.includes('text')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (fileType.includes('image')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (fileType.includes('json') || fileType.includes('code')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileTypeName = (fileType: string) => {
    const typeMap: { [key: string]: string } = {
      'application/pdf': 'PDF',
      'text/plain': 'Text',
      'application/msword': 'Word',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
      'text/markdown': 'Markdown',
      'application/json': 'JSON',
      'text/csv': 'CSV'
    };
    return typeMap[fileType] || fileType.split('/')[1]?.toUpperCase() || 'File';
  };

  const sortedDocuments = [...documents].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'name':
        return a.title.localeCompare(b.title);
      case 'size':
        return b.file_size - a.file_size;
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-1 items-center space-x-2 w-full lg:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <Button
            onClick={fetchDocuments}
            variant="outline"
            size="sm"
            className="whitespace-nowrap"
          >
            Search
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full lg:w-auto">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 w-full sm:w-auto"
          >
            <option value="all">All Types</option>
            <option value="application/pdf">PDF</option>
            <option value="text/plain">Text</option>
            <option value="application/msword">Word</option>
            <option value="application/json">JSON</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 w-full sm:w-auto"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name A-Z</option>
            <option value="size">Size</option>
          </select>
        </div>
      </div>

      {/* Documents List */}
      {documents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <File className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
            <p className="text-muted-foreground text-center">
              Upload your first document to get started with your knowledge base.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sortedDocuments.map((document) => (
            <Card key={document.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {getFileIcon(document.file_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{document.title}</h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <Badge className={getFileTypeColor(document.file_type)}>
                          {getFileTypeName(document.file_type)}
                        </Badge>
                        <span className="text-sm text-muted-foreground flex items-center">
                          <HardDrive className="h-3 w-3 mr-1" />
                          {formatFileSize(document.file_size)}
                        </span>
                        <span className="text-sm text-muted-foreground flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDistanceToNow(new Date(document.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => handleDownload(document)}
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(document.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
