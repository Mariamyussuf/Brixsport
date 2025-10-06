import { logger } from '../utils/logger';
import { MediaFile, UploadSession } from '../types/media.types';
import { storageService } from './storage.service';
import { supabase } from './supabase.service';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';

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
      // Get the file first to get the filename for storage deletion
      const mediaFile = await mediaService.getMediaFileById(id);
      
      if (!mediaFile) {
        logger.warn('Media file not found for deletion', { id });
        return false;
      }
      
      // Delete the actual file from storage
      const fileName = mediaFile.filename;
      await storageService.deleteFile(fileName);
      
      // Remove from Supabase database
      const { error } = await supabase
        .from('MediaFile')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      logger.info('Media file deleted', { id });
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
  
  // Confirm upload completion
  completeUpload: async (fileId: string): Promise<MediaFile | null> => {
    try {
      // Update media file status to 'ready'
      const updatedFile = await mediaService.updateMediaFile(fileId, {
        status: 'ready',
        url: `/api/v1/media/${fileId}`, // Placeholder URL
        updatedAt: new Date()
      });
      
      // Clean up upload sessions from Supabase
      const { error } = await supabase
        .from('UploadSession')
        .delete()
        .eq('fileId', fileId);
      
      if (error) {
        logger.warn('Failed to clean up upload sessions', { error: error.message });
      }
      
      logger.info('Upload completed', { fileId });
      
      return updatedFile;
    } catch (error: any) {
      logger.error('Complete upload error', error);
      throw new Error(`Failed to complete upload: ${error.message}`);
    }
  },
  
  // Cancel failed uploads
  cancelUpload: async (fileId: string): Promise<boolean> => {
    try {
      // Delete the media file entry
      const result = await mediaService.deleteMediaFile(fileId);
      
      // Clean up upload sessions from Supabase
      const { error } = await supabase
        .from('UploadSession')
        .delete()
        .eq('fileId', fileId);
      
      if (error) {
        logger.warn('Failed to clean up upload sessions', { error: error.message });
      }
      
      logger.info('Upload cancelled', { fileId });
      
      return result;
    } catch (error: any) {
      logger.error('Cancel upload error', error);
      throw new Error(`Failed to cancel upload: ${error.message}`);
    }
  },
  
  // Download media file
  downloadMediaFile: async (id: string): Promise<{ fileName: string; url: string } | null> => {
    try {
      const mediaFile = await mediaService.getMediaFileById(id);
      
      if (!mediaFile) {
        logger.warn('Media file not found for download', { id });
        return null;
      }
      
      // Generate a signed URL for download
      const downloadUrl = await storageService.generateSignedUrl(mediaFile.filename, 3600); // 1 hour expiry
      
      logger.info('Media file download URL generated', { id });
      
      return {
        fileName: mediaFile.filename,
        url: downloadUrl
      };
    } catch (error: any) {
      logger.error('Download media file error', error);
      throw new Error(`Failed to generate download URL: ${error.message}`);
    }
  },
  
  // Trigger media processing
  processMedia: async (id: string): Promise<MediaFile | null> => {
    try {
      // Get the media file
      const mediaFile = await mediaService.getMediaFileById(id);
      
      if (!mediaFile) {
        logger.warn('Media file not found for processing', { id });
        return null;
      }
      
      // Update status to 'processing'
      const updatedFile = await mediaService.updateMediaFile(id, {
        status: 'processing',
        updatedAt: new Date()
      });
      
      if (!updatedFile) {
        logger.warn('Media file not found for processing', { id });
        return null;
      }
      
      // Process based on media type
      if (mediaFile.mimeType?.startsWith('image/')) {
        // Process image files with Sharp
        await processImageFile(mediaFile);
      } else if (mediaFile.mimeType?.startsWith('video/')) {
        // Process video files with FFmpeg
        await processVideoFile(mediaFile);
      } else {
        // For other file types, no special processing needed
        logger.info('No special processing needed for file type', { mimeType: mediaFile.mimeType });
      }
      
      // Update status to 'ready' after processing
      const processedFile = await mediaService.updateMediaFile(id, {
        status: 'ready',
        updatedAt: new Date()
      });
      
      logger.info('Media file processed', { id });
      
      return processedFile;
    } catch (error: any) {
      logger.error('Process media error', error);
      // Update status to 'failed' on error
      await mediaService.updateMediaFile(id, {
        status: 'failed',
        updatedAt: new Date()
      });
      throw new Error(`Failed to process media: ${error.message}`);
    }
  },
  
  // Get generated thumbnails
  getThumbnails: async (id: string): Promise<string[] | null> => {
    try {
      const mediaFile = await mediaService.getMediaFileById(id);
      
      if (!mediaFile) {
        logger.warn('Media file not found for thumbnails', { id });
        return null;
      }
      
      // Return URLs for generated thumbnails
      const thumbnailSizes = [
        { width: 150, height: 150 },
        { width: 300, height: 300 },
        { width: 600, height: 600 }
      ];
      
      const thumbnails = [];
      
      // Generate thumbnail URLs if the file is an image
      if (mediaFile.mimeType?.startsWith('image/')) {
        for (const size of thumbnailSizes) {
          const thumbnailFileName = `thumbnails/${size.width}x${size.height}/${mediaFile.filename}`;
          // Check if the thumbnail exists
          const thumbnailExists = await storageService.fileExists(thumbnailFileName);
          if (thumbnailExists) {
            const thumbnailUrl = await storageService.generateSignedUrl(thumbnailFileName, 3600);
            thumbnails.push(thumbnailUrl);
          }
        }
      }
      
      logger.info('Thumbnails retrieved', { id, count: thumbnails.length });
      
      return thumbnails;
    } catch (error: any) {
      logger.error('Get thumbnails error', error);
      throw new Error(`Failed to get thumbnails: ${error.message}`);
    }
  },
  
  // Generate custom resized versions
  resizeMedia: async (id: string, width: number, height: number): Promise<string | null> => {
    try {
      const mediaFile = await mediaService.getMediaFileById(id);
      
      if (!mediaFile) {
        logger.warn('Media file not found for resize', { id });
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
        
        logger.info('Media file resized successfully', { id, width, height, resizedFileName });
        
        return resizedUrl;
      } else {
        logger.warn('Resize operation only supported for image files', { id, mimeType: mediaFile.mimeType });
        return null;
      }
    } catch (error: any) {
      logger.error('Resize media error', error);
      throw new Error(`Failed to resize media: ${error.message}`);
    }
  },
  
  // Convert file format
  convertMedia: async (id: string, targetFormat: string): Promise<string | null> => {
    try {
      const mediaFile = await mediaService.getMediaFileById(id);
      
      if (!mediaFile) {
        logger.warn('Media file not found for conversion', { id });
        return null;
      }
      
      // Convert the actual file using Sharp for images
      if (mediaFile.mimeType?.startsWith('image/')) {
        // Generate the converted file name
        const fileExtension = mediaFile.filename.split('.').pop() || '';
        const convertedFileName = `converted/${mediaFile.filename.replace(`.${fileExtension}`, `.${targetFormat}`)}`;
        
        // Download the original file from storage
        const originalBuffer = await storageService.downloadFileBuffer(mediaFile.filename);
        
        // Use Sharp to convert the image format
        let sharpInstance = sharp(originalBuffer);
        
        // Apply format-specific options
        switch (targetFormat.toLowerCase()) {
          case 'jpeg':
          case 'jpg':
            sharpInstance = sharpInstance.jpeg({ quality: 85 });
            break;
          case 'png':
            sharpInstance = sharpInstance.png({ compressionLevel: 6 });
            break;
          case 'webp':
            sharpInstance = sharpInstance.webp({ quality: 80 });
            break;
          case 'avif':
            sharpInstance = sharpInstance.avif({ quality: 80 });
            break;
          default:
            throw new Error(`Unsupported format: ${targetFormat}`);
        }
        
        const convertedBuffer = await sharpInstance.toBuffer();
        
        // Upload the converted version to storage
        const convertedContent = convertedBuffer.toString('base64');
        await storageService.uploadFile({
          name: convertedFileName,
          content: convertedContent,
          contentType: `image/${targetFormat}`
        });
        
        // Return the URL to the converted version
        const convertedUrl = await storageService.generateSignedUrl(convertedFileName, 3600);
        
        logger.info('Media file converted successfully', { id, targetFormat, convertedFileName });
        
        return convertedUrl;
      } else {
        logger.warn('Conversion operation only supported for image files in this implementation', { id, mimeType: mediaFile.mimeType });
        
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
        const result = await mediaService.deleteMediaFile(fileId);
        if (result) successCount++;
      }
      
      logger.info('Batch delete completed', { requested: fileIds.length, deleted: successCount });
      
      return successCount === fileIds.length;
    } catch (error: any) {
      logger.error('Batch delete error', error);
      throw new Error(`Failed to perform batch delete: ${error.message}`);
    }
  },
  
  batchUpdateMetadata: async (updates: { id: string; metadata: Partial<MediaFile> }[]): Promise<MediaFile[]> => {
    try {
      const updatedFiles: MediaFile[] = [];
      
      for (const update of updates) {
        const updatedFile = await mediaService.updateMediaFile(update.id, update.metadata);
        if (updatedFile) updatedFiles.push(updatedFile);
      }
      
      logger.info('Batch metadata update completed', { count: updatedFiles.length });
      
      return updatedFiles;
    } catch (error: any) {
      logger.error('Batch metadata update error', error);
      throw new Error(`Failed to perform batch metadata update: ${error.message}`);
    }
  }
};

