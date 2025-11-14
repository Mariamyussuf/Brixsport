import { supabase } from '@/lib/supabaseClient';

class FeaturedContentStorageService {
  /**
   * Upload an image file to the featured-content bucket
   * @param file - The file to upload
   * @param fileName - Optional custom file name
   * @returns The URL of the uploaded file
   */
  async uploadImage(file: File, fileName?: string): Promise<string> {
    try {
      // Generate a unique file name if not provided
      const uniqueFileName = fileName || `${Date.now()}_${file.name}`;
      
      // Upload the file to the featured-content bucket
      const { data, error } = await supabase.storage
        .from('featured-content')
        .upload(uniqueFileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Failed to upload image: ${error.message}`);
      }

      // Get the public URL of the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('featured-content')
        .getPublicUrl(uniqueFileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  /**
   * Delete an image file from the featured-content bucket
   * @param fileName - The name of the file to delete
   * @returns Boolean indicating success
   */
  async deleteImage(fileName: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from('featured-content')
        .remove([fileName]);

      if (error) {
        throw new Error(`Failed to delete image: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  /**
   * Get the public URL of an image in the featured-content bucket
   * @param fileName - The name of the file
   * @returns The public URL of the file
   */
  getImageUrl(fileName: string): string {
    const { data } = supabase.storage
      .from('featured-content')
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  /**
   * List all images in the featured-content bucket
   * @returns Array of file objects
   */
  async listImages(): Promise<any[]> {
    try {
      const { data, error } = await supabase.storage
        .from('featured-content')
        .list();

      if (error) {
        throw new Error(`Failed to list images: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error listing images:', error);
      throw error;
    }
  }
}

export default new FeaturedContentStorageService();