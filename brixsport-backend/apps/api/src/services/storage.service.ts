import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// In a production environment, you would use a cloud storage service like AWS S3, Google Cloud Storage, or Azure Blob Storage
// For this implementation, we'll use the local filesystem with a simulated approach

// Ensure downloads directory exists
const ensureDownloadsDir = () => {
  const downloadsDir = path.join(__dirname, '..', '..', 'downloads');
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }
  return downloadsDir;
};

export const storageService = {
  // Upload a file and return a download URL
  uploadFile: async (fileData: { name: string; content: string; contentType: string }) => {
    try {
      logger.info('Uploading file', { fileName: fileData.name, contentType: fileData.contentType });
      
      // Ensure downloads directory exists
      const downloadsDir = ensureDownloadsDir();
      
      // Sanitize filename to prevent path traversal
      const sanitizedFileName = path.basename(fileData.name);
      
      // Write the file to the downloads directory
      const filePath = path.join(downloadsDir, sanitizedFileName);
      fs.writeFileSync(filePath, fileData.content, 'utf8');
      
      // Generate a URL
      const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
      const fileUrl = `${baseUrl}/api/v1/downloads/files/${sanitizedFileName}`;
      
      logger.info('File uploaded successfully', { fileName: sanitizedFileName, url: fileUrl });
      
      return fileUrl;
    } catch (error: any) {
      logger.error('File upload error', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  },
  
  // Generate a signed URL for secure file access (valid for a limited time)
  generateSignedUrl: async (fileName: string, expiresIn: number = 3600) => {
    try {
      logger.info('Generating signed URL', { fileName, expiresIn });
      
      // Sanitize filename to prevent path traversal
      const sanitizedFileName = path.basename(fileName);
      
      // Generate expiration timestamp
      const expiresAt = Date.now() + (expiresIn * 1000);
      
      // Create a signature using a secret key (in production, use a secure secret)
      const secret = process.env.DOWNLOAD_SECRET || 'default-secret-key';
      const signature = crypto
        .createHmac('sha256', secret)
        .update(`${sanitizedFileName}:${expiresAt}`)
        .digest('hex');
      
      // Generate the signed URL
      const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
      const signedUrl = `${baseUrl}/api/v1/downloads/files/${sanitizedFileName}?signature=${signature}&expires=${expiresAt}`;
      
      logger.info('Signed URL generated', { fileName: sanitizedFileName, url: signedUrl });
      
      return signedUrl;
    } catch (error: any) {
      logger.error('Signed URL generation error', error);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  },
  
  // Verify a signed URL
  verifySignedUrl: async (fileName: string, signature: string, expires: string) => {
    try {
      logger.info('Verifying signed URL', { fileName });
      
      // Check if URL has expired
      const expiresAt = parseInt(expires);
      if (Date.now() > expiresAt) {
        throw new Error('Signed URL has expired');
      }
      
      // Sanitize filename to prevent path traversal
      const sanitizedFileName = path.basename(fileName);
      
      // Recreate the signature using the same method
      const secret = process.env.DOWNLOAD_SECRET || 'default-secret-key';
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${sanitizedFileName}:${expiresAt}`)
        .digest('hex');
      
      // Compare signatures
      if (signature !== expectedSignature) {
        throw new Error('Invalid signature');
      }
      
      return true;
    } catch (error: any) {
      logger.error('Signed URL verification error', error);
      throw error;
    }
  },
  
  // Delete a file
  deleteFile: async (fileName: string) => {
    try {
      logger.info('Deleting file', { fileName });
      
      // Sanitize filename to prevent path traversal
      const sanitizedFileName = path.basename(fileName);
      
      // Ensure downloads directory exists
      const downloadsDir = ensureDownloadsDir();
      const filePath = path.join(downloadsDir, sanitizedFileName);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info('File deleted successfully', { fileName: sanitizedFileName });
      } else {
        logger.warn('File not found for deletion', { fileName: sanitizedFileName });
      }
      
      return { success: true, message: 'File deleted successfully' };
    } catch (error: any) {
      logger.error('File deletion error', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  },
  
  // List files
  listFiles: async (prefix?: string) => {
    try {
      logger.info('Listing files', { prefix });
      
      // Ensure downloads directory exists
      const downloadsDir = ensureDownloadsDir();
      
      const files = fs.readdirSync(downloadsDir);
      
      const fileDetails = files
        .filter(file => !prefix || file.startsWith(prefix))
        .map(file => {
          const filePath = path.join(downloadsDir, file);
          const stats = fs.statSync(filePath);
          
          return {
            name: file,
            size: stats.size,
            lastModified: stats.mtime.toISOString()
          };
        });
      
      logger.info('Files listed successfully', { count: fileDetails.length });
      
      return fileDetails;
    } catch (error: any) {
      logger.error('File listing error', error);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  },
  
  // Download a file and return its buffer
  downloadFileBuffer: async (fileName: string): Promise<Buffer> => {
    try {
      logger.info('Downloading file buffer', { fileName });
      
      // Sanitize filename to prevent path traversal
      const sanitizedFileName = path.basename(fileName);
      
      // Ensure downloads directory exists
      const downloadsDir = ensureDownloadsDir();
      const filePath = path.join(downloadsDir, sanitizedFileName);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${sanitizedFileName}`);
      }
      
      // Read file as buffer
      const fileBuffer = fs.readFileSync(filePath);
      
      logger.info('File buffer downloaded successfully', { fileName: sanitizedFileName, size: fileBuffer.length });
      
      return fileBuffer;
    } catch (error: any) {
      logger.error('File buffer download error', error);
      throw new Error(`Failed to download file buffer: ${error.message}`);
    }
  },
  
  // Check if a file exists
  fileExists: async (fileName: string): Promise<boolean> => {
    try {
      logger.info('Checking if file exists', { fileName });
      
      // Sanitize filename to prevent path traversal
      const sanitizedFileName = path.basename(fileName);
      
      // Ensure downloads directory exists
      const downloadsDir = ensureDownloadsDir();
      const filePath = path.join(downloadsDir, sanitizedFileName);
      
      // Check if file exists
      const exists = fs.existsSync(filePath);
      
      logger.info('File existence check completed', { fileName: sanitizedFileName, exists });
      
      return exists;
    } catch (error: any) {
      logger.error('File existence check error', error);
      return false;
    }
  }
};