import { API_BASE_URL } from '@/lib/apiConfig';

// Media Upload Service for frontend applications
// This service provides a simplified interface for uploading and managing media files

interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  ownerId: string;
  ownerType: 'user' | 'team' | 'competition' | 'match';
  entityId: string;
  tags: string[];
  metadata: {
    width?: number;
    height?: number;
    duration?: number;
    bitrate?: number;
    codec?: string;
  };
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

interface UploadProgress {
  uploaded: number;
  total: number;
  percentage: number;
}

class MediaUploadService {
  private baseUrl: string;
  private authToken: string | null;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/media`;
    this.authToken = null;
  }

  // Set authentication token
  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  // Get default headers with authentication
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  // Initiate file upload
  async initiateUpload(file: File, ownerId: string, ownerType: string, entityId: string, tags: string[] = []): Promise<MediaFile> {
    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        filename: file.name,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        ownerId,
        ownerType,
        entityId,
        tags
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to initiate upload: ${response.statusText}`);
    }

    const { data } = await response.json();
    return data;
  }

  // Generate pre-signed URL for direct upload
  async generatePresignedUrl(fileId: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/upload/presigned-url/${fileId}`, {
      method: 'POST',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to generate pre-signed URL: ${response.statusText}`);
    }

    const { data } = await response.json();
    return data.uploadUrl;
  }

  // Upload file directly to storage
  async uploadToStorage(uploadUrl: string, file: File, onProgress?: (progress: UploadProgress) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Track progress if callback provided
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress: UploadProgress = {
              uploaded: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100)
            };
            onProgress(progress);
          }
        });
      }
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });
      
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  }

  // Complete upload process
  async completeUpload(fileId: string): Promise<MediaFile> {
    const response = await fetch(`${this.baseUrl}/upload/complete/${fileId}`, {
      method: 'POST',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to complete upload: ${response.statusText}`);
    }

    const { data } = await response.json();
    return data;
  }

  // Cancel upload
  async cancelUpload(fileId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/upload/cancel/${fileId}`, {
      method: 'POST',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel upload: ${response.statusText}`);
    }
  }

  // Upload file with progress tracking
  async uploadFileWithProgress(
    file: File, 
    ownerId: string, 
    ownerType: string, 
    entityId: string, 
    tags: string[] = [],
    onProgress?: (progress: UploadProgress) => void
  ): Promise<MediaFile> {
    try {
      // 1. Initiate upload
      const mediaFile = await this.initiateUpload(file, ownerId, ownerType, entityId, tags);
      
      // 2. Generate pre-signed URL
      const uploadUrl = await this.generatePresignedUrl(mediaFile.id);
      
      // 3. Upload file directly to storage with progress tracking
      await this.uploadToStorage(uploadUrl, file, onProgress);
      
      // 4. Complete upload
      const completedFile = await this.completeUpload(mediaFile.id);
      
      return completedFile;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  // Get media file details
  async getMediaFile(fileId: string): Promise<MediaFile> {
    const response = await fetch(`${this.baseUrl}/${fileId}`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get media file: ${response.statusText}`);
    }

    const { data } = await response.json();
    return data;
  }

  // Delete media file
  async deleteMediaFile(fileId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${fileId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to delete media file: ${response.statusText}`);
    }
  }

  // List media files
  async listMediaFiles(params: {
    ownerId?: string;
    ownerType?: string;
    entityId?: string;
    tags?: string[];
    mimeType?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ files: MediaFile[]; totalCount: number }> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          queryParams.append(key, value.join(','));
        } else {
          queryParams.append(key, String(value));
        }
      }
    });
    
    const response = await fetch(`${this.baseUrl}?${queryParams.toString()}`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to list media files: ${response.statusText}`);
    }

    const { data, pagination } = await response.json();
    return {
      files: data,
      totalCount: pagination.totalCount
    };
  }

  // Get thumbnails for a media file
  async getThumbnails(fileId: string): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/${fileId}/thumbnails`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get thumbnails: ${response.statusText}`);
    }

    const { data } = await response.json();
    return data;
  }

  // Resize media file
  async resizeMedia(fileId: string, width: number, height: number): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${fileId}/resize?width=${width}&height=${height}`, {
      method: 'POST',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to resize media: ${response.statusText}`);
    }

    const { data } = await response.json();
    return data.url;
  }

  // Convert media file format
  async convertMedia(fileId: string, format: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${fileId}/convert?format=${format}`, {
      method: 'POST',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to convert media: ${response.statusText}`);
    }

    const { data } = await response.json();
    return data.url;
  }

  // Batch upload files
  async batchUpload(
    files: File[], 
    ownerId: string, 
    ownerType: string, 
    entityId: string, 
    tags: string[] = []
  ): Promise<MediaFile[]> {
    // For simplicity, we'll upload files sequentially
    // In a real implementation, you might want to upload in parallel
    const uploadedFiles: MediaFile[] = [];
    
    for (const file of files) {
      try {
        const mediaFile = await this.uploadFileWithProgress(file, ownerId, ownerType, entityId, tags);
        uploadedFiles.push(mediaFile);
      } catch (error) {
        console.error(`Failed to upload file ${file.name}:`, error);
        // Continue with other files
      }
    }
    
    return uploadedFiles;
  }

  // Batch delete files
  async batchDelete(fileIds: string[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/batch`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: JSON.stringify({ ids: fileIds })
    });

    if (!response.ok) {
      throw new Error(`Failed to batch delete files: ${response.statusText}`);
    }
  }
}

// Export singleton instance
const mediaUploadService = new MediaUploadService();

export default mediaUploadService;