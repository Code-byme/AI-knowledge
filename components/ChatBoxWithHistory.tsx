'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Plus, 
  Bot, 
  User,
  Loader2,
  MessageSquare,
  Trash2,
  FileText
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  documentsUsed?: number;
}

interface ChatSession {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  message_count: number;
  last_message_at: string;
}

interface ChatBoxProps {
  className?: string;
}

export default function ChatBox({ className }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<number | null>(null);
  const [queueInfo, setQueueInfo] = useState<{ nextRetryMs: number; attempt: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat sessions on component mount
  useEffect(() => {
    loadSessions();
  }, []);

  // Initialize responsive sidebar state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 1024) {
        setShowSidebar(false);
      }
    }
  }, []);

  // Load messages when session changes
  useEffect(() => {
    if (currentSessionId) {
      loadMessages(currentSessionId);
    } else {
      setMessages([]);
    }
  }, [currentSessionId]);

  const loadSessions = async () => {
    try {
      setError(null);
      const response = await fetch('/api/chat/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions);
        // Auto-select the most recent session
        if (data.sessions.length > 0) {
          setCurrentSessionId(data.sessions[0].id);
        }
      } else {
        throw new Error('Failed to load chat sessions');
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      setError('Failed to load chat history. Please refresh the page.');
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const loadMessages = async (sessionId: number) => {
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}/messages`);
      if (response.ok) {
        const data = await response.json();
        const formattedMessages: Message[] = data.messages.map((msg: { id: number; role: string; content: string; created_at: string; documents_used?: number }) => ({
          id: msg.id.toString(),
          type: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at),
          documentsUsed: msg.documents_used,
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const createNewSession = async () => {
    // Do not create a DB session yet; wait until first message is sent.
    // This prevents empty conversations from appearing in history.
    setCurrentSessionId(null);
    setMessages([]);
    // Optionally focus the textarea
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const deleteSession = async (sessionId: number) => {
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        if (currentSessionId === sessionId) {
          setCurrentSessionId(null);
          setMessages([]);
        }
        loadSessions(); // Refresh sessions list
        setConfirmOpen(false);
        setSessionToDelete(null);
      } else {
        const errorData = await response.json();
        console.error('Error deleting session:', errorData.error);
        setError(`Failed to delete session: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      setError('Failed to delete session. Please try again.');
    }
  };

  const attemptSend = async (attempt: number, messageText: string) => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: messageText,
        sessionId: currentSessionId 
      }),
    });

    const data = await response.json();

    if (response.status === 429) {
      const retryMs = data.retryAfterMs || 2000 * attempt;
      setQueueInfo({ nextRetryMs: retryMs, attempt });
      await new Promise((r) => setTimeout(r, retryMs));
      setQueueInfo(null);
      return await attemptSend(attempt + 1, messageText);
    }

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get response');
    }

    return data;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setIsTyping(true);

    try {
      const data = await attemptSend(1, currentInput);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response,
        timestamp: new Date(),
        documentsUsed: data.documentsUsed || 0,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update current session ID if it was created
      if (data.sessionId && !currentSessionId) {
        setCurrentSessionId(data.sessionId);
        loadSessions(); // Refresh sessions list
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className={`relative flex h-full bg-transparent ${className}`}>
      {/* Mobile overlay */}
      {showSidebar && (
        <div className="lg:hidden fixed inset-0 bg-black/40 z-30" onClick={() => setShowSidebar(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`bg-slate-900/60 backdrop-blur-xl border-r border-white/10 flex flex-col shadow-lg z-40 lg:z-auto
        w-80 lg:static lg:translate-x-0 lg:h-auto
        fixed inset-y-0 left-0 transform transition-transform duration-200
        ${showSidebar ? 'translate-x-0' : '-translate-x-full'} lg:block`}
      >
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Chat History</h2>
              <Button
                onClick={createNewSession}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 custom-scroll">
            {error ? (
              <div className="text-center py-12">
                <div className="bg-destructive/10 rounded-full p-6 w-fit mx-auto mb-4">
                  <MessageSquare className="h-12 w-12 text-destructive" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Chat History</h3>
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                <Button
                  onClick={loadSessions}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            ) : isLoadingSessions ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading conversations...</p>
                </div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-muted/50 rounded-full p-6 w-fit mx-auto mb-4">
                  <MessageSquare className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No conversations yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Start your first conversation with the AI assistant</p>
                <Button
                  onClick={createNewSession}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Start New Chat
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`group p-4 rounded-xl cursor-pointer transition-all duration-200 border ${
                      currentSessionId === session.id
                        ? 'bg-primary/20 border-primary/30 shadow-[0_4px_16px_rgba(139,92,246,0.25)]'
                        : 'bg-white/5 hover:bg-primary/10 hover:border-primary/30 border-white/10 hover:translate-x-1'
                    }`}
                    onClick={() => {
                      setCurrentSessionId(session.id);
                      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                        setShowSidebar(false);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-foreground truncate mb-1">
                          {session.title}
                        </h3>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span>{formatDate(session.last_message_at || session.updated_at)}</span>
                          <span>•</span>
                          <span>{session.message_count} messages</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-rose-400 hover:text-rose-400 group-hover:bg-rose-500/15 hover:bg-transparent! bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSessionToDelete(session.id);
                          setConfirmOpen(true);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-transparent">
        {/* Header */}
        <div className="p-5 lg:p-6 border-b border-white/10 bg-slate-900/50 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className="lg:hidden"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  {currentSessionId ? sessions.find(s => s.id === currentSessionId)?.title || 'Chat' : 'AI Assistant'}
                </h1>
                {currentSessionId && (
                  <p className="text-sm text-muted-foreground">
                    {sessions.find(s => s.id === currentSessionId)?.message_count || 0} messages
                  </p>
                )}
              </div>
            </div>
            {/* <div className="flex items-center space-x-2">
              {currentSessionId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={createNewSession}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
              )}
            </div> */}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 lg:p-6 space-y-6 custom-scroll">
          {messages.length === 0 && !isTyping ? (
            <div className="text-center py-6">
              <div className="bg-linear-to-br from-primary/10 to-primary/5 rounded-full p-8 w-fit mx-auto mb-6">
                <Bot className="h-16 w-16 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-3">
                Welcome to AI Knowledge Hub
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed mb-6">
                I&apos;m your AI assistant. Upload your documents and ask me anything - I&apos;ll use your knowledge base to provide helpful, contextual answers.
              </p>
              {/* <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={createNewSession}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Start New Conversation
                </Button>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Upload Documents
                </Button>
              </div> */}
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex max-w-[85%] ${
                    message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <Avatar className="h-9 w-9 shrink-0 ring-2 ring-background rounded-xl">
                    <AvatarImage
                      src={message.type === 'user' ? '/user-avatar.png' : '/bot-avatar.png'}
                    />
                    <AvatarFallback className={message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-cyan-600 text-white'}>
                      {message.type === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`ml-3 mr-3 px-4 py-3 rounded-2xl shadow-sm ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground shadow-[0_4px_16px_rgba(139,92,246,0.3)]'
                        : message.type === 'system'
                        ? 'bg-white/5 text-slate-400 border border-white/10'
                        : 'bg-white/5 text-slate-200 border border-white/10'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    {message.type === 'assistant' && typeof message.documentsUsed === 'number' && message.documentsUsed > 0 && (
                      <div className="mt-3">
                        <Badge variant="secondary" className="text-xs bg-linear-to-r from-rose-500 to-pink-600 text-white shadow">
                          📄 Used {message.documentsUsed} document{message.documentsUsed > 1 ? 's' : ''}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {queueInfo && (
            <div className="flex justify-start">
              <div className="flex items-center text-sm text-slate-300 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
                Server busy. Retrying in {Math.ceil(((queueInfo?.nextRetryMs ?? 0) / 1000))}s...
              </div>
            </div>
          )}

          {isTyping && !queueInfo && (
            <div className="flex justify-start">
              <div className="flex">
                <Avatar className="h-9 w-9 ring-2 ring-background rounded-xl">
                  <AvatarFallback className="bg-cyan-600 text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 shadow-sm">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-5 lg:p-6 border-t border-white/10 bg-slate-900/60 backdrop-blur-xl">
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 min-h-[60px] max-h-[140px] resize-none pr-12 bg-white/5 border border-white/10 text-slate-200 placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                disabled={isTyping}
              />
              <div className="hidden lg:block absolute bottom-2 right-2 text-xs text-muted-foreground">
                Press Enter to send, Shift+Enter for new line
              </div>
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              size="lg"
              className="px-6 bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(139,92,246,0.35)] hover:brightness-110"
            >
              {isTyping ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <Dialog open={confirmOpen} onOpenChange={(open) => {
        setConfirmOpen(open);
        if (!open) setSessionToDelete(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete conversation?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The conversation and its messages will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => sessionToDelete && deleteSession(sessionToDelete)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
