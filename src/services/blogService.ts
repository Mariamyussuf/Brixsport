import { API_BASE_URL } from '@/lib/apiConfig';
import ErrorHandler from '@/lib/errorHandler';

// Types for blog posts
export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author_id: string;
  author?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  slug: string;
  featured_image?: string;
  category?: string;
  tags?: string[];
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  readTime?: string; // Computed field
}

export interface BlogPostListResponse {
  success: boolean;
  data: {
    articles: BlogPost[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface BlogPostResponse {
  success: boolean;
  data: BlogPost;
}

// Cache implementation for blog posts
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class BlogService {
  private baseUrl: string;
  private cache: Map<string, CacheItem<any>> = new Map();
  private defaultCacheTTL: number = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.cleanupCache();
  }

  /**
   * Clean up expired cache entries periodically
   */
  private cleanupCache(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, cacheItem] of this.cache.entries()) {
        if (now - cacheItem.timestamp > cacheItem.ttl) {
          this.cache.delete(key);
        }
      }
    }, 60 * 1000); // Check every minute
  }

  /**
   * Get item from cache
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached) {
      const now = Date.now();
      if (now - cached.timestamp <= cached.ttl) {
        return cached.data;
      } else {
        this.cache.delete(key);
      }
    }
    return null;
  }

  /**
   * Set item in cache
   */
  private setInCache<T>(key: string, data: T, ttl?: number): void {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultCacheTTL
    };
    this.cache.set(key, cacheItem);
  }

  /**
   * Get all published blog posts with filtering and sorting options
   */
  async getBlogPosts(
    page: number = 1, 
    limit: number = 10,
    filters?: {
      category?: string;
      tag?: string;
      search?: string;
      sortBy?: 'date' | 'popularity';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<BlogPostListResponse> {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      // Add filters if provided
      if (filters) {
        if (filters.category) queryParams.append('category', filters.category);
        if (filters.tag) queryParams.append('tag', filters.tag);
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
        if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
      }

      const url = `${this.baseUrl}/v1/content/articles?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform the data to match our frontend BlogPost interface
      const transformedArticles = await Promise.all(
        data.data.articles.map(async (article: any) => {
          // Fetch author details
          const author = await this.getAuthorDetails(article.author_id);
          
          return {
            ...article,
            excerpt: article.excerpt || '',
            author: author,
            readTime: this.calculateReadTime(article.content),
            date: article.published_at || article.created_at,
          };
        })
      );

      const result = {
        success: true,
        data: {
          articles: transformedArticles,
          pagination: data.data.pagination,
        },
      };

      // Cache the result
      this.setInCache(`blog_posts_${queryParams.toString()}`, result);
      
      return result;
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      throw ErrorHandler.handle(error);
    }
  }

  /**
   * Get a single blog post by slug
   */
  async getBlogPostBySlug(slug: string): Promise<BlogPostResponse> {
    try {
      // Check cache first
      const cached = this.getFromCache<BlogPostResponse>(`blog_post_slug_${slug}`);
      if (cached) {
        return cached;
      }

      const response = await fetch(
        `${this.baseUrl}/v1/content/articles/${slug}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Fetch author details
      const author = await this.getAuthorDetails(data.data.author_id);
      
      // Transform the data to match our frontend BlogPost interface
      const transformedArticle = {
        ...data.data,
        excerpt: data.data.excerpt || '',
        author: author,
        readTime: this.calculateReadTime(data.data.content),
        date: data.data.published_at || data.data.created_at,
      };

      const result = {
        success: true,
        data: transformedArticle,
      };

      // Cache the result for 10 minutes
      this.setInCache(`blog_post_slug_${slug}`, result, 10 * 60 * 1000);
      
      return result;
    } catch (error) {
      console.error('Error fetching blog post:', error);
      throw ErrorHandler.handle(error);
    }
  }

  /**
   * Get a single blog post by ID
   */
  async getBlogPostById(id: string): Promise<BlogPostResponse> {
    try {
      // Check cache first
      const cached = this.getFromCache<BlogPostResponse>(`blog_post_id_${id}`);
      if (cached) {
        return cached;
      }

      const response = await fetch(
        `${this.baseUrl}/v1/content/articles/id/${id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Fetch author details
      const author = await this.getAuthorDetails(data.data.author_id);
      
      // Transform the data to match our frontend BlogPost interface
      const transformedArticle = {
        ...data.data,
        excerpt: data.data.excerpt || '',
        author: author,
        readTime: this.calculateReadTime(data.data.content),
        date: data.data.published_at || data.data.created_at,
      };

      const result = {
        success: true,
        data: transformedArticle,
      };

      // Cache the result for 10 minutes
      this.setInCache(`blog_post_id_${id}`, result, 10 * 60 * 1000);
      
      return result;
    } catch (error) {
      console.error('Error fetching blog post by ID:', error);
      throw ErrorHandler.handle(error);
    }
  }

  /**
   * Create a new blog post
   */
  async createBlogPost(blogPostData: Omit<BlogPost, 'id' | 'created_at' | 'updated_at' | 'view_count' | 'author' | 'readTime' | 'date'>): Promise<BlogPostResponse> {
    try {
      // Get authentication token from localStorage or other auth mechanism
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      
      const response = await fetch(
        `${this.baseUrl}/v1/content/articles`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify(blogPostData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Fetch author details
      const author = await this.getAuthorDetails(data.data.author_id);
      
      // Transform the data to match our frontend BlogPost interface
      const transformedArticle = {
        ...data.data,
        excerpt: data.data.excerpt || '',
        author: author,
        readTime: this.calculateReadTime(data.data.content),
        date: data.data.published_at || data.data.created_at,
      };

      // Clear cache for blog posts since we've added a new one
      this.clearBlogPostsCache();

      return {
        success: true,
        data: transformedArticle,
      };
    } catch (error) {
      console.error('Error creating blog post:', error);
      throw ErrorHandler.handle(error);
    }
  }

  /**
   * Update an existing blog post
   */
  async updateBlogPost(id: string, blogPostData: Partial<Omit<BlogPost, 'id' | 'created_at' | 'author' | 'readTime' | 'date'>>): Promise<BlogPostResponse> {
    try {
      // Get authentication token from localStorage or other auth mechanism
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      
      const response = await fetch(
        `${this.baseUrl}/v1/content/articles/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify(blogPostData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Fetch author details
      const author = await this.getAuthorDetails(data.data.author_id);
      
      // Transform the data to match our frontend BlogPost interface
      const transformedArticle = {
        ...data.data,
        excerpt: data.data.excerpt || '',
        author: author,
        readTime: this.calculateReadTime(data.data.content),
        date: data.data.published_at || data.data.created_at,
      };

      // Clear cache since we've updated a post
      this.clearBlogPostsCache();
      this.cache.delete(`blog_post_id_${id}`);
      this.cache.delete(`blog_post_slug_${data.data.slug}`);

      return {
        success: true,
        data: transformedArticle,
      };
    } catch (error) {
      console.error('Error updating blog post:', error);
      throw ErrorHandler.handle(error);
    }
  }

  /**
   * Delete a blog post
   */
  async deleteBlogPost(id: string): Promise<{ success: boolean; message: string }> {
    try {
      // Get authentication token from localStorage or other auth mechanism
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      
      const response = await fetch(
        `${this.baseUrl}/v1/content/articles/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Clear cache since we've deleted a post
      this.clearBlogPostsCache();

      return {
        success: true,
        message: data.message || 'Article deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting blog post:', error);
      throw ErrorHandler.handle(error);
    }
  }

  /**
   * Increment view count for a blog post
   */
  async incrementViewCount(id: string): Promise<{ success: boolean }> {
    try {
      // Call the backend API to increment the view count
      const response = await fetch(
        `${this.baseUrl}/v1/content/articles/${id}/view`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      // Clear cache for this specific post since view count has changed
      this.cache.delete(`blog_post_id_${id}`);
      
      // We would also need to clear any cached lists that might contain this post
      
      return {
        success: true,
      };
    } catch (error) {
      console.error('Error incrementing view count:', error);
      throw ErrorHandler.handle(error);
    }
  }

  /**
   * Fetch author details by author ID
   */
  private async getAuthorDetails(authorId: string): Promise<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
  } | undefined> {
    try {
      // Check cache first
      const cached = this.getFromCache<any>(`author_${authorId}`);
      if (cached) {
        return cached;
      }

      // Get authentication token from localStorage or other auth mechanism
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      
      const response = await fetch(
        `${this.baseUrl}/v1/users/${authorId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
        }
      );

      if (!response.ok) {
        // If we can't fetch author details, we'll just return undefined
        // The author field will remain as the author_id
        return undefined;
      }

      const userData = await response.json();
      
      const author = {
        id: userData.data.id,
        name: userData.data.name,
        email: userData.data.email,
        avatar: userData.data.avatar,
      };

      // Cache the author details for 30 minutes
      this.setInCache(`author_${authorId}`, author, 30 * 60 * 1000);
      
      return author;
    } catch (error) {
      console.error('Error fetching author details:', error);
      // Return undefined if we can't fetch author details
      // This way the UI can handle the case where author info is not available
      return undefined;
    }
  }

  /**
   * Simple read time calculation based on word count
   */
  private calculateReadTime(content: string): string {
    if (!content) return '1 min read';
    
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    
    return `${minutes} min read`;
  }

  /**
   * Clear all blog posts cache entries
   */
  private clearBlogPostsCache(): void {
    // Remove all cache entries that start with 'blog_posts_' or 'blog_post_'
    for (const key of this.cache.keys()) {
      if (key.startsWith('blog_posts_') || key.startsWith('blog_post_')) {
        this.cache.delete(key);
      }
    }
  }
}

export default new BlogService();