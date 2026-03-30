// ---------------------------------------------------------------------------
// OKrunit -- Structured Logger for Performance Monitoring
// ---------------------------------------------------------------------------
// JSON logger that outputs structured logs with timestamps, severity,
// service context, and request timing. Works with Vercel's log drain
// for external aggregation.
//
// Usage:
//   import { logger } from "@/lib/monitoring/logger";
//   logger.info("Request processed", { service: "API", duration_ms: 45 });
//   logger.perf("Slow query", { query: "SELECT ...", duration_ms: 230 });
// ---------------------------------------------------------------------------

type LogLevel = "debug" | "info" | "warn" | "error" | "perf";

interface LogContext {
  service?: string;
  duration_ms?: number;
  user_id?: string;
  org_id?: string;
  request_url?: string;
  request_method?: string;
  status_code?: number;
  [key: string]: unknown;
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  perf: 2,
  warn: 3,
  error: 4,
};

const MIN_LEVEL = (process.env.LOG_LEVEL as LogLevel) ?? "info";

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[MIN_LEVEL];
}

function formatLog(level: LogLevel, message: string, context?: LogContext): string {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };

  // Remove undefined values
  for (const key of Object.keys(entry)) {
    if ((entry as Record<string, unknown>)[key] === undefined) {
      delete (entry as Record<string, unknown>)[key];
    }
  }

  return JSON.stringify(entry);
}

export const logger = {
  debug(message: string, context?: LogContext) {
    if (!shouldLog("debug")) return;
    console.log(formatLog("debug", message, context));
  },

  info(message: string, context?: LogContext) {
    if (!shouldLog("info")) return;
    console.log(formatLog("info", message, context));
  },

  warn(message: string, context?: LogContext) {
    if (!shouldLog("warn")) return;
    console.warn(formatLog("warn", message, context));
  },

  error(message: string, context?: LogContext) {
    if (!shouldLog("error")) return;
    console.error(formatLog("error", message, context));
  },

  /**
   * Log a performance metric. Use for request timing, slow queries, etc.
   * Always logs at "perf" level regardless of LOG_LEVEL.
   */
  perf(message: string, context: LogContext & { duration_ms: number }) {
    if (!shouldLog("perf")) return;
    console.log(formatLog("perf", message, context));
  },

  /**
   * Time a function and log its duration.
   * Returns the function's result.
   */
  async time<T>(
    label: string,
    fn: () => T | Promise<T>,
    context?: Omit<LogContext, "duration_ms">,
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration_ms = Math.round(performance.now() - start);
      if (duration_ms > 100) {
        // Only log if >100ms to reduce noise
        this.perf(label, { ...context, duration_ms });
      }
      return result;
    } catch (err) {
      const duration_ms = Math.round(performance.now() - start);
      this.error(`${label} (failed)`, { ...context, duration_ms });
      throw err;
    }
  },
};
