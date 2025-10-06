# Media Management API Documentation

## Overview
The Media Management API provides comprehensive functionality for handling all media assets (images, videos, documents) for the sports platform. This API supports uploading, processing, storage, and retrieval of media files with proper metadata management.

## Authentication
All Media API endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### File Upload Management

#### Initiate File Upload
```
POST /api/v1/media/upload
```
Initiates a new file upload with metadata.

**Request Body:**
```json
{
  "filename": "profile.jpg",
  "originalName": "my-profile-picture.jpg",
  "mimeType": "image/jpeg",
  "size": 102400,
  "ownerId": "user123",
  "ownerType": "user",
  "entityId": "entity456",
  "tags": ["profile", "user"],
  "metadata": {
    "width": 800,
    "height": 600
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "media789",
    "filename": "profile.jpg",
    "originalName": "my-profile-picture.jpg",
    "mimeType": "image/jpeg",
    "size": 102400,
    "url": "",
    "ownerId": "user123",
    "ownerType": "user",
    "entityId": "entity456",
    "tags": ["profile", "user"],
    "metadata": {
      "width": 800,
      "height": 600
    },
    "status": "uploading",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

#### Generate Pre-signed URL
```
POST /api/v1/media/upload/presigned-url/{id}
```
Generates a pre-signed URL for direct file upload.

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://storage.example.com/upload/xyz",
    "sessionId": "session123"
  }
}
```

#### Confirm Upload Completion
```
POST /api/v1/media/upload/complete/{id}
```
Confirms that the file upload has been completed.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "media789",
    "filename": "profile.jpg",
    "originalName": "my-profile-picture.jpg",
    "mimeType": "image/jpeg",
    "size": 102400,
    "url": "/api/v1/media/media789",
    "ownerId": "user123",
    "ownerType": "user",
    "entityId": "entity456",
    "tags": ["profile", "user"],
    "metadata": {
      "width": 800,
      "height": 600
    },
    "status": "ready",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

#### Cancel Upload
```
POST /api/v1/media/upload/cancel/{id}
```
Cancels a failed or incomplete upload.

**Response:**
```json
{
  "success": true,
  "message": "Upload cancelled successfully"
}
```

### File Retrieval & Management

#### Get Media File Details
```
GET /api/v1/media/{id}
```
Retrieves details of a specific media file.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "media789",
    "filename": "profile.jpg",
    "originalName": "my-profile-picture.jpg",
    "mimeType": "image/jpeg",
    "size": 102400,
    "url": "/api/v1/media/media789",
    "ownerId": "user123",
    "ownerType": "user",
    "entityId": "entity456",
    "tags": ["profile", "user"],
    "metadata": {
      "width": 800,
      "height": 600
    },
    "status": "ready",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

#### Download Media File
```
GET /api/v1/media/{id}/download
```
Generates a download URL for a media file.

**Response:**
```json
{
  "success": true,
  "data": {
    "fileName": "profile.jpg",
    "url": "https://storage.example.com/download/abc?signature=xyz&expires=123"
  }
}
```

#### List Media Files
```
GET /api/v1/media
```
Lists media files with filtering and pagination.

**Query Parameters:**
- `ownerId`: Filter by owner ID
- `ownerType`: Filter by owner type (user, team, competition, match)
- `entityId`: Filter by entity ID
- `tags`: Filter by tags (comma-separated)
- `mimeType`: Filter by MIME type
- `status`: Filter by status (uploading, processing, ready, failed)
- `page`: Page number (default: 1)
- `limit`: Number of items per page (default: 10)
- `sortBy`: Field to sort by
- `sortOrder`: Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "media789",
      "filename": "profile.jpg",
      "originalName": "my-profile-picture.jpg",
      "mimeType": "image/jpeg",
      "size": 102400,
      "url": "/api/v1/media/media789",
      "ownerId": "user123",
      "ownerType": "user",
      "entityId": "entity456",
      "tags": ["profile", "user"],
      "metadata": {
        "width": 800,
        "height": 600
      },
      "status": "ready",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "totalCount": 1,
    "page": 1,
    "limit": 10
  }
}
```

#### Update Media Metadata
```
PUT /api/v1/media/{id}
```
Updates metadata for a media file.

**Request Body:**
```json
{
  "tags": ["profile", "user", "updated"],
  "metadata": {
    "width": 1024,
    "height": 768
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "media789",
    "filename": "profile.jpg",
    "originalName": "my-profile-picture.jpg",
    "mimeType": "image/jpeg",
    "size": 102400,
    "url": "/api/v1/media/media789",
    "ownerId": "user123",
    "ownerType": "user",
    "entityId": "entity456",
    "tags": ["profile", "user", "updated"],
    "metadata": {
      "width": 1024,
      "height": 768
    },
    "status": "ready",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

#### Delete Media File
```
DELETE /api/v1/media/{id}
```
Deletes a media file.

**Response:**
```json
{
  "success": true,
  "message": "Media file deleted successfully"
}
```

### Processing & Optimization

#### Trigger Media Processing
```
POST /api/v1/media/{id}/process
```
Triggers processing of a media file (e.g., video encoding, image optimization).

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "media789",
    "filename": "profile.jpg",
    "originalName": "my-profile-picture.jpg",
    "mimeType": "image/jpeg",
    "size": 102400,
    "url": "/api/v1/media/media789",
    "ownerId": "user123",
    "ownerType": "user",
    "entityId": "entity456",
    "tags": ["profile", "user"],
    "metadata": {
      "width": 800,
      "height": 600
    },
    "status": "processing",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

#### Get Generated Thumbnails
```
GET /api/v1/media/{id}/thumbnails
```
Retrieves generated thumbnails for a media file.

**Response:**
```json
{
  "success": true,
  "data": [
    "https://storage.example.com/thumbnails/media789_128x128.jpg",
    "https://storage.example.com/thumbnails/media789_256x256.jpg"
  ]
}
```

#### Generate Custom Resized Versions
```
POST /api/v1/media/{id}/resize?width=500&height=500
```
Generates custom resized versions of a media file.

**Query Parameters:**
- `width`: Target width in pixels
- `height`: Target height in pixels

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "/api/v1/media/media789/resized/500x500"
  }
}
```

#### Convert File Format
```
POST /api/v1/media/{id}/convert?format=webp
```
Converts a media file to a different format.

**Query Parameters:**
- `format`: Target format (webp, png, etc.)

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "/api/v1/media/media789/converted/webp"
  }
}
```

