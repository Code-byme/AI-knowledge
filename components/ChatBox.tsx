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
  Loader2
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  documentsUsed?: number;
}

interface ChatBoxProps {
  className?: string;
}

export default function ChatBox({ className }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'system',
      content: 'Welcome! I\'m your AI assistant powered by OpenRouter. Upload your documents and ask me anything - I\'ll use your knowledge base to provide helpful, contextual answers.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        body: JSON.stringify({ message: currentInput }),
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="bg-card p-4 rounded-lg mb-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Bot className="h-6 w-6 text-primary" />
              <div>
                <h3 className="font-semibold">AI Assistant</h3>
                <p className="text-sm text-muted-foreground">
                  Ask me anything about your documents - I'll use AI to provide contextual answers
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" title="New Chat">
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Options">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Container - This will scroll */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            {message.type !== 'system' && (
              <Avatar className="h-8 w-8 shrink-0">
                {message.type === 'user' ? (
                  <>
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </>
                ) : (
                  <>
                    <AvatarImage src="/bot-avatar.jpg" />
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
            )}
            
            <div
              className={`max-w-[70%] rounded-lg px-4 py-3 ${
                message.type === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : message.type === 'system'
                  ? 'bg-muted text-muted-foreground text-center text-sm'
                  : 'bg-card border border-border'
              }`}
            >
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs opacity-70">
                  {getRelativeTime(message.timestamp)}
                </span>
                {message.type === 'assistant' && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      AI
                    </Badge>
                    {message.documentsUsed && message.documentsUsed > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {message.documentsUsed} doc{message.documentsUsed !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex items-start space-x-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback>
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="bg-card border border-border rounded-lg px-4 py-3">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="bg-card border border-border rounded-lg p-4 shrink-0">
        <div className="flex items-end space-x-3">
          <Button variant="ghost" size="icon" title="Attach file">
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your question here..."
              className="min-h-[60px] max-h-[120px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              rows={1}
            />
          </div>
          
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            size="icon"
            title="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
