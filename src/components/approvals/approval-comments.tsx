"use client";

// ---------------------------------------------------------------------------
// OKrunit -- Approval Comments: Threaded Comment List + Reply Form
// ---------------------------------------------------------------------------

import { useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { Send } from "lucide-react";
import { toast } from "sonner";

import type { ApprovalComment, UserProfile } from "@/lib/types/database";
import { useRealtime } from "@/hooks/use-realtime";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// ---- Types ----------------------------------------------------------------

interface ApprovalCommentsProps {
  requestId: string;
  comments: ApprovalComment[];
  onCommentAdded: (comment: ApprovalComment) => void;
  userProfiles?: Map<string, UserProfile>;
  connectionNames?: Map<string, string>;
}

// ---- Helpers --------------------------------------------------------------

function getAuthorName(
  comment: ApprovalComment,
  userProfiles?: Map<string, UserProfile>,
  connectionNames?: Map<string, string>,
): string {
  if (comment.user_id) {
    const profile = userProfiles?.get(comment.user_id);
    if (profile?.full_name) return profile.full_name;
    if (profile?.email) return profile.email;
    return comment.user_id.slice(0, 8) + "…";
  }
  if (comment.connection_id) {
    const name = connectionNames?.get(comment.connection_id);
    if (name) return name;
    return "API (" + comment.connection_id.slice(0, 8) + ")";
  }
  return "Unknown";
}

function getAvatarInitials(
  comment: ApprovalComment,
  userProfiles?: Map<string, UserProfile>,
): string {
  if (comment.user_id) {
    const profile = userProfiles?.get(comment.user_id);
    if (profile?.full_name) {
      const parts = profile.full_name.split(" ");
      return parts.length > 1
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0][0].toUpperCase();
    }
    return "U";
  }
  if (comment.connection_id) return "A";
  return "?";
}

// ---- Component ------------------------------------------------------------

export function ApprovalComments({
  requestId,
  comments,
  onCommentAdded,
  userProfiles,
  connectionNames,
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
    <div className="space-y-3">
      {/* Reply form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          placeholder="Write a comment..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={1}
          disabled={isSubmitting}
          className="resize-none text-sm min-h-[36px]"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (body.trim()) handleSubmit(e);
            }
          }}
        />
        <Button
          type="submit"
          size="sm"
          className="shrink-0 h-9"
          disabled={isSubmitting || !body.trim()}
        >
          <Send className="size-3.5" />
        </Button>
      </form>

      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="text-muted-foreground text-xs">No comments yet.</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2.5">
              <Avatar className="size-7 shrink-0">
                <AvatarFallback className="text-[10px]">
                  {getAvatarInitials(comment, userProfiles)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold truncate">
                    {getAuthorName(comment, userProfiles, connectionNames)}
                  </span>
                  <Badge
                    variant={comment.user_id ? "secondary" : "outline"}
                    className="text-[9px] px-1 py-0 shrink-0"
                  >
                    {comment.user_id ? "User" : "API"}
                  </Badge>
                  <span className="text-muted-foreground text-[10px] shrink-0">
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>

                <p className="text-sm whitespace-pre-wrap break-words mt-0.5 leading-relaxed">
                  {comment.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
