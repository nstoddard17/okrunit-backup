import { Skeleton } from "@/components/ui/skeleton";

export default function ConnectionsLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-1">
        <Skeleton className="h-8 w-[160px]" />
        <Skeleton className="h-4 w-[380px]" />
      </div>

      {/* Create button skeleton */}
      <div className="flex justify-end">
        <Skeleton className="h-9 w-[160px]" />
      </div>

      {/* Connection cards skeleton */}
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-6">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-[200px]" />
                  <Skeleton className="h-4 w-[300px]" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-[140px]" />
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Skeleton className="h-8 w-[70px]" />
                <Skeleton className="h-8 w-[100px]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
