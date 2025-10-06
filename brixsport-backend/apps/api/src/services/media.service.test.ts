import { mediaService } from './media.service';
import { MediaFile } from '../types/media.types';
import { storageService } from './storage.service';

// Mock the storage service
jest.mock('./storage.service');

describe('Media Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createMediaFile', () => {
    it('should create a new media file', async () => {
      const fileData: Omit<MediaFile, 'id' | 'createdAt' | 'updatedAt'> = {
        filename: 'test.jpg',
        originalName: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        url: 'http://example.com/test.jpg',
        ownerId: 'user1',
        ownerType: 'user',
        entityId: 'entity1',
        tags: ['test'],
        metadata: { width: 100, height: 100 },
        status: 'ready'
      };

      const result = await mediaService.createMediaFile(fileData);
      
      expect(result).toHaveProperty('id');
      expect(result.filename).toBe(fileData.filename);
      expect(result.originalName).toBe(fileData.originalName);
      expect(result.mimeType).toBe(fileData.mimeType);
      expect(result.size).toBe(fileData.size);
      expect(result.url).toBe(fileData.url);
      expect(result.ownerId).toBe(fileData.ownerId);
      expect(result.ownerType).toBe(fileData.ownerType);
      expect(result.entityId).toBe(fileData.entityId);
      expect(result.tags).toEqual(fileData.tags);
      expect(result.metadata).toEqual(fileData.metadata);
      expect(result.status).toBe(fileData.status);
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });
  });

  describe('getMediaFileById', () => {
    it('should return null if media file not found', async () => {
      const result = await mediaService.getMediaFileById('nonexistent');
      expect(result).toBeNull();
    });

    it('should return media file if found', async () => {
      const fileData: Omit<MediaFile, 'id' | 'createdAt' | 'updatedAt'> = {
        filename: 'test.jpg',
        originalName: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        url: 'http://example.com/test.jpg',
        ownerId: 'user1',
        ownerType: 'user',
        entityId: 'entity1',
        tags: ['test'],
        metadata: { width: 100, height: 100 },
        status: 'ready'
      };

      const createdFile = await mediaService.createMediaFile(fileData);
      const result = await mediaService.getMediaFileById(createdFile.id);
      
      expect(result).toEqual(createdFile);
    });
  });

  describe('updateMediaFile', () => {
    it('should return null if media file not found', async () => {
      const result = await mediaService.updateMediaFile('nonexistent', { filename: 'updated.jpg' });
      expect(result).toBeNull();
    });

    it('should update media file if found', async () => {
      const fileData: Omit<MediaFile, 'id' | 'createdAt' | 'updatedAt'> = {
        filename: 'test.jpg',
        originalName: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        url: 'http://example.com/test.jpg',
        ownerId: 'user1',
        ownerType: 'user',
        entityId: 'entity1',
        tags: ['test'],
        metadata: { width: 100, height: 100 },
        status: 'ready'
      };

      const createdFile = await mediaService.createMediaFile(fileData);
      const updatedFile = await mediaService.updateMediaFile(createdFile.id, { 
        filename: 'updated.jpg',
        status: 'processing'
      });
      
      expect(updatedFile).not.toBeNull();
      expect(updatedFile?.filename).toBe('updated.jpg');
      expect(updatedFile?.status).toBe('processing');
      expect(updatedFile?.id).toBe(createdFile.id);
    });
  });

  describe('deleteMediaFile', () => {
    it('should return false if media file not found', async () => {
      const result = await mediaService.deleteMediaFile('nonexistent');
      expect(result).toBe(false);
    });

    it('should delete media file if found', async () => {
      // Mock the storage service delete function
      (storageService.deleteFile as jest.Mock).mockResolvedValue({ success: true });

      const fileData: Omit<MediaFile, 'id' | 'createdAt' | 'updatedAt'> = {
        filename: 'test.jpg',
        originalName: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        url: 'http://example.com/test.jpg',
        ownerId: 'user1',
        ownerType: 'user',
        entityId: 'entity1',
        tags: ['test'],
        metadata: { width: 100, height: 100 },
        status: 'ready'
      };

      const createdFile = await mediaService.createMediaFile(fileData);
      const result = await mediaService.deleteMediaFile(createdFile.id);
      
      expect(result).toBe(true);
      
      // Verify the file is no longer retrievable
      const getFileResult = await mediaService.getMediaFileById(createdFile.id);
      expect(getFileResult).toBeNull();
    });
  });
});