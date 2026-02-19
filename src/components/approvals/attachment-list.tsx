"use client";

// ---------------------------------------------------------------------------
// Gatekeeper -- Attachment List: Display uploaded files with download links
// ---------------------------------------------------------------------------

import { useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { Paperclip, Download, FileText, Image, File } from "lucide-react";
import { toast } from "sonner";

import type { ApprovalAttachment } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ---- Types ----------------------------------------------------------------

interface AttachmentListProps {
  attachments: ApprovalAttachment[];
}

// ---- Helpers --------------------------------------------------------------

/**
 * Format a byte count into a human-readable string (e.g. "1.2 MB").
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Return the appropriate Lucide icon component for a given content type.
 */
function getFileIcon(contentType: string) {
  if (contentType.startsWith("image/")) return Image;
  if (contentType === "application/pdf") return FileText;
  return File;
}

/**
 * Check whether a content type represents an image that can be thumbnailed.
 */
function isImageType(contentType: string): boolean {
  return contentType.startsWith("image/") && contentType !== "image/svg+xml";
}

// ---- Component ------------------------------------------------------------

export function AttachmentList({ attachments }: AttachmentListProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>(
    {},
  );

  /**
   * Fetch a signed download URL from the server-side storage and open it.
   * We call a small inline API endpoint that proxies the Supabase signed URL
   * generation. For simplicity, we hit the attachment list endpoint and
   * derive the download URL from the storage_path.
   */
  const handleDownload = useCallback(
    async (attachment: ApprovalAttachment) => {
      setDownloadingId(attachment.id);

      try {
        // Request a signed URL via our API proxy
        const response = await fetch(
          `/api/v1/approvals/${attachment.request_id}/attachments?download=${attachment.id}`,
        );

        if (!response.ok) {
          throw new Error("Failed to generate download link");
        }

        const { url } = await response.json();

        // Open the signed URL in a new tab to trigger the download
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to download attachment",
        );
      } finally {
        setDownloadingId(null);
      }
    },
    [],
  );

  /**
   * Load a thumbnail URL for an image attachment.
   */
  const loadThumbnail = useCallback(
    async (attachment: ApprovalAttachment) => {
      if (thumbnailUrls[attachment.id]) return;

      try {
        const response = await fetch(
          `/api/v1/approvals/${attachment.request_id}/attachments?download=${attachment.id}`,
        );

        if (!response.ok) return;

        const { url } = await response.json();
        setThumbnailUrls((prev) => ({ ...prev, [attachment.id]: url }));
      } catch {
        // Thumbnail loading is best-effort; ignore failures silently
      }
    },
    [thumbnailUrls],
  );

  // ---- Render -------------------------------------------------------------

  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Paperclip className="text-muted-foreground size-4" />
        <h3 className="text-sm font-medium">
          Attachments{" "}
          <span className="text-muted-foreground">
            ({attachments.length})
          </span>
        </h3>
      </div>

      <div className="space-y-2">
        {attachments.map((attachment) => {
          const IconComponent = getFileIcon(attachment.content_type);
          const showThumbnail = isImageType(attachment.content_type);

          // Eagerly request the thumbnail when we encounter an image
          if (showThumbnail && !thumbnailUrls[attachment.id]) {
            loadThumbnail(attachment);
          }

          return (
            <div
              key={attachment.id}
              className="flex items-center gap-3 rounded-md border p-3"
            >
              {/* Thumbnail or icon */}
              {showThumbnail && thumbnailUrls[attachment.id] ? (
                <img
                  src={thumbnailUrls[attachment.id]}
                  alt={attachment.file_name}
                  className="size-10 shrink-0 rounded object-cover"
                />
              ) : (
                <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded">
                  <IconComponent className="text-muted-foreground size-5" />
                </div>
              )}

              {/* File info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {attachment.file_name}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {attachment.content_type.split("/").pop()}
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    {formatFileSize(attachment.file_size)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(attachment.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>

              {/* Download button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownload(attachment)}
                disabled={downloadingId === attachment.id}
              >
                <Download className="size-4" />
                <span className="sr-only">Download {attachment.file_name}</span>
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
