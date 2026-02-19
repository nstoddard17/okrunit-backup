"use client";

// ---------------------------------------------------------------------------
// Gatekeeper -- Attachment Upload: Drag-and-drop + file input upload zone
// ---------------------------------------------------------------------------

import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

// ---- Types ----------------------------------------------------------------

interface AttachmentUploadProps {
  requestId: string;
  onUploadComplete: () => void;
}

// ---- Constants ------------------------------------------------------------

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "text/plain",
  "text/csv",
  "text/markdown",
  "application/json",
];

const ACCEPT_STRING = ACCEPTED_TYPES.join(",");

// ---- Helpers --------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ---- Component ------------------------------------------------------------

export function AttachmentUpload({
  requestId,
  onUploadComplete,
}: AttachmentUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- Validation ---------------------------------------------------------

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File is too large (${formatFileSize(file.size)}). Maximum size is 10 MB.`;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `File type "${file.type || "unknown"}" is not supported. Please use images, PDFs, or text files.`;
    }
    return null;
  }, []);

  // ---- File selection handlers --------------------------------------------

  const handleFileSelect = useCallback(
    (file: File) => {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        return;
      }
      setSelectedFile(file);
    },
    [validateFile],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
      // Reset the input so the same file can be re-selected
      e.target.value = "";
    },
    [handleFileSelect],
  );

  // ---- Drag-and-drop handlers ---------------------------------------------

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect],
  );

  // ---- Upload handler -----------------------------------------------------

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      // Simulate progress for better UX (actual XHR progress not available
      // with fetch, but we can show an indeterminate-ish progress)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 200);

      const response = await fetch(
        `/api/v1/approvals/${requestId}/attachments`,
        {
          method: "POST",
          body: formData,
        },
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to upload attachment");
      }

      toast.success(`Uploaded "${selectedFile.name}" successfully`);
      setSelectedFile(null);
      setUploadProgress(0);
      onUploadComplete();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to upload attachment",
      );
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, requestId, onUploadComplete]);

  // ---- Clear selection ----------------------------------------------------

  const handleClear = useCallback(() => {
    setSelectedFile(null);
    setUploadProgress(0);
  }, []);

  // ---- Render -------------------------------------------------------------

  return (
    <div className="space-y-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT_STRING}
        onChange={handleInputChange}
        className="hidden"
        aria-label="Select file to upload"
      />

      {/* Drag-and-drop zone */}
      {!selectedFile && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-6 transition-colors ${
            isDragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
          }`}
        >
          <Upload
            className={`mb-2 size-8 ${
              isDragOver ? "text-primary" : "text-muted-foreground"
            }`}
          />
          <p className="text-sm font-medium">
            {isDragOver ? "Drop file here" : "Drag and drop a file, or click to browse"}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Images, PDFs, and text files up to 10 MB
          </p>
        </div>
      )}

      {/* Selected file preview */}
      {selectedFile && (
        <div className="flex items-center gap-3 rounded-md border p-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{selectedFile.name}</p>
            <p className="text-muted-foreground text-xs">
              {formatFileSize(selectedFile.size)} &middot; {selectedFile.type}
            </p>
          </div>

          {/* Upload progress bar */}
          {isUploading && (
            <div className="flex items-center gap-2">
              <div className="bg-muted h-2 w-24 overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(uploadProgress, 100)}%` }}
                />
              </div>
              <Loader2 className="text-muted-foreground size-4 animate-spin" />
            </div>
          )}

          {/* Action buttons */}
          {!isUploading && (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                onClick={handleUpload}
                disabled={isUploading}
              >
                <Upload className="size-4" />
                Upload
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={isUploading}
              >
                <X className="size-4" />
                <span className="sr-only">Remove selected file</span>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
