/**
 * Image Optimization Middleware
 * Optimizes images on upload
 */
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

/**
 * Optimize uploaded image
 */
export const optimizeImage = async (filePath, options = {}) => {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 80,
    format = 'jpeg',
  } = options;

  try {
    const image = sharp(filePath);
    const metadata = await image.metadata();

    // Resize if needed
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      image.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Convert and optimize
    const outputPath = filePath.replace(/\.(jpg|jpeg|png)$/i, `.${format}`);
    
    await image
      .toFormat(format, { quality })
      .toFile(outputPath);

    // Replace original with optimized version
    await fs.unlink(filePath);
    await fs.rename(outputPath, filePath);

    return filePath;
  } catch (error) {
    console.error('Image optimization error:', error);
    // Return original if optimization fails
    return filePath;
  }
};

