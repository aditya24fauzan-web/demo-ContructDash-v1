import React, { useRef, useState } from 'react';
import { UploadCloud, Loader2, Camera, Image as ImageIcon } from 'lucide-react';
import { uploadImage } from '../lib/db';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  isUploading?: boolean;
  onUploadingChange?: (isUploading: boolean) => void;
  value?: string | null;
  path?: string;
  label?: string;
}

export function ImageUpload({ onUpload, isUploading: externalIsUploading, onUploadingChange, value, path = 'proofs', label = 'Bukti' }: ImageUploadProps) {
  const [internalUploading, setInternalUploading] = useState(false);
  
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const isUploading = externalIsUploading !== undefined ? externalIsUploading : internalUploading;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
        
    try {
      if (onUploadingChange) onUploadingChange(true);
      setInternalUploading(true);
      
      const b64 = await uploadImage(file, path);
      onUpload(b64);
    } catch (error) {
      alert("Gagal memproses gambar");
    } finally {
      if (onUploadingChange) onUploadingChange(false);
      setInternalUploading(false);
      if (cameraRef.current) cameraRef.current.value = '';
      if (galleryRef.current) galleryRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    try {
      if (onUploadingChange) onUploadingChange(true);
      setInternalUploading(true);
      const b64 = await uploadImage(file, path);
      onUpload(b64);
    } catch (error) {
      alert("Gagal memproses gambar");
    } finally {
      if (onUploadingChange) onUploadingChange(false);
      setInternalUploading(false);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      
      <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraRef} onChange={handleFileChange} />
      <input type="file" accept="image/*" className="hidden" ref={galleryRef} onChange={handleFileChange} />

      <div 
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="mt-1 px-4 py-4 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 flex items-center justify-center transition hover:border-indigo-500"
      >
        <div className="w-full text-center">
          {isUploading ? (
             <div className="flex flex-col items-center justify-center py-2">
               <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-2" />
               <p className="text-sm text-gray-500">Mengupload...</p>
             </div>
          ) : value ? (
            <div className="flex flex-col items-center justify-center py-2 gap-2">
              <div className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 block"></span>
                Gambar siap
              </div>
              <button 
                type="button" 
                onClick={(e) => {
                  e.preventDefault();
                  onUpload('');
                }}
                className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1"
              >
                Hapus & Ganti
              </button>
            </div>
          ) : (
             <div className="py-1">
                <UploadCloud className="mx-auto h-8 w-8 text-gray-400 mb-3" />
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button 
                    type="button" 
                    onClick={() => cameraRef.current?.click()} 
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition whitespace-nowrap"
                  >
                    <Camera size={16} /> Kamera
                  </button>
                  <button 
                    type="button" 
                    onClick={() => galleryRef.current?.click()} 
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition whitespace-nowrap"
                  >
                    <ImageIcon size={16} /> File Gambar
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-3 hidden sm:block">PNG, JPG maksimal 10MB. Bisa drag & drop.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

