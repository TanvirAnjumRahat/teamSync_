'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { UploadCloud, X } from 'lucide-react';

interface FileUploaderProps {
  bucketName: string;
  folderPath: string;
  onUploadComplete: (metadata: { url: string; path: string; name: string; size: number; type: string }) => void;
  onUploadError?: (error: Error) => void;
  maxSizeMB?: number;
}

export function FileUploader({
  bucketName,
  folderPath,
  onUploadComplete,
  onUploadError,
  maxSizeMB = 10,
}: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds ${maxSizeMB}MB limit`);
      return;
    }

    setError(null);
    setIsUploading(true);
    setProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${folderPath}/${fileName}`;

      // We'll simulate progress since supabase js doesn't provide native upload progress in standard upload
      // For real progress we'd use tus or similar, but for now we simulate it.
      const progressInterval = setInterval(() => {
        setProgress((prev) => (prev >= 90 ? 90 : prev + 10));
      }, 200);

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      clearInterval(progressInterval);

      if (uploadError) {
        throw uploadError;
      }

      setProgress(100);

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      onUploadComplete({
        url: publicUrlData.publicUrl,
        path: filePath,
        name: file.name,
        size: file.size,
        type: file.type,
      });
      
      // Reset after a short delay
      setTimeout(() => {
        setIsUploading(false);
        setProgress(0);
      }, 1000);

    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || 'Failed to upload file');
      if (onUploadError) onUploadError(err);
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full">
      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {isUploading ? (
            <div className="w-full max-w-xs px-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-500">Uploading...</span>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-500">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          ) : (
            <>
              <UploadCloud className="w-8 h-8 mb-3 text-gray-400" />
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Max size: {maxSizeMB}MB</p>
            </>
          )}
        </div>
        <input 
          type="file" 
          className="hidden" 
          onChange={handleFileChange} 
          disabled={isUploading}
        />
      </label>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <X className="w-4 h-4" /> {error}
        </p>
      )}
    </div>
  );
}
