import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/ui/page-container";

export default function WebhooksLoading() {
  return (
    <PageContainer wide>
      {/* Page header skeleton */}
      <div className="flex items-start justify-between gap-4 pb-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-[220px]" />
          <Skeleton className="h-4 w-[400px]" />
        </div>
      </div>

      {/* Filter bar skeleton */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Skeleton className="h-9 w-[180px]" />
        <Skeleton className="h-9 w-[220px]" />
        <Skeleton className="h-9 w-[180px]" />
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-xl border-0 shadow-[var(--shadow-card)]">
        {/* Table header */}
        <div className="flex items-center gap-4 border-b bg-muted/30 px-4 py-3">
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
    </PageContainer>
  );
}