### Batch Operations

#### Batch Upload
```
POST /api/v1/media/batch
```
Uploads multiple files at once.

**Request Body:**
```json
{
  "files": [
    {
      "filename": "profile1.jpg",
      "originalName": "my-profile-picture1.jpg",
      "mimeType": "image/jpeg",
      "size": 102400,
      "ownerId": "user123",
      "ownerType": "user",
      "entityId": "entity456",
      "tags": ["profile"],
      "metadata": {
        "width": 800,
        "height": 600
      }
    },
    {
      "filename": "profile2.jpg",
      "originalName": "my-profile-picture2.jpg",
      "mimeType": "image/jpeg",
      "size": 120000,
      "ownerId": "user123",
      "ownerType": "user",
      "entityId": "entity456",
      "tags": ["profile"],
      "metadata": {
        "width": 1024,
        "height": 768
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "media789",
      "filename": "profile1.jpg",
      "originalName": "my-profile-picture1.jpg",
      "mimeType": "image/jpeg",
      "size": 102400,
      "url": "",
      "ownerId": "user123",
      "ownerType": "user",
      "entityId": "entity456",
      "tags": ["profile"],
      "metadata": {
        "width": 800,
        "height": 600
      },
      "status": "uploading",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    {
      "id": "media790",
      "filename": "profile2.jpg",
      "originalName": "my-profile-picture2.jpg",
      "mimeType": "image/jpeg",
      "size": 120000,
      "url": "",
      "ownerId": "user123",
      "ownerType": "user",
      "entityId": "entity456",
      "tags": ["profile"],
      "metadata": {
        "width": 1024,
        "height": 768
      },
      "status": "uploading",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Batch Delete
```
DELETE /api/v1/media/batch
```
Deletes multiple media files at once.

**Request Body:**
```json
{
  "ids": ["media789", "media790"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Files deleted successfully"
}
```

#### Batch Update Metadata
```
PUT /api/v1/media/batch/metadata
```
Updates metadata for multiple media files at once.

**Request Body:**
```json
{
  "updates": [
    {
      "id": "media789",
      "metadata": {
        "tags": ["profile", "user", "updated"]
      }
    },
    {
      "id": "media790",
      "metadata": {
        "tags": ["profile", "user", "updated"]
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "media789",
      "filename": "profile1.jpg",
      "originalName": "my-profile-picture1.jpg",
      "mimeType": "image/jpeg",
      "size": 102400,
      "url": "/api/v1/media/media789",
      "ownerId": "user123",
      "ownerType": "user",
      "entityId": "entity456",
      "tags": ["profile", "user", "updated"],
      "metadata": {
        "width": 800,
        "height": 600
      },
      "status": "ready",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    {
      "id": "media790",
      "filename": "profile2.jpg",
      "originalName": "my-profile-picture2.jpg",
      "mimeType": "image/jpeg",
      "size": 120000,
      "url": "/api/v1/media/media790",
      "ownerId": "user123",
      "ownerType": "user",
      "entityId": "entity456",
      "tags": ["profile", "user", "updated"],
      "metadata": {
        "width": 1024,
        "height": 768
      },
      "status": "ready",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

## Data Models

### Media File
```typescript
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
```

### Upload Session
```typescript
interface UploadSession {
  id: string;
  fileId: string;
  uploadUrl: string;
  expiresAt: Date;
  parts: {
    partNumber: number;
    etag?: string;
  }[];
}
```

## Supported Media Types
- Images (JPEG, PNG, GIF, WebP) - profile pictures, team logos, event banners
- Videos (MP4, WebM, MOV) - match highlights, promotional content
- Documents (PDF, DOCX) - contracts, reports, schedules
- Audio files (MP3, WAV) - commentary, announcements

## Error Handling
All endpoints follow standard HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

Error responses follow this format:
```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description"
}
```