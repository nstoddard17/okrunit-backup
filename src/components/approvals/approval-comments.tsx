"use client";

// ---------------------------------------------------------------------------
// Gatekeeper -- Approval Comments: Threaded Comment List + Reply Form
// ---------------------------------------------------------------------------

import { useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";

import type { ApprovalComment } from "@/lib/types/database";
import { useRealtime } from "@/hooks/use-realtime";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

// ---- Types ----------------------------------------------------------------

interface ApprovalCommentsProps {
  requestId: string;
  comments: ApprovalComment[];
  onCommentAdded: (comment: ApprovalComment) => void;
}

// ---- Helpers --------------------------------------------------------------

function truncateId(id: string): string {
  return id.slice(0, 8);
}

function getAuthorLabel(comment: ApprovalComment): string {
  if (comment.user_id) {
    return truncateId(comment.user_id);
  }
  if (comment.connection_id) {
    return truncateId(comment.connection_id);
  }
  return "Unknown";
}

function getAvatarInitials(comment: ApprovalComment): string {
  if (comment.user_id) return "U";
  if (comment.connection_id) return "A";
  return "?";
}

// ---- Component ------------------------------------------------------------

export function ApprovalComments({
  requestId,
  comments,
  onCommentAdded,
}: ApprovalCommentsProps) {
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Subscribe to realtime INSERT events for this request's comments
  const handleRealtimeInsert = useCallback(
    (record: ApprovalComment) => {
      onCommentAdded(record);
    },
    [onCommentAdded],
  );

  useRealtime<ApprovalComment>({
    table: "approval_comments",
    filter: `request_id=eq.${requestId}`,
    event: "INSERT",
    onInsert: handleRealtimeInsert,
  });

  // ---- Submit handler -----------------------------------------------------

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmed = body.trim();
    if (!trimmed) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/v1/approvals/${requestId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: trimmed }),
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to post comment");
      }

      setBody("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to post comment",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // ---- Render -------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="text-muted-foreground size-4" />
        <h3 className="text-sm font-medium">
          Comments{" "}
          {comments.length > 0 && (
            <span className="text-muted-foreground">({comments.length})</span>
          )}
        </h3>
      </div>

      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="text-muted-foreground text-sm">No comments yet.</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className="text-xs">
                  {getAvatarInitials(comment)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {getAuthorLabel(comment)}
                  </span>
                  <Badge
                    variant={comment.user_id ? "secondary" : "outline"}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {comment.user_id ? "User" : "API"}
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>

                <p className="text-sm whitespace-pre-wrap break-words">
                  {comment.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Separator />

      {/* Reply form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          placeholder="Write a comment..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          disabled={isSubmitting}
          className="resize-none"
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting || !body.trim()}
          >
            <Send className="size-4" />
            {isSubmitting ? "Posting..." : "Post Comment"}
          </Button>
        </div>
      </form>
    </div>
  );
}
