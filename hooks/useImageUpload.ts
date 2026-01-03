import { useState, useCallback } from 'react';
import { uploadFile } from '../services/fileUpload';

export interface UseImageUploadOptions {
  maxSizeMB?: number;
  compress?: boolean;
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
}

export interface ImageUploadState {
  file: File | null;
  preview: string | null;
  url: string | null;
  isUploading: boolean;
  progress: number;
  error: string | null;
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const {
    maxSizeMB = 5,
    compress = true,
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState<ImageUploadState>({
    file: null,
    preview: null,
    url: null,
    isUploading: false,
    progress: 0,
    error: null,
  });

  const selectFile = useCallback((file: File) => {
    // Validate file
    if (file.size > maxSizeMB * 1024 * 1024) {
      const error = `File size must be less than ${maxSizeMB}MB`;
      setState(prev => ({ ...prev, error }));
      if (onError) onError(error);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      setState(prev => ({
        ...prev,
        file,
        preview,
        error: null,
      }));
    };
    reader.readAsDataURL(file);
  }, [maxSizeMB, onError]);

  const upload = useCallback(async () => {
    if (!state.file) return;

    setState(prev => ({ ...prev, isUploading: true, progress: 0, error: null }));

    try {
      const result = await uploadFile({
        file: state.file,
        compress,
        onProgress: (progress) => {
          setState(prev => ({ ...prev, progress }));
        },
      });

      setState(prev => ({
        ...prev,
        url: result.url,
        isUploading: false,
        progress: 100,
      }));

      if (onSuccess) {
        onSuccess(result.url);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isUploading: false,
        progress: 0,
      }));

      if (onError) {
        onError(errorMessage);
      }
    }
  }, [state.file, compress, onSuccess, onError]);

  const reset = useCallback(() => {
    setState({
      file: null,
      preview: null,
      url: null,
      isUploading: false,
      progress: 0,
      error: null,
    });
  }, []);

  return {
    ...state,
    selectFile,
    upload,
    reset,
  };
}

