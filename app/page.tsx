'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Navbar from '@/components/Navbar';
import { 
  Brain, 
  Upload, 
  Zap, 
  Shield, 
  Sparkles,
  PlayCircle,
  FileUp,
  MessageCircle,
  ArrowRight
} from 'lucide-react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

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
      description: 'Upload Word docs, text files, and more to build your knowledge base'
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
      <section className="gradient-bg py-24 px-8 relative overflow-hidden">
        {/* Floating Brain Icon */}
        <div className="absolute top-20 right-20 opacity-10 float">
          <Brain className="h-32 w-32 text-primary" />
        </div>
        <div className="absolute bottom-20 left-20 opacity-10 float" style={{animationDelay: '2s'}}>
          <Brain className="h-24 w-24 text-secondary" />
        </div>
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center space-y-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold fade-in-up">
              <span className="gradient-text">AI Knowledge Hub</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto fade-in-up-delay">
              A full-stack web application that transforms documents into an intelligent knowledge base using AI
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center fade-in-up-delay">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 hover-lift pulse-glow" 
                onClick={handleGetStarted}
                disabled={status === 'loading'}
              >
                <Sparkles className="mr-2 h-5 w-5" />
                {status === 'loading' ? 'Loading...' : 'Get Started Free'}
              </Button>
              <Dialog open={isDemoModalOpen} onOpenChange={setIsDemoModalOpen}>
                {/* <DialogTrigger asChild>
                  <Button variant="outline" size="lg" className="text-lg px-8 py-6 hover-lift">
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Watch Demo
                  </Button>
                </DialogTrigger> */}
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center">AI Knowledge Hub Demo</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    {/* Demo Video - Commented out for now */}
                    {/* 
                    <div className="relative w-full">
                      <div className="relative w-full h-96 rounded-lg overflow-hidden">
                        <iframe
                          width="100%"
                          height="100%"
                          src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
                          title="AI Knowledge Hub Demo"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="rounded-lg"
                        ></iframe>
                      </div>
                    </div>
                    */}
                    
                    {/* Placeholder for now */}
                    <div className="relative w-full h-96 bg-linear-to-br from-slate-900 to-slate-800 rounded-lg border border-slate-700 flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                          <PlayCircle className="h-10 w-10 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-white mb-2">Demo Video Coming Soon</h3>
                          <p className="text-slate-400 max-w-md">
                            We&apos;re preparing an exciting demo video that will showcase all the features of AI Knowledge Hub.
                          </p>
                        </div>
                        <Button 
                          onClick={() => setIsDemoModalOpen(false)}
                          className="mt-4"
                        >
                          Try Live Demo Instead
                        </Button>
                      </div>
                    </div>
                    
                    {/* Alternative: Live Demo Link */}
                    <div className="bg-muted/50 rounded-lg p-6 text-center">
                      <h4 className="text-lg font-semibold mb-2">Experience It Live</h4>
                      <p className="text-muted-foreground mb-4">
                        Don&apos;t wait for the video! Try the full application right now with real functionality.
                      </p>
                      <Button 
                        onClick={() => {
                          setIsDemoModalOpen(false);
                          handleGetStarted();
                        }}
                        size="lg"
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Start Live Demo
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 border-border/50 hover:border-primary/20">
                <CardContent className="space-y-4">
                  <div className={`w-14 h-14 rounded-xl bg-linear-to-br from-muted to-muted/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${feature.iconColor}`}>
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-semibold group-hover:text-primary transition-colors duration-300">{feature.title}</h3>
                  <p className="text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">{feature.description}</p>
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

      {/* Tech Stack Section */}
      <section id="tech-stack" className="py-16 px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built with Modern Technologies</h2>
            <p className="text-muted-foreground text-lg">Leveraging the latest web technologies for optimal performance</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { name: 'Next.js 15', icon: '⚡', description: 'React Framework' },
              { name: 'PostgreSQL', icon: '🗄️', description: 'Database' },
              { name: 'NextAuth.js', icon: '🔐', description: 'Authentication' },
              { name: 'OpenRouter AI', icon: '🤖', description: 'AI Integration' }
            ].map((tech, index) => (
              <div key={index} className="text-center space-y-3 group hover:scale-105 transition-transform duration-300 hover-lift">
                <div className="text-5xl group-hover:scale-110 transition-transform duration-300 group-hover:rotate-12">{tech.icon}</div>
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors duration-300">{tech.name}</h3>
                <p className="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">{tech.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Project Stats */}
      <section className="py-16 px-8 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="group hover:scale-105 transition-transform duration-300">
              <div className="text-4xl font-bold text-primary group-hover:text-primary/80 transition-colors">100%</div>
              <div className="text-muted-foreground">Free to Use</div>
            </div>
            <div className="group hover:scale-105 transition-transform duration-300">
              <div className="text-4xl font-bold text-primary group-hover:text-primary/80 transition-colors">Unlimited</div>
              <div className="text-muted-foreground">Document Uploads</div>
            </div>
            <div className="group hover:scale-105 transition-transform duration-300">
              <div className="text-4xl font-bold text-primary group-hover:text-primary/80 transition-colors">Real-time</div>
              <div className="text-muted-foreground">AI Responses</div>
            </div>
            <div className="group hover:scale-105 transition-transform duration-300">
              <div className="text-4xl font-bold text-primary group-hover:text-primary/80 transition-colors">Secure</div>
              <div className="text-muted-foreground">Data Storage</div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Demo Section */}
      <section id="demo" className="py-16 px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">See It In Action</h2>
            <p className="text-muted-foreground text-lg">Experience the power of AI-driven document analysis</p>
          </div>
          
          <div className="bg-background rounded-2xl p-8 shadow-2xl border border-border/50 hover:shadow-3xl hover:scale-105 transition-all duration-500 hover-lift">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-muted-foreground ml-2">AI Knowledge Hub</span>
                </div>
                <h3 className="text-xl font-semibold">Upload & Process</h3>
                <p className="text-muted-foreground">Drag and drop your documents to start building your knowledge base</p>
                <div className="bg-linear-to-br from-muted to-muted/50 rounded-xl p-6 text-center border-2 border-dashed border-border hover:border-primary/50 transition-colors duration-300">
                  <FileUp className="h-12 w-12 mx-auto text-muted-foreground mb-3 group-hover:text-primary transition-colors" />
                  <p className="text-sm text-muted-foreground">Drop files here or click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">Supports DOCX, TXT, JSON, CSV, MD</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-muted-foreground ml-2">Chat Interface</span>
                </div>
                <h3 className="text-xl font-semibold">Ask & Get Answers</h3>
                <p className="text-muted-foreground">Chat naturally and get accurate answers from your documents</p>
                <div className="bg-muted rounded-xl p-4 space-y-3">
                  <div className="bg-primary text-primary-foreground rounded-lg p-3 text-sm ml-4">
                    What are the main points in my document?
                  </div>
                  <div className="bg-muted-foreground text-background rounded-lg p-3 text-sm mr-4">
                    Based on your document, the main points are:
                    <br />• Point 1: Key insight from your content
                    <br />• Point 2: Another important finding
                    <br />• Point 3: Additional relevant information
                  </div>
                </div>
              </div>
            </div>
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
                A portfolio project showcasing full-stack development with AI integration.
              </p>
              <div className="flex space-x-4">
                <a href="https://github.com/Code-byme/AI-knowledge" target="_blank" className="text-muted-foreground hover:text-foreground transition-colors">
                  GitHub
                </a>
                <a href="https://www.linkedin.com/in/amine-fadili-940357132/" target="_blank" className="text-muted-foreground hover:text-foreground transition-colors">
                  LinkedIn
                </a>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold">Project</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</Link></li>
                <li><Link href="/dashboard" className="hover:text-foreground transition-colors">Live Demo</Link></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold">Technologies</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><span className="hover:text-foreground transition-colors">Next.js 15</span></li>
                <li><span className="hover:text-foreground transition-colors">PostgreSQL</span></li>
                <li><span className="hover:text-foreground transition-colors">NextAuth.js</span></li>
                <li><span className="hover:text-foreground transition-colors">OpenRouter AI</span></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold">Connect</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="https://github.com/Code-byme/AI-knowledge" target="_blank" className="hover:text-foreground transition-colors">GitHub Repository</a></li>
                <li><a href="https://www.linkedin.com/in/amine-fadili-940357132/" target="_blank" className="hover:text-foreground transition-colors">LinkedIn Profile</a></li>
                <li><a href="mailto:aminefadili.cg@gmail.com" className="hover:text-foreground transition-colors">Contact Me</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2025 AI Knowledge Hub - Portfolio Project by Amine Fadili</p>
            <p className="text-sm mt-2">Built with ❤️ using Next.js, PostgreSQL, and AI</p>
          </div>
        </div>
      </footer>
    </div>
  );
}