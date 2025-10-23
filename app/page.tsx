'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import { 
  Brain, 
  Upload, 
  Zap, 
  Shield, 
  Users, 
  BarChart3,
  Sparkles,
  PlayCircle,
  FileUp,
  MessageCircle,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleGetStarted = () => {
    if (status === 'loading') {
      // Still checking authentication, do nothing
      return;
    }
    
    if (status === 'authenticated' && session?.user?.id) {
      // User is logged in, redirect to dashboard
      router.push('/dashboard');
    } else {
      // User is not logged in, redirect to signup
      router.push('/signup');
    }
  };

  const features = [
    {
      icon: Brain,
      iconColor: 'text-primary',
      title: 'AI-Powered Intelligence',
      description: 'Advanced natural language processing to understand and answer your questions accurately'
    },
    {
      icon: Upload,
      iconColor: 'text-secondary',
      title: 'Multi-Format Support',
      description: 'Upload PDFs, Word docs, text files, and more to build your knowledge base'
    },
    {
      icon: Zap,
      iconColor: 'text-accent',
      title: 'Lightning Fast',
      description: 'Get instant responses with our optimized AI engine and smart caching'
    },
    {
      icon: Shield,
      iconColor: 'text-green-500',
      title: 'Secure & Private',
      description: 'Your data is encrypted and stored securely with enterprise-grade protection'
    },
    {
      icon: Users,
      iconColor: 'text-yellow-500',
      title: 'Team Collaboration',
      description: 'Share knowledge bases with your team and collaborate in real-time'
    },
    {
      icon: BarChart3,
      iconColor: 'text-primary',
      title: 'Analytics & Insights',
      description: 'Track usage patterns and optimize your knowledge base performance'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Upload Your Documents',
      description: 'Drag and drop files or paste text to create your knowledge base',
      icon: FileUp
    },
    {
      number: '02',
      title: 'AI Processing',
      description: 'Our AI analyzes and indexes your content for optimal retrieval',
      icon: Brain
    },
    {
      number: '03',
      title: 'Ask Questions',
      description: 'Chat naturally and get accurate answers from your documents',
      icon: MessageCircle
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="gradient-bg py-24 px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold fade-in-up">
              <span className="gradient-text">Your AI-Powered Knowledge Hub</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto fade-in-up-delay">
              Upload documents, ask questions, and get instant AI-powered answers from your knowledge base
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center fade-in-up-delay">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6" 
                onClick={handleGetStarted}
                disabled={status === 'loading'}
              >
                <Sparkles className="mr-2 h-5 w-5" />
                {status === 'loading' ? 'Loading...' : 'Get Started Free'}
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                <PlayCircle className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <CardContent className="space-y-4">
                  <div className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center ${feature.iconColor}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 px-8 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">Get started in minutes with our simple 3-step process</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto">
                    <step.icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <Badge className="absolute -top-2 -right-2 bg-secondary text-secondary-foreground">
                    {step.number}
                  </Badge>
                </div>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-8 gradient-primary">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Knowledge Management?
          </h2>
          <p className="text-white/90 text-lg mb-8">
            Join thousands of teams using AI Knowledge Hub
          </p>
          <Button 
            size="lg" 
            variant="secondary" 
            className="text-lg px-8 py-6" 
            onClick={handleGetStarted}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Loading...' : 'Start Free Trial'}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Brain className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">AI Knowledge Hub</span>
              </div>
              <p className="text-muted-foreground">
                Transform your documents into an intelligent knowledge base with AI.
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold">Product</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-foreground">Pricing</Link></li>
                <li><Link href="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold">Company</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="#about" className="hover:text-foreground">About</Link></li>
                <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-foreground">Careers</Link></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold">Support</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/help" className="hover:text-foreground">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground">Privacy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 AI Knowledge Hub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}