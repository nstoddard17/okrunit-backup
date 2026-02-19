import { AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// ---- Types ----------------------------------------------------------------

interface AnomalyAlertProps {
  /** Human-readable description of the anomaly. */
  reason: string;
  /** ISO timestamp when the anomaly was detected. */
  detectedAt: string;
}

// ---- Component ------------------------------------------------------------

/**
 * Alert card displayed when the anomaly detection system flags unusual
 * activity. Rendered in the emergency / dashboard area.
 */
export function AnomalyAlert({ reason, detectedAt }: AnomalyAlertProps) {
  return (
    <Card className="border-red-500 bg-red-50 dark:bg-red-950/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
          <AlertTriangle className="size-5" />
          Anomaly Detected
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-red-600 dark:text-red-400">
          <p>{reason}</p>
          <p className="text-red-500 dark:text-red-500">
            Detected at:{" "}
            <span className="font-medium">
              {new Date(detectedAt).toLocaleString()}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
