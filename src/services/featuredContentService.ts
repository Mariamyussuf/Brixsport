import { supabase } from '@/lib/supabaseClient';
import { FeaturedContent, CreateFeaturedContentInput, UpdateFeaturedContentInput } from '@/types/featuredContent';

class FeaturedContentService {
  /**
   * Get all active featured content items, ordered by priority
   */
  async getActiveFeaturedContent(): Promise<FeaturedContent[]> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('featured_content')
        .select('*')
        .eq('active', true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('priority', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch featured content: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching featured content:', error);
      throw error;
    }
  }

  /**
   * Get all featured content items (admin only)
   */
  async getAllFeaturedContent(): Promise<FeaturedContent[]> {
    try {
      const { data, error } = await supabase
        .from('featured_content')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch all featured content: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching all featured content:', error);
      throw error;
    }
  }

  /**
   * Get a single featured content item by ID
   */
  async getFeaturedContentById(id: string): Promise<FeaturedContent | null> {
    try {
      const { data, error } = await supabase
        .from('featured_content')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw new Error(`Failed to fetch featured content: ${error.message}`);
      }

      return data || null;
    } catch (error) {
      console.error('Error fetching featured content by ID:', error);
      throw error;
    }
  }

  /**
   * Create a new featured content item
   */
  async createFeaturedContent(input: CreateFeaturedContentInput): Promise<FeaturedContent> {
    try {
      const { data, error } = await supabase
        .from('featured_content')
        .insert({
          title: input.title,
          description: input.description,
          image_url: input.image_url || '',
          link: input.link,
          priority: input.priority || 0,
          active: input.active !== undefined ? input.active : true,
          start_date: input.start_date || null,
          end_date: input.end_date || null,
          ab_test_variant: input.ab_test_variant || null
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create featured content: ${error.message}`);
      }

      if (!data) {
        throw new Error('Failed to create featured content: No data returned');
      }

      return data;
    } catch (error) {
      console.error('Error creating featured content:', error);
      throw error;
    }
  }

  /**
   * Update an existing featured content item
   */
  async updateFeaturedContent(id: string, input: UpdateFeaturedContentInput): Promise<FeaturedContent> {
    try {
      const { data, error } = await supabase
        .from('featured_content')
        .update({
          title: input.title,
          description: input.description,
          image_url: input.image_url,
          link: input.link,
          priority: input.priority,
          active: input.active,
          start_date: input.start_date,
          end_date: input.end_date,
          ab_test_variant: input.ab_test_variant,
          view_count: input.view_count,
          click_count: input.click_count,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update featured content: ${error.message}`);
      }

      if (!data) {
        throw new Error('Featured content not found');
      }

      return data;
    } catch (error) {
      console.error('Error updating featured content:', error);
      throw error;
    }
  }

  /**
   * Delete a featured content item
   */
  async deleteFeaturedContent(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('featured_content')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete featured content: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting featured content:', error);
      throw error;
    }
  }

  /**
   * Increment view count for a featured content item
   */
  async incrementViewCount(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('featured_content')
        .update({ view_count: supabase.rpc('featured_content_increment_view_count', { content_id: id }) })
        .eq('id', id);

      if (error) {
        console.warn('Failed to increment view count:', error.message);
      }
    } catch (error) {
      console.warn('Error incrementing view count:', error);
    }
  }

  /**
   * Increment click count for a featured content item
   */
  async incrementClickCount(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('featured_content')
        .update({ click_count: supabase.rpc('featured_content_increment_click_count', { content_id: id }) })
        .eq('id', id);

      if (error) {
        console.warn('Failed to increment click count:', error.message);
      }
    } catch (error) {
      console.warn('Error incrementing click count:', error);
    }
  }
}

export default new FeaturedContentService();