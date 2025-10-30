'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import ChatBoxWithHistory from '@/components/ChatBoxWithHistory';
import FileUpload from '@/components/FileUpload';
import FileList from '@/components/FileList';
import AuthProtection from '@/lib/auth-protection';
import { 
  MessageSquare, 
  FileText
} from 'lucide-react';

export default function DashboardPage() {
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
        <div className="hidden lg:flex w-72 bg-slate-900/60 backdrop-blur-xl border-r border-white/10 flex-col h-full fixed left-0 top-16 z-10">
          <div className="px-6 pt-6 pb-2">
            <h2 className="text-lg font-semibold bg-linear-to-r from-white to-violet-300 bg-clip-text text-transparent">Dashboard</h2>
          </div>
          
          <div className="flex-1 px-4">
            <div className="space-y-2">
              <h3 className="text-[11px] tracking-wider uppercase font-semibold text-slate-400 px-3">Main</h3>
              {sidebarItems.map((item) => (
                <Button
                  key={item.label}
                  variant={item.active ? 'default' : 'ghost'}
                  className={`w-full justify-start rounded-xl border transition-all ${
                    item.active 
                      ? 'bg-primary text-primary-foreground shadow-[0_8px_24px_rgba(139,92,246,0.35)] border-transparent'
                      : 'bg-white/5! text-slate-300 border-white/10!  hover:text-slate-300! hover:translate-x-1!'
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


            {/* Main Content */}
            <div className="flex-1 p-4 lg:p-8 h-full lg:ml-72 flex flex-col">
          {/* Welcome Header - Desktop Only */}
          <div className="mb-6 hidden lg:block bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-linear-to-r from-white to-violet-300 bg-clip-text text-transparent">Welcome back, {session?.user?.name || 'User'}!</h1>
                <p className="text-slate-400">Manage your documents and chat with your AI assistant.</p>
              </div>
              {/* <div className="flex items-center space-x-3">
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
              </div> */}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-2 mb-4 lg:mb-6 w-fit">
            <Button
              variant={activeTab === 'chat' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 rounded-xl border ${activeTab==='chat' ? 'bg-primary text-primary-foreground border-transparent shadow-[0_6px_18px_rgba(139,92,246,0.35)]' : 'bg-white/5! text-slate-300 border-white/10 hover:bg-transparent hover:text-slate-300 hover:translate-y-[-2px] transition-transform'}`}
            >
              <MessageSquare className="h-4 w-4" />
              Chat
            </Button>
            <Button
              variant={activeTab === 'documents' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-2 rounded-xl border ${activeTab==='documents' ? 'bg-primary text-primary-foreground border-transparent shadow-[0_6px_18px_rgba(139,92,246,0.35)]' : 'bg-white/5! text-slate-300 border-white/10 hover:bg-transparent hover:text-slate-300 hover:translate-y-[-2px] transition-transform'}`}
            >
              <FileText className="h-4 w-4" />
              Documents
            </Button>
          </div>

          {/* Tab Content */}
          {activeTab === 'chat' && (
            <div className="flex-1 min-h-0 bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
              <ChatBoxWithHistory />
            </div>
          )}
          
          {activeTab === 'documents' && (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2 bg-linear-to-r from-white to-violet-300 bg-clip-text text-transparent">Document Management</h2>
                  <p className="text-slate-400">
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
