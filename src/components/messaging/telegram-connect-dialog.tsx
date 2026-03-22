"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MessagingConnection } from "@/lib/types/database";

interface TelegramConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (connection: MessagingConnection) => void;
}

export function TelegramConnectDialog({
  open,
  onOpenChange,
  onSuccess,
}: TelegramConnectDialogProps) {
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!botToken.trim() || !chatId.trim()) {
      toast.error("Both Bot Token and Chat ID are required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/messaging/telegram/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bot_token: botToken.trim(),
          chat_id: chatId.trim(),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to connect Telegram");
      }

      const { connection } = await res.json();
      toast.success("Telegram connected successfully");
      setBotToken("");
      setChatId("");
      onSuccess(connection);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to connect Telegram",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Telegram</DialogTitle>
          <DialogDescription>
            Enter your Telegram bot token and chat ID to receive approval
            notifications.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="telegram-bot-token">Bot Token</Label>
            <Input
              id="telegram-bot-token"
              type="password"
              placeholder="123456789:ABCdefGhIjKlMnOpQrStUvWxYz"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Create a bot with{" "}
              <a
                href="https://t.me/BotFather"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                @BotFather
              </a>{" "}
              on Telegram and paste the token here.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telegram-chat-id">Chat ID</Label>
            <Input
              id="telegram-chat-id"
              placeholder="-1001234567890"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Use{" "}
              <a
                href="https://t.me/userinfobot"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                @userinfobot
              </a>{" "}
              to get your chat ID, or use a group chat ID (starts with -100).
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Connecting..." : "Connect"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
