import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-[140px]" />
        <Skeleton className="h-4 w-[320px]" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border py-6 shadow-sm">
            <div className="flex items-center justify-between px-6 pb-2">
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <div className="space-y-2 px-6 pt-4">
              <Skeleton className="h-7 w-[80px]" />
              <Skeleton className="h-3 w-[140px]" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts skeleton (2 col grid) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border py-6 shadow-sm">
            <div className="space-y-2 px-6 pb-4">
              <Skeleton className="h-5 w-[180px]" />
              <Skeleton className="h-4 w-[280px]" />
            </div>
            <div className="px-6">
              <Skeleton className="h-[300px] w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Full-width chart skeleton */}
      <div className="rounded-xl border py-6 shadow-sm">
        <div className="space-y-2 px-6 pb-4">
          <Skeleton className="h-5 w-[200px]" />
          <Skeleton className="h-4 w-[320px]" />
        </div>
        <div className="px-6">
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
