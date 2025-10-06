// Media File Interface
export interface MediaFile {
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

// Upload Session Interface
export interface UploadSession {
  id: string;
  fileId: string;
  uploadUrl: string;
  expiresAt: Date;
  parts: {
    partNumber: number;
    etag?: string;
  }[];
}

// Media Query Parameters
export interface MediaQueryParams {
  ownerId?: string;
  ownerType?: 'user' | 'team' | 'competition' | 'match';
  entityId?: string;
  tags?: string[];
  mimeType?: string;
  status?: 'uploading' | 'processing' | 'ready' | 'failed';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}