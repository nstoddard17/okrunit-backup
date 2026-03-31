"use client";

// ---------------------------------------------------------------------------
// OKrunit -- Approval Comments: Threaded Comment List + Reply Form
// ---------------------------------------------------------------------------

import { useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type { ApprovalComment, UserProfile } from "@/lib/types/database";
import { useRealtime } from "@/hooks/use-realtime";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ---- Types ----------------------------------------------------------------

interface ApprovalCommentsProps {
  requestId: string;
  comments: ApprovalComment[];
  onCommentAdded: (comment: ApprovalComment) => void;
  onCommentDeleted?: (commentId: string) => void;
  userProfiles?: Map<string, UserProfile>;
  connectionNames?: Map<string, string>;
  currentUserId?: string;
  currentUserRole?: string;
}

// ---- Helpers --------------------------------------------------------------

const SOURCE_LABELS: Record<string, string> = {
  zapier: "Zapier",
  make: "Make",
  "make.com": "Make",
  n8n: "n8n",
  api: "API",
  dashboard: "User",
};

const SOURCE_LOGOS: Record<string, string> = {
  zapier: "/logos/platforms/zapier.png",
  make: "/logos/platforms/make.png",
  "make.com": "/logos/platforms/make.png",
  n8n: "/logos/platforms/n8n.png",
  slack: "/logos/platforms/slack.png",
  discord: "/logos/platforms/discord.png",
  teams: "/logos/platforms/teams.png",
  telegram: "/logos/platforms/telegram.png",
  github: "/logos/platforms/github.png",
  monday: "/logos/platforms/monday.png",
  pipedream: "/logos/platforms/pipedream.png",
};

function getAuthorName(
  comment: ApprovalComment,
  userProfiles?: Map<string, UserProfile>,
  connectionNames?: Map<string, string>,
): string {
  if (comment.source && comment.source !== "dashboard" && comment.source !== "api") {
    return SOURCE_LABELS[comment.source] ?? comment.source;
  }
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
  if (comment.source && comment.source !== "dashboard" && comment.source !== "api") {
    return comment.source[0].toUpperCase();
  }
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

function getSourceBadge(comment: ApprovalComment): { label: string; variant: "secondary" | "outline" } {
  if (comment.source && comment.source !== "dashboard" && comment.source !== "api") {
    return { label: "App", variant: "outline" };
  }
  if (comment.user_id) return { label: "User", variant: "secondary" };
  return { label: "API", variant: "outline" };
}

// ---- Component ------------------------------------------------------------

export function ApprovalComments({
  requestId,
  comments,
  onCommentAdded,
  onCommentDeleted,
  userProfiles,
  connectionNames,
  currentUserId,
  currentUserRole,
}: ApprovalCommentsProps) {
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isAdmin = currentUserRole === "owner" || currentUserRole === "admin";

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

  // ---- Delete handler -----------------------------------------------------

  async function handleDelete(commentId: string) {
    setDeletingId(commentId);
    try {
      const res = await fetch(
        `/api/v1/approvals/${requestId}/comments?comment_id=${commentId}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to delete comment");
      }
      onCommentDeleted?.(commentId);
      toast.success("Comment deleted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete comment",
      );
    } finally {
      setDeletingId(null);
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
          className="shrink-0 h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
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
          {comments.map((comment) => {
            const canDelete = isAdmin || comment.user_id === currentUserId;
            const badge = getSourceBadge(comment);

            return (
              <div key={comment.id} className="group/comment flex items-center gap-2.5">
                <div className="flex flex-1 min-w-0 gap-2.5">
                  <Avatar className="size-7 shrink-0 mt-0.5">
                    {comment.source && SOURCE_LOGOS[comment.source] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <AvatarImage src={SOURCE_LOGOS[comment.source]} alt={SOURCE_LABELS[comment.source] ?? comment.source} />
                    )}
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
                        variant={badge.variant}
                        className="text-[9px] px-1 py-0 shrink-0"
                      >
                        {badge.label}
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

                {canDelete && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        disabled={deletingId === comment.id}
                        className="opacity-0 group-hover/comment:opacity-100 transition-opacity shrink-0 p-1 rounded text-muted-foreground/40 hover:text-destructive cursor-pointer"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Delete comment</TooltipContent>
                  </Tooltip>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
