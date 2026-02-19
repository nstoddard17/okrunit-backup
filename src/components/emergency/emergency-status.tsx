import { AlertTriangle, CheckCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface EmergencyStatusProps {
  isActive: boolean;
  activatedAt: string | null;
  activatedBy: string | null;
}

export function EmergencyStatus({
  isActive,
  activatedAt,
  activatedBy,
}: EmergencyStatusProps) {
  if (isActive) {
    return (
      <Card className="border-red-500 bg-red-50 dark:bg-red-950/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertTriangle className="size-5" />
            Emergency Stop is ACTIVE
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm text-red-600 dark:text-red-400">
            {activatedAt && (
              <p>
                Activated at:{" "}
                <span className="font-medium">
                  {new Date(activatedAt).toLocaleString()}
                </span>
              </p>
            )}
            {activatedBy && (
              <p>
                Activated by:{" "}
                <span className="font-medium">{activatedBy}</span>
              </p>
            )}
            <p className="mt-3 text-red-700 dark:text-red-300">
              All pending approvals have been cancelled. New approval requests
              are blocked until the emergency stop is deactivated.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-500 bg-green-50 dark:bg-green-950/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
          <CheckCircle className="size-5" />
          System is operating normally
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-green-600 dark:text-green-400">
          Approval requests are being processed as expected. No emergency stop
          is in effect.
        </p>
      </CardContent>
    </Card>
  );
}
