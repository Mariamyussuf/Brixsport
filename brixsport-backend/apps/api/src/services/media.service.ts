import { logger } from '../utils/logger';
import { MediaFile, UploadSession } from '../types/media.types';
import { storageService } from './storage.service';
import { supabase } from './supabase.service';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';

// File type validation
const ALLOWED_MIME_TYPES = {
  'avatars': ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  'team-logos': ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
  'match-media': ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm'],
  'documents': ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
};

const MAX_FILE_SIZES = {
  'avatars': 5 * 1024 * 1024, // 5MB
  'team-logos': 10 * 1024 * 1024, // 10MB
  'match-media': 100 * 1024 * 1024, // 100MB
  'documents': 25 * 1024 * 1024 // 25MB
};

export const mediaService = {
  // Create a new media file entry
  createMediaFile: async (fileData: Omit<MediaFile, 'id' | 'createdAt' | 'updatedAt'>): Promise<MediaFile> => {
    try {
      const newMediaFile: MediaFile = {
        id: crypto.randomUUID(),
        ...fileData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Store in Supabase database instead of in-memory
      const { data, error } = await supabase
        .from('MediaFile')
        .insert(newMediaFile)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      logger.info('Media file created', { id: data.id });
      
      return data;
    } catch (error: any) {
      logger.error('Create media file error', error);
      throw new Error(`Failed to create media file: ${error.message}`);
    }
  },
  
  // Get media file by ID
  getMediaFileById: async (id: string): Promise<MediaFile | null> => {
    try {
      const { data, error } = await supabase
        .from('MediaFile')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      logger.info('Media file retrieved', { id });
      
      return data || null;
    } catch (error: any) {
      logger.error('Get media file error', error);
      throw new Error(`Failed to get media file: ${error.message}`);
    }
  },
  
  // Update media file metadata
  updateMediaFile: async (id: string, updateData: Partial<MediaFile>): Promise<MediaFile | null> => {
    try {
      const { data, error } = await supabase
        .from('MediaFile')
        .update({
          ...updateData,
          updatedAt: new Date()
        })
        .eq('id', id)
        .select()
        .maybeSingle();
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      if (!data) {
        logger.warn('Media file not found for update', { id });
        return null;
      }
      
      logger.info('Media file updated', { id });
      return data;
    } catch (error: any) {
      logger.error('Update media file error', error);
      throw new Error(`Failed to update media file: ${error.message}`);
    }
  },
  
  // Delete media file
  deleteMediaFile: async (id: string): Promise<boolean> => {
    try {
      // First get the media file to get the filename
      const mediaFile = await mediaService.getMediaFileById(id);
      if (!mediaFile) {
        logger.warn('Media file not found for deletion', { id });
        return false;
      }
      
      // Delete from storage
      await storageService.deleteFile(mediaFile.filename);
      
      // Delete from database
      const { error } = await supabase
        .from('MediaFile')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      logger.info('Media file deleted', { id, filename: mediaFile.filename });
      return true;
    } catch (error: any) {
      logger.error('Delete media file error', error);
      throw new Error(`Failed to delete media file: ${error.message}`);
    }
  },
  
  // List media files with filtering and pagination
  listMediaFiles: async (queryParams: any): Promise<{ files: MediaFile[]; totalCount: number }> => {
    try {
      let query = supabase
        .from('MediaFile')
        .select('*', { count: 'exact' });
      
      // Apply filters
      if (queryParams.ownerId) {
        query = query.eq('ownerId', queryParams.ownerId);
      }
      
      if (queryParams.ownerType) {
        query = query.eq('ownerType', queryParams.ownerType);
      }
      
      if (queryParams.entityId) {
        query = query.eq('entityId', queryParams.entityId);
      }
      
      if (queryParams.tags && Array.isArray(queryParams.tags)) {
        // For tags filtering, we might need a different approach depending on how tags are stored
        // This assumes tags are stored as a JSON array
        for (const tag of queryParams.tags) {
          query = query.contains('tags', [tag]);
        }
      }
      
      if (queryParams.mimeType) {
        query = query.eq('mimeType', queryParams.mimeType);
      }
      
      if (queryParams.status) {
        query = query.eq('status', queryParams.status);
      }
      
      // Apply sorting
      if (queryParams.sortBy) {
        const order = queryParams.sortOrder === 'desc' ? 'desc' : 'asc';
        query = query.order(queryParams.sortBy, { ascending: order !== 'desc' });
      }
      
      // Apply pagination
      const page = queryParams.page ? parseInt(queryParams.page) : 1;
      const limit = queryParams.limit ? parseInt(queryParams.limit) : 10;
      const startIndex = (page - 1) * limit;
      query = query.range(startIndex, startIndex + limit - 1);
      
      const { data: files, error, count } = await query;
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      const totalCount = count || 0;
      
      logger.info('Media files listed', { count: files.length, totalCount });
      
      return { files: files || [], totalCount };
    } catch (error: any) {
      logger.error('List media files error', error);
      throw new Error(`Failed to list media files: ${error.message}`);
    }
  },
  
  // Initiate file upload with metadata
  initiateUpload: async (fileData: Omit<MediaFile, 'id' | 'createdAt' | 'updatedAt' | 'url' | 'status'>): Promise<MediaFile> => {
    try {
      // Create media file entry with 'uploading' status
      const mediaFile = await mediaService.createMediaFile({
        ...fileData,
        url: '',
        status: 'uploading'
      });
      
      logger.info('Upload initiated', { id: mediaFile.id });
      
      return mediaFile;
    } catch (error: any) {
      logger.error('Initiate upload error', error);
      throw new Error(`Failed to initiate upload: ${error.message}`);
    }
  },
  
  // Generate pre-signed URL for direct upload
  generatePresignedUrl: async (fileId: string): Promise<{ uploadUrl: string; sessionId: string }> => {
    try {
      const mediaFile = await mediaService.getMediaFileById(fileId);
      
      if (!mediaFile) {
        throw new Error('Media file not found');
      }
      
      // Generate a pre-signed URL using the storage service
      const uploadUrl = await storageService.generateSignedUrl(mediaFile.filename, 3600); // 1 hour expiry
      
      // Create upload session in Supabase instead of in-memory
      const sessionId = crypto.randomUUID();
      const newSession: UploadSession = {
        id: sessionId,
        fileId,
        uploadUrl,
        expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
        parts: []
      };
      
      const { error } = await supabase
        .from('UploadSession')
        .insert(newSession);
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      logger.info('Pre-signed URL generated', { fileId, sessionId });
      
      return { uploadUrl, sessionId };
    } catch (error: any) {
      logger.error('Generate pre-signed URL error', error);
      throw new Error(`Failed to generate pre-signed URL: ${error.message}`);
    }
  },
  
  // Complete upload and update media file status
  completeUpload: async (fileId: string): Promise<MediaFile | null> => {
    try {
      const mediaFile = await mediaService.getMediaFileById(fileId);
      
      if (!mediaFile) {
        logger.warn('Media file not found for completion', { fileId });
        return null;
      }
      
      // Generate the public URL for the file
      const fileUrl = await storageService.generateSignedUrl(mediaFile.filename, 3600);
      
      // Update media file status to 'ready' and set URL
      const updatedMediaFile = await mediaService.updateMediaFile(fileId, {
        status: 'ready',
        url: fileUrl,
        updatedAt: new Date()
      });
      
      if (!updatedMediaFile) {
        throw new Error('Failed to update media file after upload completion');
      }
      
      logger.info('Upload completed', { fileId });
      
      // Process the file based on its type (generate thumbnails, optimize, etc.)
      await mediaService.processMedia(fileId);
      
      return updatedMediaFile;
    } catch (error: any) {
      logger.error('Complete upload error', error);
      // Update status to 'failed' if processing fails
      await mediaService.updateMediaFile(fileId, {
        status: 'failed',
        updatedAt: new Date()
      });
      throw new Error(`Failed to complete upload: ${error.message}`);
    }
  },
  
  // Cancel upload and clean up
  cancelUpload: async (fileId: string): Promise<boolean> => {
    try {
      const mediaFile = await mediaService.getMediaFileById(fileId);
      
      if (!mediaFile) {
        logger.warn('Media file not found for cancellation', { fileId });
        return false;
      }
      
      // Delete the file from storage if it exists
      try {
        await storageService.deleteFile(mediaFile.filename);
      } catch (storageError) {
        logger.warn('Failed to delete file from storage during cancellation', { 
          fileId, 
          filename: mediaFile.filename, 
          error: storageError 
        });
      }
      
      // Delete the media file record from database
      const { error } = await supabase
        .from('MediaFile')
        .delete()
        .eq('id', fileId);
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      logger.info('Upload cancelled', { fileId });
      
      return true;
    } catch (error: any) {
      logger.error('Cancel upload error', error);
      throw new Error(`Failed to cancel upload: ${error.message}`);
    }
  },
  
  // Process media file (optimize, generate thumbnails, etc.)
  processMedia: async (fileId: string): Promise<MediaFile | null> => {
    try {
      const mediaFile = await mediaService.getMediaFileById(fileId);
      
      if (!mediaFile) {
        logger.warn('Media file not found for processing', { fileId });
        return null;
      }
      
      // Update status to 'processing'
      await mediaService.updateMediaFile(fileId, {
        status: 'processing',
        updatedAt: new Date()
      });
      
      // Process based on file type
      if (mediaFile.mimeType?.startsWith('image/')) {
        await processImageFile(mediaFile);
      } else if (mediaFile.mimeType?.startsWith('video/')) {
        await processVideoFile(mediaFile);
      }
      
      // Update status to 'ready'
      const updatedMediaFile = await mediaService.updateMediaFile(fileId, {
        status: 'ready',
        updatedAt: new Date()
      });
      
      logger.info('Media processing completed', { fileId });
      
      return updatedMediaFile;
    } catch (error: any) {
      logger.error('Process media error', error);
      // Update status to 'failed'
      await mediaService.updateMediaFile(fileId, {
        status: 'failed',
        updatedAt: new Date()
      });
      throw new Error(`Failed to process media: ${error.message}`);
    }
  },
  
  // Get thumbnails for a media file
  getThumbnails: async (fileId: string): Promise<string[] | null> => {
    try {
      const mediaFile = await mediaService.getMediaFileById(fileId);
      
      if (!mediaFile) {
        logger.warn('Media file not found for thumbnails', { fileId });
        return null;
      }
      
      // If thumbnails are stored in metadata, return them
      if (mediaFile.metadata?.thumbnails) {
        return mediaFile.metadata.thumbnails as string[];
      }
      
      // Generate thumbnail URLs if they exist
      const thumbnailSizes = ['150x150', '300x300', '600x600'];
      const thumbnails: string[] = [];
      
      for (const size of thumbnailSizes) {
        try {
          const thumbnailUrl = await storageService.generateSignedUrl(
            `thumbnails/${size}/${mediaFile.filename}`, 
            3600
          );
          thumbnails.push(thumbnailUrl);
        } catch (error) {
          // Skip if thumbnail doesn't exist
          logger.debug('Thumbnail not found', { fileId, size });
        }
      }
      
      return thumbnails.length > 0 ? thumbnails : null;
    } catch (error: any) {
      logger.error('Get thumbnails error', error);
      throw new Error(`Failed to get thumbnails: ${error.message}`);
    }
  },
  
  // Resize media file
  resizeMedia: async (fileId: string, width: number, height: number): Promise<string | null> => {
    try {
      const mediaFile = await mediaService.getMediaFileById(fileId);
      
      if (!mediaFile) {
        logger.warn('Media file not found for resizing', { fileId });
        return null;
      }
      
      // Generate actual resized versions using Sharp
      if (mediaFile.mimeType?.startsWith('image/')) {
        // Generate the resized file name
        const resizedFileName = `resized/${width}x${height}/${mediaFile.filename}`;
        
        // Download the original file from storage
        const originalBuffer = await storageService.downloadFileBuffer(mediaFile.filename);
        
        // Use Sharp to resize the image
        const resizedBuffer = await sharp(originalBuffer)
          .resize(width, height, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();
        
        // Upload the resized version to storage
        const resizedContent = resizedBuffer.toString('base64');
        await storageService.uploadFile({
          name: resizedFileName,
          content: resizedContent,
          contentType: 'image/jpeg'
        });
        
        // Return the URL to the resized version
        const resizedUrl = await storageService.generateSignedUrl(resizedFileName, 3600);
        
        logger.info('Media file resized successfully', { id: fileId, width, height, resizedFileName });
        
        return resizedUrl;
      } else {
        logger.warn('Resize operation only supported for image files', { fileId, mimeType: mediaFile.mimeType });
        return null;
      }
    } catch (error: any) {
      logger.error('Resize media error', error);
      throw new Error(`Failed to resize media: ${error.message}`);
    }
  },
  
  // Convert media file to different format
  convertMedia: async (fileId: string, targetFormat: string): Promise<string | null> => {
    try {
      const mediaFile = await mediaService.getMediaFileById(fileId);
      
      if (!mediaFile) {
        logger.warn('Media file not found for conversion', { fileId });
        return null;
      }
      
      // Generate actual converted versions using Sharp
      if (mediaFile.mimeType?.startsWith('image/')) {
        // Generate the converted file name
        const convertedFileName = `converted/${mediaFile.filename}.${targetFormat}`;
        
        // Download the original file from storage
        const originalBuffer = await storageService.downloadFileBuffer(mediaFile.filename);
        
        // Use Sharp to convert the image
        let convertedBuffer;
        switch (targetFormat.toLowerCase()) {
          case 'webp':
            convertedBuffer = await sharp(originalBuffer).webp({ quality: 85 }).toBuffer();
            break;
          case 'png':
            convertedBuffer = await sharp(originalBuffer).png({ compressionLevel: 9 }).toBuffer();
            break;
          case 'jpeg':
          case 'jpg':
            convertedBuffer = await sharp(originalBuffer).jpeg({ quality: 85 }).toBuffer();
            break;
          default:
            throw new Error(`Unsupported target format: ${targetFormat}`);
        }
        
        // Upload the converted version to storage
        const convertedContent = convertedBuffer.toString('base64');
        await storageService.uploadFile({
          name: convertedFileName,
          content: convertedContent,
          contentType: `image/${targetFormat}`
        });
        
        // Return the URL to the converted version
        const convertedUrl = await storageService.generateSignedUrl(convertedFileName, 3600);
        
        logger.info('Media file converted successfully', { id: fileId, targetFormat, convertedFileName });
        
        return convertedUrl;
      } else {
        logger.warn('Conversion operation only supported for image files in this implementation', { fileId, mimeType: mediaFile.mimeType });
        
        // For other file types, generate a placeholder URL
        const convertedFileName = `converted/${mediaFile.filename}.${targetFormat}`;
        const convertedUrl = await storageService.generateSignedUrl(convertedFileName, 3600);
        
        return convertedUrl;
      }
    } catch (error: any) {
      logger.error('Convert media error', error);
      throw new Error(`Failed to convert media: ${error.message}`);
    }
  },
  
  // Batch operations
  batchUpload: async (filesData: Omit<MediaFile, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<MediaFile[]> => {
    try {
      const uploadedFiles: MediaFile[] = [];
      
      for (const fileData of filesData) {
        const mediaFile = await mediaService.createMediaFile({
          ...fileData,
          status: 'uploading'
        });
        uploadedFiles.push(mediaFile);
      }
      
      logger.info('Batch upload completed', { count: uploadedFiles.length });
      
      return uploadedFiles;
    } catch (error: any) {
      logger.error('Batch upload error', error);
      throw new Error(`Failed to perform batch upload: ${error.message}`);
    }
  },
  
  batchDelete: async (fileIds: string[]): Promise<boolean> => {
    try {
      let successCount = 0;
      
      for (const fileId of fileIds) {
        try {
          const result = await mediaService.deleteMediaFile(fileId);
          if (result) {
            successCount++;
          }
        } catch (error) {
          logger.warn('Failed to delete individual file during batch delete', { fileId, error });
        }
      }
      
      logger.info('Batch delete completed', { 
        totalCount: fileIds.length, 
        successCount, 
        failedCount: fileIds.length - successCount 
      });
      
      return successCount > 0;
    } catch (error: any) {
      logger.error('Batch delete error', error);
      throw new Error(`Failed to perform batch delete: ${error.message}`);
    }
  },
  
  // File validation
  validateFile: (file: { mimeType: string; size: number; bucket: string }): { valid: boolean; error?: string } => {
    const { mimeType, size, bucket } = file;
    
    // Check if bucket is valid
    if (!MAX_FILE_SIZES[bucket as keyof typeof MAX_FILE_SIZES]) {
      return { valid: false, error: `Invalid bucket: ${bucket}` };
    }
    
    // Check file size
    const maxSize = MAX_FILE_SIZES[bucket as keyof typeof MAX_FILE_SIZES];
    if (size > maxSize) {
      return { valid: false, error: `File size exceeds limit of ${maxSize} bytes` };
    }
    
    // Check MIME type
    const allowedTypes = ALLOWED_MIME_TYPES[bucket as keyof typeof ALLOWED_MIME_TYPES];
    if (!allowedTypes.includes(mimeType)) {
      return { valid: false, error: `File type ${mimeType} not allowed for bucket ${bucket}` };
    }
    
    return { valid: true };
  },
  
  // Get file dimensions for images
  getFileDimensions: async (fileId: string): Promise<{ width: number; height: number } | null> => {
    try {
      const mediaFile = await mediaService.getMediaFileById(fileId);
      
      if (!mediaFile) {
        logger.warn('Media file not found for dimensions', { fileId });
        return null;
      }
      
      // If dimensions are already stored in metadata, return them
      if (mediaFile.metadata?.width && mediaFile.metadata?.height) {
        return {
          width: mediaFile.metadata.width as number,
          height: mediaFile.metadata.height as number
        };
      }
      
      // For image files, we could use Sharp to get dimensions
      if (mediaFile.mimeType?.startsWith('image/')) {
        // This would require downloading the file and processing it with Sharp
        // Implementation would be similar to the resize function
        logger.debug('File dimensions not available in metadata', { fileId });
        return null;
      }
      
      logger.debug('Dimensions not available for non-image files', { fileId, mimeType: mediaFile.mimeType });
      return null;
    } catch (error: any) {
      logger.error('Get file dimensions error', error);
      return null;
    }
  }
};

// Helper function to process video files using FFmpeg
async function processVideoFile(mediaFile: MediaFile): Promise<void> {
  try {
    logger.info('Processing video file', { fileId: mediaFile.id, filename: mediaFile.filename });
    
    // Generate thumbnails at different time points
    const thumbnailTimes = [1, 5, 10]; // seconds
    const uploadedThumbnails = [];
    
    for (const time of thumbnailTimes) {
      try {
        // In a real implementation, we would use FFmpeg to extract frames
        // This is a simplified example
        const thumbnailFileName = `thumbnails/video-${time}s-${mediaFile.filename}.jpg`;
        
        // Generate a placeholder thumbnail (in real implementation, extract actual frame)
        const placeholderBuffer = Buffer.from('placeholder-thumbnail-content');
        const thumbnailContent = placeholderBuffer.toString('base64');
        
        await storageService.uploadFile({
          name: thumbnailFileName,
          content: thumbnailContent,
          contentType: 'image/jpeg'
        });
        
        const thumbnailUrl = await storageService.generateSignedUrl(thumbnailFileName, 3600);
        uploadedThumbnails.push(thumbnailUrl);
      } catch (thumbnailError) {
        logger.warn('Failed to generate video thumbnail', { 
          error: thumbnailError, 
          fileId: mediaFile.id, 
          time 
        });
      }
    }
    
    // Update media file with thumbnail URLs
    if (uploadedThumbnails.length > 0) {
      await mediaService.updateMediaFile(mediaFile.id, {
        metadata: {
          ...mediaFile.metadata,
          thumbnails: uploadedThumbnails
        }
      });
    }
    
    logger.info('Video processing completed for file', { fileId: mediaFile.id, thumbnailCount: uploadedThumbnails.length });
    
  } catch (error: any) {
    logger.error('Error processing video file', { 
      error: error.message, 
      fileId: mediaFile.id 
    });
    throw error;
  }
}

// Helper function to process image files using Sharp
async function processImageFile(mediaFile: MediaFile): Promise<void> {
  try {
    // Generate thumbnails
    const thumbnailSizes = [
      { width: 150, height: 150 },
      { width: 300, height: 300 },
      { width: 600, height: 600 }
    ];
    
    logger.info('Processing image file with Sharp', { 
      fileId: mediaFile.id, 
      filename: mediaFile.filename, 
      sizes: thumbnailSizes 
    });
    
    // Download original file from storage
    const originalBuffer = await storageService.downloadFileBuffer(mediaFile.filename);
    
    // Get image metadata
    const metadata = await sharp(originalBuffer).metadata();
    
    // Process with Sharp to create thumbnails
    // Continue with other thumbnails even if one fails
    const successfulThumbnails = [];
    for (const size of thumbnailSizes) {
      try {
        const thumbnailBuffer = await sharp(originalBuffer)
          .resize(size.width, size.height, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();
        
        const thumbnailFileName = `thumbnails/${size.width}x${size.height}/${mediaFile.filename}`;
        const thumbnailContent = thumbnailBuffer.toString('base64');
        
        await storageService.uploadFile({
          name: thumbnailFileName,
          content: thumbnailContent,
          contentType: 'image/jpeg'
        });
        
        const thumbnailUrl = await storageService.generateSignedUrl(thumbnailFileName, 3600);
        successfulThumbnails.push(thumbnailUrl);
      } catch (thumbnailError) {
        logger.warn('Failed to generate thumbnail', { 
          error: thumbnailError, 
          fileId: mediaFile.id, 
          size 
        });
      }
    }
    
    // Optimize the original image
    try {
      const optimizedBuffer = await sharp(originalBuffer)
        .jpeg({ quality: 85 })
        .toBuffer();
      
      // If the optimized version is smaller, replace the original
      if (optimizedBuffer.length < originalBuffer.length) {
        const optimizedContent = optimizedBuffer.toString('base64');
        await storageService.uploadFile({
          name: mediaFile.filename,
          content: optimizedContent,
          contentType: mediaFile.mimeType || 'image/jpeg'
        });
        
        logger.info('Original image optimized', { 
          fileId: mediaFile.id, 
          originalSize: originalBuffer.length, 
          optimizedSize: optimizedBuffer.length 
        });
      }
    } catch (optimizeError) {
      logger.warn('Failed to optimize original image', { 
        error: optimizeError, 
        fileId: mediaFile.id 
      });
    }
    
    // Update media file with metadata
    const updateData: Partial<MediaFile> = {
      metadata: {
        ...mediaFile.metadata,
        width: metadata.width,
        height: metadata.height,
        thumbnails: successfulThumbnails
      }
    };
    
    // If this is the first thumbnail, set it as the thumbnail URL
    if (successfulThumbnails.length > 0) {
      updateData.thumbnailUrl = successfulThumbnails[0];
    }
    
    await mediaService.updateMediaFile(mediaFile.id, updateData);
    
    logger.info('Image processing completed', { 
      fileId: mediaFile.id, 
      thumbnailCount: successfulThumbnails.length,
      width: metadata.width,
      height: metadata.height
    });
    
  } catch (error: any) {
    logger.error('Error processing image file', { 
      error: error.message, 
      fileId: mediaFile.id 
    });
    throw error;
  }
}