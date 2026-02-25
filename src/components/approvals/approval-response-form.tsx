"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle } from "lucide-react";

interface ApprovalResponseFormProps {
  onRespond: (decision: "approved" | "rejected", comment: string) => void;
  isLoading: boolean;
}

export function ApprovalResponseForm({
  onRespond,
  isLoading,
}: ApprovalResponseFormProps) {
  const [comment, setComment] = useState("");

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="decision-comment">Comment (optional)</Label>
        <Textarea
          id="decision-comment"
          placeholder="Add a comment about your decision..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          disabled={isLoading}
        />
      </div>

      <div className="flex gap-3">
        <Button
          variant="success"
          onClick={() => onRespond("approved", comment)}
          disabled={isLoading}
          className="flex-1"
        >
          <CheckCircle className="size-4" />
          Approve
        </Button>
        <Button
          variant="destructive"
          onClick={() => onRespond("rejected", comment)}
          disabled={isLoading}
          className="flex-1"
        >
          <XCircle className="size-4" />
          Reject
        </Button>
      </div>
    </div>
  );
}
