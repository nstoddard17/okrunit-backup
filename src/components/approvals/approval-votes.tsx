"use client";

// ---------------------------------------------------------------------------
// OKrunit -- Approval Votes: Progress display with live updates
// ---------------------------------------------------------------------------

import { useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRealtime } from "@/hooks/use-realtime";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, XCircle } from "lucide-react";
import type { ApprovalVote } from "@/lib/types/database";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ApprovalVotesProps {
  requestId: string;
  requiredApprovals: number;
  currentApprovals: number;
  votes: ApprovalVote[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(userId: string): string {
  // Display first two characters of the user ID as a fallback
  return userId.slice(0, 2).toUpperCase();
}

function voteVariant(vote: "approve" | "reject") {
  return vote === "approve" ? "default" : "destructive";
}

function voteLabel(vote: "approve" | "reject") {
  return vote === "approve" ? "Approved" : "Rejected";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ApprovalVotes({
  requestId,
  requiredApprovals,
  currentApprovals: initialCurrentApprovals,
  votes: initialVotes,
}: ApprovalVotesProps) {
  const [votes, setVotes] = useState<ApprovalVote[]>(initialVotes);
  const [currentApprovals, setCurrentApprovals] = useState(initialCurrentApprovals);

  // Live-update votes via Realtime subscription
  const onInsert = useCallback(
    (newVote: ApprovalVote) => {
      if (newVote.request_id !== requestId) return;

      setVotes((prev) => {
        // Deduplicate in case we already have this vote
        if (prev.some((v) => v.id === newVote.id)) return prev;
        return [...prev, newVote];
      });

      if (newVote.vote === "approve") {
        setCurrentApprovals((prev) => prev + 1);
      }
    },
    [requestId],
  );

  useRealtime<ApprovalVote>({
    table: "approval_votes",
    filter: `request_id=eq.${requestId}`,
    event: "INSERT",
    onInsert,
  });

  // Progress calculation
  const progressPct = Math.min(
    Math.round((currentApprovals / requiredApprovals) * 100),
    100,
  );

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground font-medium">
            Approval progress
          </span>
          <span className="font-medium">
            {currentApprovals} of {requiredApprovals} approvals received
          </span>
        </div>
        <div className="bg-secondary h-2.5 w-full overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Vote list */}
      {votes.length > 0 && (
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm font-medium">Votes</p>
          <ul className="divide-border divide-y rounded-md border">
            {votes.map((vote) => (
              <li
                key={vote.id}
                className="flex items-center gap-3 px-3 py-2.5"
              >
                <Avatar size="sm">
                  <AvatarFallback>{getInitials(vote.user_id)}</AvatarFallback>
                </Avatar>

                <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {vote.vote === "approve" ? (
                      <CheckCircle2 className="size-4 shrink-0 text-green-600" />
                    ) : (
                      <XCircle className="size-4 shrink-0 text-red-600" />
                    )}
                    <Badge variant={voteVariant(vote.vote)} className="text-xs">
                      {voteLabel(vote.vote)}
                    </Badge>
                    {vote.source && (
                      <span className="text-muted-foreground text-xs capitalize">
                        via {vote.source}
                      </span>
                    )}
                  </div>

                  <span className="text-muted-foreground shrink-0 text-xs">
                    {formatDistanceToNow(new Date(vote.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>

                {vote.comment && (
                  <p className="text-muted-foreground ml-9 text-xs">
                    {vote.comment}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
