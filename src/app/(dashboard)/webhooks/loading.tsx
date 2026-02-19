import { Skeleton } from "@/components/ui/skeleton";

export default function WebhooksLoading() {
  return (
    <div className="space-y-6">
      {/* Page heading skeleton */}
      <div className="space-y-1">
        <Skeleton className="h-8 w-[220px]" />
        <Skeleton className="h-4 w-[400px]" />
      </div>

      {/* Filter bar skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Skeleton className="h-9 w-[180px]" />
        <Skeleton className="h-9 w-[220px]" />
        <Skeleton className="h-9 w-[180px]" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border">
        {/* Table header */}
        <div className="flex items-center gap-4 border-b px-4 py-3">
          <Skeleton className="h-4 w-6" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[70px]" />
          <Skeleton className="h-4 w-[160px]" />
          <Skeleton className="h-4 w-[50px]" />
          <Skeleton className="h-4 w-[60px]" />
          <Skeleton className="h-4 w-[70px]" />
          <Skeleton className="h-4 w-[50px]" />
          <Skeleton className="h-4 w-[100px]" />
        </div>

        {/* Table rows */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0"
          >
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-5 w-[65px] rounded-full" />
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-4 w-[40px]" />
            <Skeleton className="h-4 w-[36px]" />
            <Skeleton className="h-4 w-[60px]" />
            <Skeleton className="h-4 w-[20px]" />
            <Skeleton className="h-4 w-[90px]" />
          </div>
        ))}
      </div>
    </div>
  );
}
