import { API_BASE_URL } from '@/lib/apiConfig';
import ErrorHandler from '@/lib/errorHandler';

// Types for blog posts
export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author_id: string;
  author?: string; // This would be populated from the author_id
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

class BlogService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Get all published blog posts
   */
  async getBlogPosts(page: number = 1, limit: number = 10): Promise<BlogPostListResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/content/articles?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform the data to match our frontend BlogPost interface
      const transformedArticles = data.data.articles.map((article: any) => ({
        ...article,
        excerpt: article.excerpt || '',
        author: article.author_id, // In a real implementation, this would be populated from user data
        readTime: this.calculateReadTime(article.content),
        date: article.published_at || article.created_at,
      }));

      return {
        success: true,
        data: {
          articles: transformedArticles,
          pagination: data.data.pagination,
        },
      };
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform the data to match our frontend BlogPost interface
      const transformedArticle = {
        ...data.data,
        excerpt: data.data.excerpt || '',
        author: data.data.author_id, // In a real implementation, this would be populated from user data
        readTime: this.calculateReadTime(data.data.content),
        date: data.data.published_at || data.data.created_at,
      };

      return {
        success: true,
        data: transformedArticle,
      };
    } catch (error) {
      console.error('Error fetching blog post:', error);
      throw ErrorHandler.handle(error);
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
}

export default new BlogService();