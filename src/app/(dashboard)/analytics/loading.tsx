import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/ui/page-container";

export default function AnalyticsLoading() {
  return (
    <PageContainer wide>
      {/* Page header skeleton */}
      <div className="flex items-start justify-between gap-4 pb-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-[140px]" />
          <Skeleton className="h-4 w-[320px]" />
        </div>
      </div>

      {/* Stats cards skeleton — 4 column grid matching actual page */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border-0 p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3 w-[90px]" />
                <Skeleton className="h-8 w-[60px]" />
              </div>
              <Skeleton className="size-10 rounded-lg" />
            </div>
            <Skeleton className="mt-3 h-3 w-[110px]" />
          </div>
        ))}
      </div>

      {/* Charts placeholder */}
      <div className="mt-8 flex items-center justify-center py-12">
        <Skeleton className="h-4 w-[240px]" />
      </div>
    </PageContainer>
  );
}
