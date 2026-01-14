import React, { useState } from 'react'
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { ImageIcon } from 'lucide-react';
import { Music } from 'lucide-react';
import { XCircle } from 'lucide-react';
import supabase from '@/lib/supabase';
import { toast } from 'react-toastify';

const UploadMediaCard = ({part, pIdx, parts, setParts, formData}) => {
    const [uploading, setUploading] = useState(false);

    // File upload handler
    const handleFileUpload = async (e, partIdx, type) => {
      const file = e.target.files[0];
      if (!file) return;
    
      setUploading(true);
      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${type}s/${fileName}`;
        
        // 1. Bucket nomini aniqlaymiz (type'ga qarab)
        const bucketName = type === "audio" ? "listening-test" : "test-assets";
    
        // 2. Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });
    
        if (uploadError) throw uploadError;
    
        // 3. Public URL ni olish (Avval URLni olamiz, keyin statega yozamiz)
        const { data } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);
    
        if (!data?.publicUrl) throw new Error("Could not get public URL");
    
        // 4. State'ni yangilash
        const newParts = [...parts];
        if (type === "image") {
          newParts[partIdx].image_url = data.publicUrl;
        } else if (type === "audio") {
          newParts[partIdx].listening_url = data.publicUrl;
        }
    
        setParts(newParts);
        toast.success(`${type === "image" ? "Image" : "Audio"} uploaded successfully`);
        
      } catch (error) {
        console.error("File upload error:", error);
        toast.error(`Failed to upload ${type === "image" ? "image" : "audio"}: ${error.message}`);
      } finally {
        setUploading(false);
      }
    };
  
    // Remove file URL
    const handleRemoveFile = (partIdx, type) => {
      const newParts = [...parts];
      if (type === "image") {
        newParts[partIdx].image_url = null;
      } else if (type === "audio") {
        newParts[partIdx].listening_url = null;
      }
      setParts(newParts);
    };
  return (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <div className="space-y-2 col-span-2">
    <Label>Passage / Content</Label>
    <Textarea
      className="min-h-[300px]"
      placeholder="Paste your text here..."
      value={part.content || ""}
      onChange={(e) => {
        const newParts = [...parts];
        newParts[pIdx].content = e.target.value;
        setParts(newParts);
      }}
    />
  </div>

  <div className="space-y-4">
    <Label>Media Assets</Label>

    {/* Image Upload */}
    <div className="relative border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center bg-gray-50 min-h-[300px] ">
      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-xs text-gray-600">Uploading...</span>
          </div>
        </div>
      )}
      {part.image_url ? (
        <div className="relative w-full">
          <img
            src={part.image_url}
            alt="Part image"
            className="w-full max-h-[300px] object-contain rounded"
          />
          <Button
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6"
            onClick={() => handleRemoveFile(pIdx, "image")}
            disabled={uploading}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label className={`cursor-pointer flex flex-col items-center ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <ImageIcon className="h-8 w-8 text-gray-400" />
          <span className="text-xs mt-2">Upload Image (Optional)</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileUpload(e, pIdx, "image")}
            disabled={uploading}
          />
        </label>
      )}
    </div>

    {/* Audio Upload (For Listening type) */}
    {formData.type === "listening" && (
      <div className="border-2 border-dashed border-blue-200 rounded-lg p-4 flex flex-col items-center justify-center bg-blue-50 min-h-[150px] relative">
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-xs text-gray-600">Uploading...</span>
            </div>
          </div>
        )}
        {part.listening_url ? (
          <div className="relative w-full">
            <div className="flex items-center gap-2 p-2 bg-white rounded">
              <Music className="h-6 w-6 text-blue-500" />
              <span className="text-xs flex-1 truncate">
                Audio uploaded
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => handleRemoveFile(pIdx, "audio")}
                disabled={uploading}
              >
                <XCircle className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        ) : (
          <label className={`cursor-pointer flex flex-col items-center ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <Music className="h-8 w-8 text-blue-400" />
            <span className="text-xs mt-2 font-medium">
              Audio Track for Part {part.part_number}
            </span>
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, pIdx, "audio")}
              disabled={uploading}
            />
          </label>
        )}
      </div>
    )}
  </div>
</div>
  )
}

export default UploadMediaCard