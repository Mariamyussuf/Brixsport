'use client';

import React, { useState, useRef } from 'react';
import mediaUploadService from '@/services/mediaUploadService';

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

const MediaUploadExample: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<MediaFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setUploadedFile(null);
    setError(null);
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // In a real application, you would get these values from your app context
      const ownerId = 'user123'; // Replace with actual user ID
      const ownerType = 'user';  // Replace with actual owner type
      const entityId = 'entity456'; // Replace with actual entity ID
      const tags = ['profile', 'upload'];

      // Upload file with progress tracking
      const mediaFile = await mediaUploadService.uploadFileWithProgress(
        selectedFile,
        ownerId,
        ownerType,
        entityId,
        tags,
        (progress) => {
          setUploadProgress(progress.percentage);
        }
      );

      setUploadedFile(mediaFile);
      setSelectedFile(null);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file deletion
  const handleDelete = async () => {
    if (!uploadedFile) return;

    try {
      await mediaUploadService.deleteMediaFile(uploadedFile.id);
      setUploadedFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Media Upload Example</h2>
      
      {/* File Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select File
        </label>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          disabled={isUploading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      {/* Upload Button */}
      {selectedFile && !isUploading && (
        <button
          onClick={handleUpload}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
        >
          Upload File
        </button>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="mb-6">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Uploading...</span>
            <span className="text-sm font-medium text-gray-700">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Uploaded File Preview */}
      {uploadedFile && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="text-lg font-medium text-green-800 mb-2">Upload Successful!</h3>
          <div className="space-y-2">
            <p><span className="font-medium">File Name:</span> {uploadedFile.originalName}</p>
            <p><span className="font-medium">Size:</span> {Math.round(uploadedFile.size / 1024)} KB</p>
            <p><span className="font-medium">Type:</span> {uploadedFile.mimeType}</p>
            <p><span className="font-medium">Status:</span> {uploadedFile.status}</p>
            
            {uploadedFile.url && (
              <div className="mt-4">
                <p className="font-medium mb-2">Preview:</p>
                {uploadedFile.mimeType.startsWith('image/') ? (
                  <img 
                    src={uploadedFile.url} 
                    alt="Uploaded preview" 
                    className="max-w-full h-auto rounded-md"
                  />
                ) : (
                  <a 
                    href={uploadedFile.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Download File
                  </a>
                )}
              </div>
            )}
            
            <button
              onClick={handleDelete}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
            >
              Delete File
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="text-lg font-medium text-blue-800 mb-2">How to Use</h3>
        <ul className="list-disc list-inside space-y-1 text-blue-700">
          <li>Select a file using the file picker</li>
          <li>Click "Upload File" to start the upload process</li>
          <li>Watch the progress bar to track upload progress</li>
          <li>View the uploaded file preview when complete</li>
          <li>Use "Delete File" to remove the uploaded file</li>
        </ul>
      </div>
    </div>
  );
};

export default MediaUploadExample;