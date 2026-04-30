// src/lib/cloudinary.ts
'use client';

// Types
export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export interface OptimizeOptions {
  width?: number;
  height?: number;
  quality?: 'auto' | 'good' | 'best' | number;
  crop?: string;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
}

// Main upload function
export const uploadToCloudinary = async (
  file: File, 
  options?: {
    folder?: string;
    tags?: string[];
  }
): Promise<CloudinaryUploadResult> => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary configuration missing.');
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed.');
  }

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File size must be less than 10MB.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  
  if (options?.folder) {
    formData.append('folder', options.folder);
  }
  
  if (options?.tags && options.tags.length > 0) {
    formData.append('tags', options.tags.join(','));
  }

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${errorText}`);
    }

    const data = await response.json();
    
    return {
      url: data.secure_url,
      publicId: data.public_id,
      width: data.width,
      height: data.height,
      format: data.format,
      bytes: data.bytes,
    };

  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

// Optimize image URL function
export const getOptimizedImageUrl = (
  url: string, 
  options?: OptimizeOptions
): string => {
  if (!url) return '';
  
  // If it's not a Cloudinary URL, return as is
  if (!url.includes('cloudinary.com')) {
    return url;
  }
  
  const transformations: string[] = [];
  
  // Width/Height
  if (options?.width && options?.height) {
    transformations.push(`c_${options.crop || 'fit'},w_${options.width},h_${options.height}`);
  } else if (options?.width) {
    transformations.push(`w_${options.width}`);
  } else if (options?.height) {
    transformations.push(`h_${options.height}`);
  }
  
  // Quality
  if (options?.quality === 'auto') {
    transformations.push('q_auto:good');
  } else if (options?.quality && typeof options.quality === 'number') {
    transformations.push(`q_${options.quality}`);
  }
  
  // Format
  if (options?.format === 'auto') {
    transformations.push('f_auto');
  } else if (options?.format) {
    transformations.push(`f_${options.format}`);
  }
  
  if (transformations.length > 0) {
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex !== -1) {
      const baseUrl = url.substring(0, uploadIndex + 8);
      const imagePath = url.substring(uploadIndex + 8);
      return `${baseUrl}${transformations.join(',')}/${imagePath}`;
    }
  }
  
  return url;
};

// 🔥 NEW FUNCTION: Get optimized avatar URL with cache busting
export const getOptimizedAvatarUrl = (
  url: string | undefined,
  name: string = 'User',
  timestamp?: number
): string => {
  // If no URL or default avatar, return fallback
  if (!url || url === '/default-avatar.png' || url === '') {
    return getFallbackAvatar(name);
  }
  
  // If it's a Cloudinary URL, optimize it
  if (url.includes('cloudinary.com')) {
    const optimized = getOptimizedImageUrl(url, {
      width: 300,
      height: 300,
      crop: 'fill',
      quality: 'auto',
      format: 'auto'
    });
    return timestamp ? `${optimized}?t=${timestamp}` : optimized;
  }
  
  // For Google or other external URLs, add cache busting
  return timestamp ? `${url}?t=${timestamp}` : url;
};

// 🔥 NEW FUNCTION: Generate fallback avatar using UI Avatars API
export const getFallbackAvatar = (name: string = 'User'): string => {
  const initial = name.charAt(0).toUpperCase();
  const encodedName = encodeURIComponent(initial);
  return `https://ui-avatars.com/api/?name=${encodedName}&background=8b5cf6&color=fff&size=128&bold=true&length=1`;
};

// 🔥 NEW FUNCTION: Get user display name from various sources
export const getUserDisplayName = (user: any): string => {
  return user?.displayName || user?.name || user?.username || user?.email?.split('@')[0] || 'User';
};