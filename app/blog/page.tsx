'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, User, Tag } from 'lucide-react';
import blogService, { BlogPost } from '@/services/blogService';
import ErrorHandler, { StandardizedError } from '@/lib/errorHandler';

// Simple loading skeleton component
const LoadingSkeleton = () => (
  <Card className="overflow-hidden">
    <CardHeader className="pb-3">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
    </CardHeader>
    <CardContent>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
      <div className="flex items-center justify-between">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
      </div>
    </CardContent>
  </Card>
);

export default function BlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await blogService.getBlogPosts(1, 12);
        
        if (response.success) {
          setPosts(response.data.articles);
        } else {
          setError('Failed to load blog posts');
        }
      } catch (err) {
        const standardizedError = ErrorHandler.handle(err);
        setError(standardizedError.message);
        console.error('Error fetching blog posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPosts();
  }, []);

  const handlePostClick = (slug: string) => {
    router.push(`/blog/${slug}`);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-red-500 dark:text-red-400">
              {error}
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => router.back()}
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Brixsports Blog</h1>
          </div>
        </div>

        {/* Description */}
        <div className="mb-8 max-w-3xl">
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Stay updated with the latest news, tips, and insights from the Brixsports team.
          </p>
        </div>

        {/* Blog Posts */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, index) => (
              <LoadingSkeleton key={index} />
            ))
          ) : (
            // Actual blog posts
            posts.map((post) => (
              <Card 
                key={post.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handlePostClick(post.slug)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl line-clamp-2">{post.title}</CardTitle>
                  <CardDescription className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <User className="h-4 w-4" />
                      <span>{post.author || 'Brixsports Team'}</span>
                    </div>
                    <Badge variant="secondary">{post.readTime || '5 min read'}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {post.tags?.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Empty state */}
        {!loading && posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No blog posts available at the moment. Check back later!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}