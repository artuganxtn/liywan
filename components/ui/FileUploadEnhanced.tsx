import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, Check, Loader2, AlertCircle } from 'lucide-react';
import { uploadFile } from '../../services/fileUpload';

export interface FileUploadEnhancedProps {
  label: string;
  description?: string;
  onUploadComplete?: (url: string, file: File) => void;
  onUploadError?: (error: string) => void;
  icon?: React.ReactNode;
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  className?: string;
  disabled?: boolean;
  autoUpload?: boolean;
}

export const FileUploadEnhanced: React.FC<FileUploadEnhancedProps> = ({
  label,
  description,
  onUploadComplete,
  onUploadError,
  icon,
  accept,
  maxSizeMB = 10,
  multiple = false,
  className = '',
  disabled = false,
  autoUpload = true,
}) => {
  const [files, setFiles] = useState<Array<{ file: File; preview?: string; progress: number; status: 'pending' | 'uploading' | 'success' | 'error'; url?: string; error?: string }>>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File size must be less than ${maxSizeMB}MB`;
    }
    return null;
  };

  const createPreview = (file: File): Promise<string | undefined> => {
    if (file.type.startsWith('image/')) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(file);
      });
    }
    return Promise.resolve(undefined);
  };

  const handleFileSelect = useCallback(async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newFiles = Array.from(selectedFiles).map(file => ({
      file,
      preview: undefined as string | undefined,
      progress: 0,
      status: 'pending' as const,
    }));

    // Create previews
    for (let i = 0; i < newFiles.length; i++) {
      const preview = await createPreview(newFiles[i].file);
      newFiles[i].preview = preview;
    }

    setFiles(prev => multiple ? [...prev, ...newFiles] : newFiles);

    // Auto upload if enabled
    if (autoUpload) {
      newFiles.forEach((fileItem, index) => {
        handleUpload(fileItem.file, index);
      });
    }
  }, [multiple, autoUpload]);

  const handleUpload = async (file: File, index: number) => {
    const validationError = validateFile(file);
    if (validationError) {
      setFiles(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], status: 'error', error: validationError };
        return updated;
      });
      if (onUploadError) {
        onUploadError(validationError);
      }
      return;
    }

    setFiles(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status: 'uploading', progress: 0 };
      return updated;
    });

    try {
      const result = await uploadFile({
        file,
        compress: file.type.startsWith('image/'),
        onProgress: (progress) => {
          setFiles(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], progress };
            return updated;
          });
        },
      });

      setFiles(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          status: 'success',
          progress: 100,
          url: result.url,
        };
        return updated;
      });

      if (onUploadComplete) {
        onUploadComplete(result.url, file);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setFiles(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          status: 'error',
          error: errorMessage,
        };
        return updated;
      });
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    }
  };

  const handleRemove = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input to allow selecting same file again
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!disabled) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-4 transition-all ${
          isDragging
            ? 'border-qatar bg-qatar-50'
            : 'border-gray-200 hover:border-gray-300 bg-white'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled}
          multiple={multiple}
          className="hidden"
        />

        {files.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
              {icon || <Upload className="w-6 h-6 text-gray-400" />}
            </div>
            <p className="font-medium text-gray-700 mb-1">{label}</p>
            <p className="text-sm text-gray-500">{description || 'Click to browse or drag files here'}</p>
            <p className="text-xs text-gray-400 mt-1">Max size: {maxSizeMB}MB</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((fileItem, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                {fileItem.preview ? (
                  <img
                    src={fileItem.preview}
                    alt="Preview"
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                    <FileText className="w-6 h-6 text-gray-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {fileItem.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  
                  {fileItem.status === 'uploading' && (
                    <div className="mt-2 space-y-1">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <motion.div
                          className="bg-qatar h-1.5 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${fileItem.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500">{fileItem.progress}%</p>
                    </div>
                  )}

                  {fileItem.status === 'error' && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {fileItem.error}
                    </p>
                  )}

                  {fileItem.status === 'success' && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                      <Check size={12} />
                      Uploaded successfully
                    </p>
                  )}
                </div>

                {fileItem.status === 'uploading' ? (
                  <Loader2 className="w-5 h-5 text-qatar animate-spin" />
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(index);
                    }}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    aria-label="Remove file"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