// Helper function to process video files using FFmpeg
async function processVideoFile(mediaFile: MediaFile): Promise<void> {
  try {
    logger.info('Processing video file with FFmpeg', { 
      fileId: mediaFile.id, 
      filename: mediaFile.filename 
    });
    
    // Ensure temp directory exists
    const tempDir = path.join(__dirname, '..', '..', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Download the original video file from storage
    const originalBuffer = await storageService.downloadFileBuffer(mediaFile.filename);
    const originalFilePath = path.join(tempDir, `original_${mediaFile.id}_${mediaFile.filename}`);
    fs.writeFileSync(originalFilePath, originalBuffer);
    
    // Generate thumbnails using FFmpeg
    // Continue with other thumbnails even if one fails
    const thumbnailPromises: Promise<string | null>[] = [];
    for (let i = 1; i <= 3; i++) {
      thumbnailPromises.push(new Promise((resolve, reject) => {
        const thumbnailPath = path.join(tempDir, `thumbnail_${i}_${mediaFile.id}.jpg`);
        ffmpeg(originalFilePath)
          .screenshots({
            count: 1,
            folder: tempDir,
            filename: `thumbnail_${i}_${mediaFile.id}.jpg`,
            timestamps: [i * 10], // Take screenshot at 10s, 20s, 30s
            size: '320x240'
          })
          .on('end', () => {
            resolve(thumbnailPath);
          })
          .on('error', (err) => {
            logger.error('Error generating video thumbnail', { 
              error: err.message, 
              fileId: mediaFile.id,
              timestamp: i * 10
            });
            // Resolve with null to indicate failure but continue with other thumbnails
            resolve(null);
          });
      }));
    }
    
    // Wait for all thumbnails to be generated
    const thumbnailResults = await Promise.all(thumbnailPromises);
    // Filter out failed thumbnails (null values)
    const thumbnailPaths = thumbnailResults.filter((path): path is string => path !== null);
    
    // Upload thumbnails to storage
    // Continue with other thumbnails even if one fails
    const uploadedThumbnails = [];
    for (let i = 0; i < thumbnailPaths.length; i++) {
      try {
        const thumbnailPath = thumbnailPaths[i];
        if (fs.existsSync(thumbnailPath)) {
          const thumbnailBuffer = fs.readFileSync(thumbnailPath);
          const thumbnailFileName = `thumbnails/video_${i + 1}/${mediaFile.filename}.jpg`;
          const thumbnailContent = thumbnailBuffer.toString('base64');
          await storageService.uploadFile({
            name: thumbnailFileName,
            content: thumbnailContent,
            contentType: 'image/jpeg'
          });
          uploadedThumbnails.push(thumbnailFileName);
          
          // Clean up temp thumbnail file
          fs.unlinkSync(thumbnailPath);
          logger.info('Video thumbnail uploaded successfully', { 
            fileId: mediaFile.id,
            thumbnail: thumbnailFileName
          });
        }
      } catch (uploadError: any) {
        logger.error('Error uploading video thumbnail', { 
          error: uploadError.message, 
          fileId: mediaFile.id,
          index: i
        });
        // Continue with other thumbnails even if one fails
      }
    }
    
    // Clean up temp original file
    fs.unlinkSync(originalFilePath);
    
    // Update database with video metadata
    // Only update if we have successfully uploaded thumbnails
    if (uploadedThumbnails.length > 0) {
      await mediaService.updateMediaFile(mediaFile.id, {
        thumbnailUrl: uploadedThumbnails[0]
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
    
    // Process with Sharp to create thumbnails
    // Continue with other thumbnails even if one fails
    const successfulThumbnails = [];
    for (const size of thumbnailSizes) {
      try {
        const thumbnailBuffer = await sharp(originalBuffer)
          .resize(size.width, size.height, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();
        
        const thumbnailFileName = `thumbnails/${size.width}x${size.height}/${mediaFile.filename}`;
        
        // Convert buffer to base64 string for storage service
        const thumbnailContent = thumbnailBuffer.toString('base64');
        await storageService.uploadFile({
          name: thumbnailFileName,
          content: thumbnailContent,
          contentType: 'image/jpeg'
        });
        
        successfulThumbnails.push({ size, fileName: thumbnailFileName });
        logger.info('Thumbnail created successfully', { 
          fileId: mediaFile.id,
          size: `${size.width}x${size.height}`
        });
      } catch (sharpError: any) {
        logger.error('Error creating thumbnail', { 
          error: sharpError.message, 
          fileId: mediaFile.id,
          size: `${size.width}x${size.height}`
        });
        // Continue with other thumbnails even if one fails
      }
    }
    
    // Update database with thumbnail information (using the first successful thumbnail as the main thumbnail)
    if (successfulThumbnails.length > 0) {
      const firstSuccessful = successfulThumbnails[0];
      await mediaService.updateMediaFile(mediaFile.id, {
        thumbnailUrl: firstSuccessful.fileName
      });
    }
    
    logger.info('Thumbnail generation completed for file', { fileId: mediaFile.id });
    
  } catch (error: any) {
    logger.error('Error processing image file', { 
      error: error.message, 
      fileId: mediaFile.id 
    });
    throw error;
  }
}