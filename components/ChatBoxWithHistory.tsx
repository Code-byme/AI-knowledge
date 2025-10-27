'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Plus, 
  MoreVertical, 
  Paperclip, 
  Bot, 
  User,
  Loader2,
  MessageSquare,
  Trash2,
  Edit3,
  FileText
} from 'lucide-react';

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
        const formattedMessages: Message[] = data.messages.map((msg: any) => ({
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
    try {
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat' }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentSessionId(data.session.id);
        setMessages([]);
        loadSessions(); // Refresh sessions list
      }
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const deleteSession = async (sessionId: number) => {
    const sessionTitle = sessions.find(s => s.id === sessionId)?.title || 'this conversation';
    
    if (!confirm(`Are you sure you want to delete "${sessionTitle}"? This action cannot be undone.`)) {
      return;
    }

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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: currentInput,
          sessionId: currentSessionId 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

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
    <div className={`flex h-full bg-background ${className}`}>
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-80 bg-card border-r border-border flex flex-col shadow-sm">
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
          
          <div className="flex-1 overflow-y-auto p-4">
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
                        ? 'bg-primary/10 border-primary/20 shadow-sm'
                        : 'hover:bg-muted/50 border-transparent hover:border-border'
                    }`}
                    onClick={() => setCurrentSessionId(session.id)}
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
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
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
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Header */}
        <div className="p-6 border-b border-border bg-card/50 backdrop-blur-sm">
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
            <div className="flex items-center space-x-2">
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
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && !isTyping ? (
            <div className="text-center py-16">
              <div className="bg-linear-to-br from-primary/10 to-primary/5 rounded-full p-8 w-fit mx-auto mb-6">
                <Bot className="h-16 w-16 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-3">
                Welcome to AI Knowledge Hub
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto text-lg leading-relaxed mb-6">
                I'm your AI assistant powered by OpenRouter. Upload your documents and ask me anything - I'll use your knowledge base to provide helpful, contextual answers.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
              </div>
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
                  <Avatar className="h-9 w-9 shrink-0 ring-2 ring-background">
                    <AvatarImage
                      src={message.type === 'user' ? '/user-avatar.png' : '/bot-avatar.png'}
                    />
                    <AvatarFallback className={message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
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
                        ? 'bg-primary text-primary-foreground'
                        : message.type === 'system'
                        ? 'bg-muted text-muted-foreground border'
                        : 'bg-card text-card-foreground border border-border'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    {message.documentsUsed && message.documentsUsed > 0 && (
                      <div className="mt-3">
                        <Badge variant="secondary" className="text-xs">
                          📄 Used {message.documentsUsed} document{message.documentsUsed > 1 ? 's' : ''}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex">
                <Avatar className="h-9 w-9 ring-2 ring-background">
                  <AvatarFallback className="bg-muted">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3 px-4 py-3 rounded-2xl bg-card border border-border shadow-sm">
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
        <div className="p-6 border-t border-border bg-card/50 backdrop-blur-sm">
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 min-h-[60px] max-h-[120px] resize-none pr-12 border-border focus:ring-2 focus:ring-primary/20 focus:border-primary"
                disabled={isTyping}
              />
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                Press Enter to send, Shift+Enter for new line
              </div>
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm px-6"
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
    </div>
  );
}
