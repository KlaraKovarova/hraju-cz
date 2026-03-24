"use client";

import { useState, useRef } from "react";
import { Camera, X, Loader2 } from "lucide-react";

interface UploadedPhoto {
  id: string;
  url: string;
}

interface PhotoUploadProps {
  facilityId: string;
  context: "review" | "visit";
  maxPhotos?: number;
  photos: UploadedPhoto[];
  onPhotosChange: (photos: UploadedPhoto[]) => void;
}

const MAX_WIDTH = 1200;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

async function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > MAX_WIDTH) {
        height = Math.round(height * (MAX_WIDTH / width));
        width = MAX_WIDTH;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob failed"));
        },
        "image/webp",
        0.85
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

export function PhotoUpload({
  facilityId,
  context,
  maxPhotos = 3,
  photos,
  onPhotosChange,
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = maxPhotos - photos.length;
    if (remaining <= 0) {
      setError(`Maximum je ${maxPhotos} ${maxPhotos === 1 ? "fotka" : "fotky"}.`);
      return;
    }

    setError("");
    setUploading(true);

    const filesToUpload = Array.from(files).slice(0, remaining);
    const newPhotos: UploadedPhoto[] = [];

    for (const file of filesToUpload) {
      if (!file.type.startsWith("image/")) {
        setError("Neplatný formát souboru.");
        continue;
      }

      try {
        // Resize client-side
        let blob: Blob;
        if (file.size > MAX_FILE_SIZE || file.type !== "image/webp") {
          blob = await resizeImage(file);
        } else {
          blob = file;
        }

        const formData = new FormData();
        formData.append("file", blob, file.name.replace(/\.[^.]+$/, ".webp"));
        formData.append("facilityId", facilityId);
        formData.append("context", context);

        const res = await fetch("/api/upload/photo", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          newPhotos.push({ id: data.id, url: data.url });
        } else {
          const data = await res.json();
          setError(data.error || "Nahrávání selhalo.");
        }
      } catch {
        setError("Chyba při nahrávání fotky.");
      }
    }

    if (newPhotos.length > 0) {
      onPhotosChange([...photos, ...newPhotos]);
    }

    setUploading(false);
    // Reset input
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleRemove(photoId: string) {
    onPhotosChange(photos.filter((p) => p.id !== photoId));
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-zinc-600">
        Fotky (nepovinné, max {maxPhotos})
      </label>

      <div className="flex flex-wrap gap-2">
        {photos.map((photo) => (
          <div key={photo.id} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-zinc-200">
            <img
              src={photo.url}
              alt=""
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemove(photo.id)}
              className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {photos.length < maxPhotos && (
          <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 text-zinc-400 transition hover:border-emerald-300 hover:text-emerald-500">
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Camera className="h-5 w-5" />
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple={maxPhotos - photos.length > 1}
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
