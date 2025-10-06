import { mediaController } from './media.controller';
import { mediaService } from '../services/media.service';
import { Request, Response } from 'express';

// Mock the media service
jest.mock('../services/media.service');

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('Media Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonResponse: jest.Mock;

  beforeEach(() => {
    jsonResponse = jest.fn();
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jsonResponse
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initiateUpload', () => {
    it('should return 400 if required fields are missing', async () => {
      mockRequest = {
        body: {
          filename: 'test.jpg'
          // Missing other required fields
        }
      };

      await mediaController.initiateUpload(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(jsonResponse).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('Missing required fields')
      });
    });

    it('should create media file and return 201', async () => {
      const mockMediaFile = {
        id: '123',
        filename: 'test.jpg',
        originalName: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        url: '',
        ownerId: 'user1',
        ownerType: 'user',
        entityId: 'entity1',
        tags: [],
        metadata: {},
        status: 'uploading',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (mediaService.initiateUpload as jest.Mock).mockResolvedValue(mockMediaFile);

      mockRequest = {
        body: {
          filename: 'test.jpg',
          originalName: 'test.jpg',
          mimeType: 'image/jpeg',
          size: 1024,
          ownerId: 'user1',
          ownerType: 'user',
          entityId: 'entity1'
        }
      };

      await mediaController.initiateUpload(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(jsonResponse).toHaveBeenCalledWith({
        success: true,
        data: mockMediaFile
      });
    });
  });

  describe('getMediaFile', () => {
    it('should return 400 if ID is missing', async () => {
      mockRequest = {
        params: {}
      };

      await mediaController.getMediaFile(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(jsonResponse).toHaveBeenCalledWith({
        success: false,
        error: 'File ID is required'
      });
    });

    it('should return 404 if media file not found', async () => {
      (mediaService.getMediaFileById as jest.Mock).mockResolvedValue(null);

      mockRequest = {
        params: { id: 'nonexistent' }
      };

      await mediaController.getMediaFile(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(jsonResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Media file not found'
      });
    });

    it('should return media file data', async () => {
      const mockMediaFile = {
        id: '123',
        filename: 'test.jpg',
        originalName: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        url: 'http://example.com/test.jpg',
        ownerId: 'user1',
        ownerType: 'user',
        entityId: 'entity1',
        tags: [],
        metadata: {},
        status: 'ready',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (mediaService.getMediaFileById as jest.Mock).mockResolvedValue(mockMediaFile);

      mockRequest = {
        params: { id: '123' }
      };

      await mediaController.getMediaFile(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(jsonResponse).toHaveBeenCalledWith({
        success: true,
        data: mockMediaFile
      });
    });
  });
});