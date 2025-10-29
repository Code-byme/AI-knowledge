'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { 
  Brain, 
  User, 
  LogOut, 
  Menu,
  MessageSquare,
  FileText,
  BarChart3,
  Sparkles
} from 'lucide-react';

export default function Navbar() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const user = session?.user;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleSmoothScroll = (href: string) => {
    if (href.startsWith('#')) {
      // Check if we're on the home page
      if (window.location.pathname === '/') {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        // If not on home page, navigate to home page with hash
        router.push(`/${href}`);
      }
    }
  };

  const navigationItems = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Tech Stack', href: '#tech-stack' },
    { label: 'Demo', href: '#demo' },
  ];

  const sidebarItems = [
    { label: 'Chat', icon: MessageSquare, href: '/dashboard', active: true },
    { label: 'Documents', icon: FileText, href: '/dashboard', active: false },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className=" mx-auto px-5">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold gradient-text">
                AI Knowledge Hub
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {!isAuthenticated && (
            <div className="hidden md:flex items-center space-x-8">
              {navigationItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleSmoothScroll(item.href)}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Button variant="outline" asChild>
                  <Link href="/dashboard">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.image || undefined} alt={user?.name || 'User'} />
                        <AvatarFallback>
                          {user?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        {user?.name && (
                          <p className="font-medium">{user.name}</p>
                        )}
                        {user?.email && (
                          <p className="w-[200px] truncate text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => signOut()}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Get Started
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex flex-col space-y-4">
                  {isAuthenticated ? (
                    <>
                      {/* User Profile Section */}
                      <Link
                        href="/profile"
                        className="flex items-center space-x-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user?.image || undefined} alt={user?.name || 'User'} />
                          <AvatarFallback>
                            {user?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <p className="text-sm font-medium">{user?.name || 'User'}</p>
                          <p className="text-xs text-muted-foreground">{user?.email}</p>
                        </div>
                      </Link>

                      {/* Mobile Dashboard Navigation */}
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Dashboard</h3>
                        {sidebarItems.map((item) => (
                          <Link
                            key={item.label}
                            href={item.href}
                            className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                              item.active
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                            }`}
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </Link>
                        ))}
                      </div>
                      
                      {/* Logout Button */}
                      <div className="pt-4">
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            signOut();
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {navigationItems.map((item) => (
                        <button
                          key={item.label}
                          onClick={() => {
                            handleSmoothScroll(item.href);
                            setIsMobileMenuOpen(false);
                          }}
                          className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full text-left cursor-pointer"
                        >
                          {item.label}
                        </button>
                      ))}
                      <div className="pt-4 space-y-2">
                        <Button variant="ghost" asChild className="w-full justify-start">
                          <Link href="/login">Login</Link>
                        </Button>
                        <Button asChild className="w-full">
                          <Link href="/signup">
                            <Sparkles className="mr-2 h-4 w-4" />
                            Get Started
                          </Link>
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
