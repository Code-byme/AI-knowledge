'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import Navbar from '@/components/Navbar';
import ChatBox from '@/components/ChatBox';
import AuthProtection from '@/lib/auth-protection';
import Link from 'next/link';
import { 
  Menu, 
  MessageSquare, 
  FileText, 
  Database, 
  BarChart3, 
  Settings, 
  HelpCircle,
  Bell,
  User,
  Calendar
} from 'lucide-react';

export default function DashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { data: session } = useSession();

  const sidebarItems = [
    { label: 'Chat', icon: MessageSquare, href: '/dashboard', active: true },
    { label: 'Documents', icon: FileText, href: '/dashboard/documents' },
    { label: 'Knowledge Bases', icon: Database, href: '/dashboard/knowledge-bases' },
    { label: 'Analytics', icon: BarChart3, href: '/dashboard/analytics' },
  ];

  const settingsItems = [
    { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
    { label: 'Help & Support', icon: HelpCircle, href: '/dashboard/support' },
  ];

  return (
    <AuthProtection>
      <div className="min-h-screen bg-background">
        <Navbar />
      
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex w-64 bg-card border-r border-border flex-col">
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
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.label}
                </Button>
              ))}
            </div>
            
            <div className="mt-8 space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground px-3">Settings</h3>
              {settingsItems.map((item) => (
                <Button
                  key={item.label}
                  variant="ghost"
                  className="w-full justify-start"
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
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <item.icon className="mr-3 h-4 w-4" />
                    {item.label}
                  </Button>
                ))}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Settings</h3>
                {settingsItems.map((item) => (
                  <Button
                    key={item.label}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => setIsSidebarOpen(false)}
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
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Left Panel - User Info */}
          <div className="lg:w-1/3 xl:w-1/4 p-4 lg:p-6 border-r border-border">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Welcome Back
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">{session?.user?.name || 'User'}</p>
                    <p className="text-sm text-gray-500">{session?.user?.email}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Member since today</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MessageSquare className="h-4 w-4" />
                    <span>Ready to chat</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Link href="/profile">
                    <Button variant="outline" className="w-full">
                      <User className="h-4 w-4 mr-2" />
                      View Profile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Chat */}
          <div className="flex-1 p-4 lg:p-6">
            <ChatBox />
          </div>
        </div>
      </div>
    </div>
    </AuthProtection>
  );
}
