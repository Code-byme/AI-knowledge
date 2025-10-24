'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import Navbar from '@/components/Navbar';
import ChatBox from '@/components/ChatBox';
import FileUpload from '@/components/FileUpload';
import FileList from '@/components/FileList';
import AuthProtection from '@/lib/auth-protection';
import Link from 'next/link';
import { 
  Menu, 
  MessageSquare, 
  FileText, 
  User
} from 'lucide-react';

export default function DashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { data: session } = useSession();

  const sidebarItems = [
    { label: 'Chat', icon: MessageSquare, active: activeTab === 'chat' },
    { label: 'Documents', icon: FileText, active: activeTab === 'documents' },
  ];


  return (
    <AuthProtection>
      <div className="h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex w-64 bg-card border-r border-border flex-col h-full fixed left-0 top-16 z-10">
          <div className="p-6">
            <h2 className="text-lg font-semibold">Dashboard</h2>
          </div>
          
          <div className="flex-1 px-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground px-3">Main</h3>
              {sidebarItems.map((item) => (
                <Button
                  key={item.label}
                  variant={item.active ? 'default' : 'ghost'}
                  className={`w-full justify-start ${
                    item.active ? 'bg-primary text-primary-foreground' : ''
                  }`}
                  onClick={() => setActiveTab(item.label.toLowerCase())}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.label}
                </Button>
              ))}
            </div>
            
          </div>
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden fixed top-20 left-4 z-50">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <SheetTitle className="sr-only">Dashboard Navigation</SheetTitle>
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Dashboard</h2>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Main</h3>
                {sidebarItems.map((item) => (
                  <Button
                    key={item.label}
                    variant={item.active ? 'default' : 'ghost'}
                    className={`w-full justify-start ${
                      item.active ? 'bg-primary text-primary-foreground' : ''
                    }`}
                    onClick={() => {
                      setActiveTab(item.label.toLowerCase());
                      setIsSidebarOpen(false);
                    }}
                  >
                    <item.icon className="mr-3 h-4 w-4" />
                    {item.label}
                  </Button>
                ))}
              </div>
              
            </div>
          </SheetContent>
        </Sheet>

            {/* Main Content */}
            <div className="flex-1 p-4 lg:p-6 h-full lg:ml-64 flex flex-col">
          {/* Welcome Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Welcome back, {session?.user?.name || 'User'}!</h1>
                <p className="text-muted-foreground">Manage your documents and chat with your AI assistant.</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium">{session?.user?.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                </div>
                <Link href="/profile">
                  <Button variant="outline" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg w-fit">
            <Button
              variant={activeTab === 'chat' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('chat')}
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Chat
            </Button>
            <Button
              variant={activeTab === 'documents' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('documents')}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Documents
            </Button>
          </div>

          {/* Tab Content */}
          {activeTab === 'chat' && (
            <div className="flex-1 min-h-0">
              <ChatBox />
            </div>
          )}
          
          {activeTab === 'documents' && (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Document Management</h2>
                  <p className="text-muted-foreground">
                    Upload and manage your documents to build your knowledge base.
                  </p>
                </div>

                <FileUpload onUploadSuccess={() => setRefreshTrigger(prev => prev + 1)} />

                <div>
                  <h3 className="text-lg font-semibold mb-4">Your Documents</h3>
                  <FileList refreshTrigger={refreshTrigger} />
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </AuthProtection>
  );
}
