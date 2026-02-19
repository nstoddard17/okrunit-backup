import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Filter bar skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-[150px]" />
        <Skeleton className="h-9 w-[150px]" />
        <Skeleton className="h-9 w-[180px]" />
      </div>

      {/* Approval cards skeleton */}
      <div className="grid gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-6">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <Skeleton className="h-5 w-[280px]" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-4 w-full max-w-[400px]" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
