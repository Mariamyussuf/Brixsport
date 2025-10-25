import { supabase } from '@config/supabase.config';
import { logger } from '../utils/logger';
import { DatabaseError } from '../errors/database.error';

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author_id: string;
  slug: string;
  featured_image?: string;
  category?: string;
  tags?: string[];
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateArticleInput {
  title: string;
  excerpt?: string;
  content: string;
  author_id: string;
  slug: string;
  featured_image?: string;
  category?: string;
  tags?: string[];
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
}

export interface UpdateArticleInput {
  title?: string;
  excerpt?: string;
  content?: string;
  featured_image?: string;
  category?: string;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
  published_at?: string;
}

class ContentService {
  /**
   * Get all published articles
   */
  async getArticles(page: number = 1, limit: number = 10, category?: string, tag?: string): Promise<{ articles: Article[]; total: number }> {
    try {
      logger.info('Fetching articles', { page, limit, category, tag });

      let query = supabase
        .from('Article')
        .select('*', { count: 'exact' })
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      if (tag) {
        query = query.contains('tags', [tag]);
      }

      const { data, error, count } = await query
        .range((page - 1) * limit, page * limit - 1);

      if (error) {
        throw new DatabaseError(`Failed to fetch articles: ${error.message}`);
      }

      return {
        articles: data as Article[] || [],
        total: count || 0
      };
    } catch (error) {
      logger.error('Get articles error', { error });
      throw error;
    }
  }

  /**
   * Get a single article by slug
   */
  async getArticleBySlug(slug: string): Promise<Article | null> {
    try {
      logger.info('Fetching article by slug', { slug });

      const { data, error } = await supabase
        .from('Article')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows" error
        throw new DatabaseError(`Failed to fetch article: ${error.message}`);
      }

      return data as Article || null;
    } catch (error) {
      logger.error('Get article by slug error', { error });
      throw error;
    }
  }

  /**
   * Get a single article by ID
   */
  async getArticleById(id: string): Promise<Article | null> {
    try {
      logger.info('Fetching article by ID', { id });

      const { data, error } = await supabase
        .from('Article')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows" error
        throw new DatabaseError(`Failed to fetch article: ${error.message}`);
      }

      return data as Article || null;
    } catch (error) {
      logger.error('Get article by ID error', { error });
      throw error;
    }
  }

  /**
   * Create a new article
   */
  async createArticle(input: CreateArticleInput): Promise<Article> {
    try {
      logger.info('Creating new article', { title: input.title });

      const { data, error } = await supabase
        .from('Article')
        .insert([input])
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to create article: ${error.message}`);
      }

      return data as Article;
    } catch (error) {
      logger.error('Create article error', { error });
      throw error;
    }
  }

  /**
   * Update an existing article
   */
  async updateArticle(id: string, input: UpdateArticleInput): Promise<Article> {
    try {
      logger.info('Updating article', { id });

      const { data, error } = await supabase
        .from('Article')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to update article: ${error.message}`);
      }

      if (!data) {
        throw new DatabaseError('Article not found');
      }

      return data as Article;
    } catch (error) {
      logger.error('Update article error', { error });
      throw error;
    }
  }

  /**
   * Delete an article
   */
  async deleteArticle(id: string): Promise<boolean> {
    try {
      logger.info('Deleting article', { id });

      const { error } = await supabase
        .from('Article')
        .delete()
        .eq('id', id);

      if (error) {
        throw new DatabaseError(`Failed to delete article: ${error.message}`);
      }

      return true;
    } catch (error) {
      logger.error('Delete article error', { error });
      throw error;
    }
  }

  /**
   * Increment view count for an article
   */
  async incrementViewCount(id: string): Promise<void> {
    try {
      logger.info('Incrementing article view count', { id });

      const { error } = await supabase
        .from('Article')
        .update({ view_count: supabase.rpc('increment_view_count', { article_id: id }) })
        .eq('id', id);

      if (error) {
        logger.warn('Failed to increment view count', { error: error.message });
        // Don't throw error as this is non-critical
      }
    } catch (error) {
      logger.warn('Increment view count error', { error });
      // Don't throw error as this is non-critical
    }
  }
}

export default new ContentService();