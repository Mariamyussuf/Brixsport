import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { storageService } from '../services/storage.service';
import * as path from 'path';
import * as fs from 'fs';

export const downloadsController = {
  // Serve a file for download
  downloadFile: async (req: Request, res: Response) => {
    try {
      const { fileName } = req.params;
      const { signature, expires } = req.query;
      
      // Sanitize filename to prevent path traversal
      const sanitizedFileName = path.basename(fileName);
      
      // If signature and expires are provided, verify the signed URL
      if (signature && expires) {
        try {
          await storageService.verifySignedUrl(sanitizedFileName, signature as string, expires as string);
          logger.info('Signed URL verified successfully', { fileName: sanitizedFileName });
        } catch (error: any) {
          logger.warn('Signed URL verification failed', { fileName: sanitizedFileName, error: error.message });
          return res.status(403).json({
            error: 'Invalid or expired signed URL',
            message: error.message
          });
        }
      }
      // If no signature is provided, require authentication (handled by middleware)
      
      const downloadsDir = path.join(__dirname, '..', '..', 'downloads');
      const filePath = path.join(downloadsDir, sanitizedFileName);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          error: 'File not found'
        });
      }
      
      // Get file stats for headers
      const stat = fs.statSync(filePath);
      
      // Set headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFileName}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Length', stat.size);
      
      // Stream the file to the response
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
      fileStream.on('error', (error) => {
        logger.error('File stream error', error);
        return res.status(500).json({
          error: 'Failed to download file'
        });
      });
      
      fileStream.on('end', () => {
        logger.info('File downloaded successfully', { fileName: sanitizedFileName });
      });
      
      // Return to satisfy TypeScript
      return;
    } catch (error: any) {
      logger.error('Download file error', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  },
  
  // Generate a signed URL for secure file access
  generateSignedUrl: async (req: Request, res: Response) => {
    try {
      const { fileName } = req.params;
      const { expiresIn } = req.query;
      
      // Sanitize filename to prevent path traversal
      const sanitizedFileName = path.basename(fileName);
      
      // Convert expiresIn to number (default to 1 hour if not provided)
      const expirationTime = expiresIn ? parseInt(expiresIn as string) : 3600;
      
      // Validate expiration time (max 24 hours, min 1 minute)
      if (isNaN(expirationTime) || expirationTime > 86400 || expirationTime < 60) {
        return res.status(400).json({
          error: 'Invalid expiration time. Must be between 60 and 86400 seconds.'
        });
      }
      
      // Generate signed URL
      const signedUrl = await storageService.generateSignedUrl(sanitizedFileName, expirationTime);
      
      return res.status(200).json({
        success: true,
        data: {
          signedUrl,
          expiresAt: new Date(Date.now() + expirationTime * 1000).toISOString()
        }
      });
    } catch (error: any) {
      logger.error('Generate signed URL error', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
};