/**
 * File Upload Service
 * Handles file uploads with progress tracking and error handling
 */

import { api } from './api';
import { compressImage } from '../utils/imageCompression';

export interface UploadFileOptions {
  file: File;
  ownerId?: string;
  ownerType?: 'USER' | 'STAFF' | 'EVENT' | 'BOOKING';
  meta?: Record<string, any>;
  onProgress?: (progress: number) => void;
  compress?: boolean;
  compressionOptions?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    maxSizeMB?: number;
  };
}

export interface UploadResult {
  id: string;
  url: string;
  key: string;
  mimeType: string;
  size: number;
  originalSize?: number;
}

/**
 * Upload a file with progress tracking
 */
export async function uploadFile(options: UploadFileOptions): Promise<UploadResult> {
  const { 
    file, 
    ownerId, 
    ownerType, 
    meta, 
    onProgress,
    compress = true,
    compressionOptions,
  } = options;

  try {
    let fileToUpload = file;
    const originalSize = file.size;

    // Compress image if needed
    if (compress && file.type.startsWith('image/')) {
      onProgress?.(10);
      try {
        fileToUpload = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.8,
          maxSizeMB: 5,
          ...compressionOptions,
        });
        onProgress?.(30);
      } catch (error) {
        console.warn('Image compression failed, using original:', error);
        // Continue with original file if compression fails
      }
    }

    // Step 1: Get upload URL from backend
    onProgress?.(40);
    const uploadResponse = await api.files.upload(fileToUpload, {
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const progress = 40 + (progressEvent.loaded / progressEvent.total) * 50;
          onProgress?.(progress);
        }
      },
    });

    onProgress?.(90);

    // Handle different response structures
    let fileRecord;
    if (uploadResponse.success && uploadResponse.data) {
      fileRecord = uploadResponse.data;
    } else if (uploadResponse.url) {
      fileRecord = uploadResponse;
    } else {
      throw new Error('Invalid upload response');
    }

    onProgress?.(100);

    return {
      id: fileRecord.id || fileRecord._id || `file-${Date.now()}`,
      url: fileRecord.url || fileRecord.fileUrl,
      key: fileRecord.key || fileRecord.fileKey || '',
      mimeType: fileToUpload.type,
      size: fileToUpload.size,
      originalSize: originalSize !== fileToUpload.size ? originalSize : undefined,
    };
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
}

/**
 * Upload multiple files
 */
export async function uploadFiles(
  files: File[],
  options?: Omit<UploadFileOptions, 'file'>
): Promise<UploadResult[]> {
  const results = await Promise.all(
    files.map((file) => uploadFile({ ...options, file }))
  );
  return results;
}

