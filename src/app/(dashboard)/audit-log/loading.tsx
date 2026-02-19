import { Skeleton } from "@/components/ui/skeleton";

export default function AuditLogLoading() {
  return (
    <div className="space-y-6">
      {/* Page heading skeleton */}
      <div className="space-y-1">
        <Skeleton className="h-8 w-[160px]" />
        <Skeleton className="h-4 w-[380px]" />
      </div>

      {/* Filter bar skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Skeleton className="h-9 w-[180px]" />
        <Skeleton className="h-9 w-[180px]" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border">
        {/* Table header */}
        <div className="flex items-center gap-4 border-b px-4 py-3">
          <Skeleton className="h-4 w-[120px]" />
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-4 w-[140px]" />
          <Skeleton className="h-4 w-[100px]" />
        </div>

        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0"
          >
            <Skeleton className="h-4 w-[120px]" />
            <Skeleton className="h-5 w-[70px] rounded-full" />
            <Skeleton className="h-4 w-[90px]" />
            <Skeleton className="h-4 w-[80px]" />
            <Skeleton className="h-4 w-[130px]" />
            <Skeleton className="h-4 w-[100px]" />
          </div>
        ))}
      </div>
    </div>
  );
}
