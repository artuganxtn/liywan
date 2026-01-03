import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, Loader2, Check } from 'lucide-react';
import { compressImage } from '../../utils/imageCompression';

export interface ImageUploadProps {
  value?: string;
  onChange?: (file: File | null, previewUrl?: string) => void;
  onUploadComplete?: (url: string) => void;
  label?: string;
  maxSizeMB?: number;
  aspectRatio?: number;
  className?: string;
  disabled?: boolean;
  accept?: string;
  showPreview?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  onUploadComplete,
  label = 'Upload Image',
  maxSizeMB = 5,
  aspectRatio,
  className = '',
  disabled = false,
  accept = 'image/*',
  showPreview = true,
}) => {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<File | null>(null);

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'Please select an image file';
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `Image size must be less than ${maxSizeMB}MB`;
    }
    return null;
  };

  const createPreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Create preview immediately
      const previewUrl = await createPreview(file);
      setPreview(previewUrl);

      // Compress image if needed
      const compressedFile = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.8,
        maxSizeMB: maxSizeMB,
      });

      fileRef.current = compressedFile;
      setUploadProgress(50);

      // Notify parent
      if (onChange) {
        onChange(compressedFile, previewUrl);
      }

      setUploadProgress(100);
      
      // Simulate upload delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setIsUploading(false);
      setUploadProgress(0);
    } catch (err) {
      console.error('Error processing image:', err);
      setError(err instanceof Error ? err.message : 'Failed to process image');
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [maxSizeMB, onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
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

    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    fileRef.current = null;
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    if (onChange) {
      onChange(null);
    }
    setError(null);
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-bold text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl transition-all duration-300 ${
          isDragging
            ? 'border-qatar bg-qatar-50'
            : error
            ? 'border-red-300 bg-red-50'
            : preview
            ? 'border-emerald-300 bg-emerald-50'
            : 'border-gray-200 hover:border-gray-300 bg-white'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled || isUploading}
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {preview && showPreview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative p-4"
            >
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-2" />
                      <p className="text-white text-sm">{uploadProgress}%</p>
                    </div>
                  </div>
                )}
                {!isUploading && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove();
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                    aria-label="Remove image"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              {!isUploading && (
                <div className="mt-2 flex items-center gap-2 text-sm text-emerald-600">
                  <Check size={16} />
                  <span>Image ready</span>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !disabled && !isUploading && inputRef.current?.click()}
              className="p-8 text-center"
            >
              {isUploading ? (
                <div className="space-y-3">
                  <Loader2 className="w-12 h-12 text-qatar animate-spin mx-auto" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-700">Processing image...</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className="bg-qatar h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">{uploadProgress}%</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      {isDragging ? 'Drop image here' : label}
                    </p>
                    <p className="text-xs text-gray-500">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Max size: {maxSizeMB}MB
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-600 mt-2"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

