import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { mediaService } from '../services/media.service';
import { storageService } from '../services/storage.service';
import { cdnService } from '../services/cdn.service';
import { MediaFile } from '../types/media.types';
import { authenticate } from '../middleware/auth.middleware';
import { errorHandlerService } from '../services/error.handler.service';

export const mediaController = {
  // Initiate file upload with metadata
  initiateUpload: async (req: Request, res: Response) => {
    try {
      const fileData = req.body;
      
      // Validate required fields
      if (!fileData.filename || !fileData.originalName || !fileData.mimeType || !fileData.size || 
          !fileData.ownerId || !fileData.ownerType || !fileData.entityId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: filename, originalName, mimeType, size, ownerId, ownerType, entityId'
        });
      }
      
      const mediaFile = await mediaService.initiateUpload(fileData);
      
      return res.status(201).json({
        success: true,
        data: mediaFile
      });
    } catch (error: any) {
      logger.error('Initiate upload error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Generate pre-signed URL for direct upload
  generatePresignedUrl: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'File ID is required'
        });
      }
      
      const result = await mediaService.generatePresignedUrl(id);
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Generate pre-signed URL error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Confirm upload completion
  completeUpload: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'File ID is required'
        });
      }
      
      const mediaFile = await mediaService.completeUpload(id);
      
      if (!mediaFile) {
        return res.status(404).json({
          success: false,
          error: 'Media file not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: mediaFile
      });
    } catch (error: any) {
      logger.error('Complete upload error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Cancel failed uploads
  cancelUpload: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'File ID is required'
        });
      }
      
      const result = await mediaService.cancelUpload(id);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'Media file not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Upload cancelled successfully'
      });
    } catch (error: any) {
      logger.error('Cancel upload error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Get media file details
  getMediaFile: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'File ID is required'
        });
      }
      
      const mediaFile = await mediaService.getMediaFileById(id);
      
      if (!mediaFile) {
        return res.status(404).json({
          success: false,
          error: 'Media file not found'
        });
      }
      
      // If CDN is enabled, use CDN URLs
      const responseFile = { ...mediaFile };
      if (cdnService.isCDNEnabled() && mediaFile.url) {
        responseFile.url = cdnService.generateCDNUrl(mediaFile.url);
      }
      
      return res.status(200).json({
        success: true,
        data: responseFile
      });
    } catch (error: any) {
      logger.error('Get media file error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Download media file
  downloadMediaFile: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'File ID is required'
        });
      }
      
      const mediaFile = await mediaService.getMediaFileById(id);
      
      if (!mediaFile) {
        return res.status(404).json({
          success: false,
          error: 'Media file not found'
        });
      }
      
      // Generate a download URL
      const downloadUrl = await storageService.generateSignedUrl(mediaFile.filename, 3600);
      
      return res.status(200).json({
        success: true,
        data: {
          fileName: mediaFile.originalName,
          url: downloadUrl
        }
      });
    } catch (error: any) {
      logger.error('Download media file error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // List media files with filtering and pagination
  listMediaFiles: async (req: Request, res: Response) => {
    try {
      const queryParams = req.query;
      
      const result = await mediaService.listMediaFiles(queryParams);
      
      // If CDN is enabled, update URLs to use CDN
      if (cdnService.isCDNEnabled()) {
        result.files = result.files.map(file => ({
          ...file,
          url: file.url ? cdnService.generateCDNUrl(file.url) : file.url
        }));
      }
      
      return res.status(200).json({
        success: true,
        data: result.files,
        pagination: {
          totalCount: result.totalCount,
          page: queryParams.page ? parseInt(queryParams.page as string) : 1,
          limit: queryParams.limit ? parseInt(queryParams.limit as string) : 10
        }
      });
    } catch (error: any) {
      logger.error('List media files error', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  },
  
  // Update media metadata
  updateMediaFile: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'File ID is required'
        });
      }
      
      const mediaFile = await mediaService.updateMediaFile(id, updateData);
      
      if (!mediaFile) {
        return res.status(404).json({
          success: false,
          error: 'Media file not found'
        });
      }
      
      // If CDN is enabled, use CDN URL
      const responseFile = { ...mediaFile };
      if (cdnService.isCDNEnabled() && mediaFile.url) {
        responseFile.url = cdnService.generateCDNUrl(mediaFile.url);
      }
      
      return res.status(200).json({
        success: true,
        data: responseFile
      });
    } catch (error: any) {
      logger.error('Update media file error', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  },
  
  // Delete media file
  deleteMediaFile: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'File ID is required'
        });
      }
      
      const result = await mediaService.deleteMediaFile(id);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'Media file not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Media file deleted successfully'
      });
    } catch (error: any) {
      logger.error('Delete media file error', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  },
  
  // Trigger media processing
  processMedia: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'File ID is required'
        });
      }
      
      const mediaFile = await mediaService.processMedia(id);
      
      if (!mediaFile) {
        return res.status(404).json({
          success: false,
          error: 'Media file not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: mediaFile
      });
    } catch (error: any) {
      logger.error('Process media error', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  },
  
  // Get generated thumbnails
  getThumbnails: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'File ID is required'
        });
      }
      
      const thumbnails = await mediaService.getThumbnails(id);
      
      if (!thumbnails) {
        return res.status(404).json({
          success: false,
          error: 'Media file not found'
        });
      }
      
      // If CDN is enabled, use CDN URLs for thumbnails
      let responseThumbnails = thumbnails;
      if (cdnService.isCDNEnabled()) {
        responseThumbnails = thumbnails.map(url => cdnService.generateCDNUrl(url));
      }
      
      return res.status(200).json({
        success: true,
        data: responseThumbnails
      });
    } catch (error: any) {
      logger.error('Get thumbnails error', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  },
  
  // Generate custom resized versions
  resizeMedia: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { width, height } = req.query;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'File ID is required'
        });
      }
      
      if (!width || !height) {
        return res.status(400).json({
          success: false,
          error: 'Width and height are required'
        });
      }
      
      const resizedUrl = await mediaService.resizeMedia(id, parseInt(width as string), parseInt(height as string));
      
      if (!resizedUrl) {
        return res.status(404).json({
          success: false,
          error: 'Media file not found'
        });
      }
      
      // If CDN is enabled, use CDN URL
      const responseUrl = cdnService.isCDNEnabled() ? cdnService.generateCDNUrl(resizedUrl) : resizedUrl;
      
      return res.status(200).json({
        success: true,
        data: { url: responseUrl }
      });
    } catch (error: any) {
      logger.error('Resize media error', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  },
  
  // Convert file format
  convertMedia: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { format } = req.query;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'File ID is required'
        });
      }
      
      if (!format) {
        return res.status(400).json({
          success: false,
          error: 'Target format is required'
        });
      }
      
      const convertedUrl = await mediaService.convertMedia(id, format as string);
      
      if (!convertedUrl) {
        return res.status(404).json({
          success: false,
          error: 'Media file not found'
        });
      }
      
      // If CDN is enabled, use CDN URL
      const responseUrl = cdnService.isCDNEnabled() ? cdnService.generateCDNUrl(convertedUrl) : convertedUrl;
      
      return res.status(200).json({
        success: true,
        data: { url: responseUrl }
      });
    } catch (error: any) {
      logger.error('Convert media error', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  },
  
  // Batch operations
  batchUpload: async (req: Request, res: Response) => {
    try {
      const filesData = req.body.files;
      
      if (!Array.isArray(filesData)) {
        return res.status(400).json({
          success: false,
          error: 'Files data must be an array'
        });
      }
      
      const uploadedFiles = await mediaService.batchUpload(filesData);
      
      return res.status(201).json({
        success: true,
        data: uploadedFiles
      });
    } catch (error: any) {
      logger.error('Batch upload error', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  },
  
  batchDelete: async (req: Request, res: Response) => {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids)) {
        return res.status(400).json({
          success: false,
          error: 'IDs must be an array'
        });
      }
      
      const result = await mediaService.batchDelete(ids);
      
      return res.status(200).json({
        success: true,
        message: result ? 'Files deleted successfully' : 'Some files could not be deleted'
      });
    } catch (error: any) {
      logger.error('Batch delete error', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  },
  
  batchUpdateMetadata: async (req: Request, res: Response) => {
    try {
      const { updates } = req.body;
      
      if (!Array.isArray(updates)) {
        return res.status(400).json({
          success: false,
          error: 'Updates must be an array'
        });
      }
      
      const updatedFiles = [];
      for (const update of updates) {
        const { id, metadata } = update;
        if (id && metadata) {
          const updatedFile = await mediaService.updateMediaFile(id, { metadata });
          if (updatedFile) {
            updatedFiles.push(updatedFile);
          }
        }
      }
      
      return res.status(200).json({
        success: true,
        data: updatedFiles
      });
    } catch (error: any) {
      logger.error('Batch update metadata error', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  },
  
  // Get upload progress
  getUploadProgress: async (req: Request, res: Response) => {
    try {
      const { fileName } = req.params;
      
      if (!fileName) {
        return res.status(400).json({
          success: false,
          error: 'File name is required'
        });
      }
      
      const progress = await storageService.getUploadProgress(fileName);
      
      if (!progress) {
        return res.status(404).json({
          success: false,
          error: 'Upload progress not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: progress
      });
    } catch (error: any) {
      logger.error('Get upload progress error', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  },
  
  // Initiate resumable upload
  initiateResumableUpload: async (req: Request, res: Response) => {
    try {
      const { fileName, fileSize, contentType } = req.body;
      
      if (!fileName || !fileSize || !contentType) {
        return res.status(400).json({
          success: false,
          error: 'File name, file size, and content type are required'
        });
      }
      
      const result = await storageService.initiateResumableUpload(fileName, fileSize, contentType);
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Initiate resumable upload error', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  },
  
  // Upload resumable part
  uploadResumablePart: async (req: Request, res: Response) => {
    try {
      const { uploadId, partNumber, content } = req.body;
      
      if (!uploadId || partNumber === undefined || !content) {
        return res.status(400).json({
          success: false,
          error: 'Upload ID, part number, and content are required'
        });
      }
      
      const result = await storageService.uploadResumablePart(uploadId, partNumber, content);
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Upload resumable part error', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  },
  
  // Complete resumable upload
  completeResumableUpload: async (req: Request, res: Response) => {
    try {
      const { uploadId, parts } = req.body;
      
      if (!uploadId || !Array.isArray(parts)) {
        return res.status(400).json({
          success: false,
          error: 'Upload ID and parts array are required'
        });
      }
      
      const result = await storageService.completeResumableUpload(uploadId, parts);
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Complete resumable upload error', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }
};