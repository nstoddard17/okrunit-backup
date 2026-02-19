"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface EmergencyStopButtonProps {
  isActive: boolean;
  orgId: string;
}

export function EmergencyStopButton({
  isActive,
}: EmergencyStopButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleConfirm() {
    setLoading(true);

    try {
      const response = await fetch("/api/v1/emergency-stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !isActive }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to toggle emergency stop");
      }

      const data = await response.json();

      if (!isActive) {
        toast.success(
          `Emergency stop activated. ${data.cancelled_count} pending approval(s) cancelled.`,
        );
      } else {
        toast.success("Emergency stop deactivated. System is back to normal.");
      }

      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to toggle emergency stop",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          size="lg"
          className={
            isActive
              ? "h-16 w-full text-lg font-bold"
              : "h-16 w-full text-lg font-bold bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
          }
        >
          {isActive
            ? "DEACTIVATE EMERGENCY STOP"
            : "ACTIVATE EMERGENCY STOP"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            {isActive
              ? "This will allow new approval requests to be created again."
              : "This will cancel ALL pending approvals and block new ones until deactivated."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading
              ? "Processing..."
              : isActive
                ? "Deactivate"
                : "Activate Emergency Stop"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
