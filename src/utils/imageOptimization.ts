// Image Optimization Utilities for Admin Panel

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface OptimizedImage {
  original: File | Blob;
  optimized: Blob;
  thumbnail: Blob;
  originalSize: number;
  optimizedSize: number;
  thumbnailSize: number;
}

/**
 * Optimize image for web upload
 * This runs in the browser/admin panel
 */
export async function optimizeImage(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImage> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    format = 'jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = async () => {
        try {
          // Calculate dimensions
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }

          // Create optimized version
          const optimizedBlob = await resizeImage(img, width, height, quality, format);
          
          // Create thumbnail (300x300)
          const thumbnailSize = 300;
          const thumbRatio = Math.min(thumbnailSize / img.width, thumbnailSize / img.height);
          const thumbWidth = img.width * thumbRatio;
          const thumbHeight = img.height * thumbRatio;
          const thumbnailBlob = await resizeImage(img, thumbWidth, thumbHeight, 0.8, format);

          resolve({
            original: file,
            optimized: optimizedBlob,
            thumbnail: thumbnailBlob,
            originalSize: file.size,
            optimizedSize: optimizedBlob.size,
            thumbnailSize: thumbnailBlob.size,
          });
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Resize image to specific dimensions
 */
function resizeImage(
  img: HTMLImageElement,
  width: number,
  height: number,
  quality: number,
  format: string
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    // Draw image
    ctx.drawImage(img, 0, 0, width, height);

    // Convert to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      `image/${format}`,
      quality
    );
  });
}

/**
 * Generate file name with timestamp
 */
export function generateFileName(originalName: string, prefix = 'product'): string {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop();
  const cleanName = originalName
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/[^a-z0-9]/gi, '_') // Replace special chars
    .toLowerCase()
    .substring(0, 30); // Limit length
  
  return `${prefix}_${cleanName}_${timestamp}.${extension}`;
}

/**
 * Validate image file
 */
export function validateImage(file: File): { valid: boolean; error?: string } {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload JPEG, PNG, or WebP images.',
    };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size too large. Maximum size is 10MB.',
    };
  }

  return { valid: true };
}
