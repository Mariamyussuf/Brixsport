'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, User, Tag } from 'lucide-react';

// Types for blog post
interface BlogPost {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  tags: string[];
  readTime: string;
}

// Mock blog data
const mockBlogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Getting Started with Brixsports',
    content: `
      <h2>Introduction</h2>
      <p>Welcome to Brixsports! This guide will help you get started with our sports tracking application.</p>
      
      <h2>Creating Your Account</h2>
      <p>To begin, you'll need to create an account. Click on the "Sign Up" button on the homepage and fill in your details.</p>
      
      <h2>Setting Up Your Profile</h2>
      <p>Once you've created your account, you can set up your profile by adding your favorite teams and competitions.</p>
      
      <h2>Tracking Events</h2>
      <p>Our event tracking feature allows you to log important moments during matches. You can track goals, fouls, substitutions, and more.</p>
      
      <h2>Viewing Analytics</h2>
      <p>Brixsports provides detailed analytics to help you understand team and player performance.</p>
    `,
    author: 'Brixsports Team',
    date: '2025-10-01',
    tags: ['Getting Started', 'Tutorial'],
    readTime: '5 min read'
  },
  {
    id: '2',
    title: 'Advanced Analytics Features',
    content: `
      <h2>Performance Metrics</h2>
      <p>Brixsports offers advanced analytics to help you gain insights into team and player performance.</p>
      
      <h2>Custom Reports</h2>
      <p>Create custom reports tailored to your specific needs and requirements.</p>
      
      <h2>Data Visualization</h2>
      <p>Our visualization tools help you understand complex data through charts and graphs.</p>
    `,
    author: 'Brixsports Team',
    date: '2025-09-28',
    tags: ['Analytics', 'Performance'],
    readTime: '8 min read'
  },
  {
    id: '3',
    title: 'Offline Mode Guide',
    content: `
      <h2>Working Offline</h2>
      <p>Brixsports supports offline mode, allowing you to continue tracking events even without an internet connection.</p>
      
      <h2>Data Sync</h2>
      <p>When you reconnect to the internet, your offline data will automatically sync with our servers.</p>
      
      <h2>Managing Offline Data</h2>
      <p>You can view and manage your offline data through the offline data management section.</p>
    `,
    author: 'Brixsports Team',
    date: '2025-09-25',
    tags: ['Offline', 'Guide'],
    readTime: '6 min read'
  }
];

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  
  const slug = params.slug as string;

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      const foundPost = mockBlogPosts.find(p => p.id === slug);
      setPost(foundPost || null);
      setLoading(false);
    }, 500);
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center space-x-4 mb-8">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => router.back()}
                className="rounded-full"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
            
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="space-y-2 mt-8">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center space-x-4 mb-8">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => router.back()}
                className="rounded-full"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Blog Post Not Found</h1>
            </div>
            
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  The blog post you're looking for could not be found.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => router.push('/blog')}
                >
                  Back to Blog
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => router.back()}
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Blog Post */}
          <article>
            <header className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {post.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>{post.author}</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(post.date).toLocaleDateString()}</span>
                </div>
                
                <Badge variant="secondary">{post.readTime}</Badge>
              </div>
              
              <div className="mt-4 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </header>

            {/* Content */}
            <div 
              className="prose prose-lg dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </article>

          {/* Back to Blog Button */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
            <Button 
              variant="outline" 
              onClick={() => router.push('/blog')}
            >
              ← Back to Blog
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}