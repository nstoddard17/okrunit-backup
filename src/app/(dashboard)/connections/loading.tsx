import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/ui/page-container";

export default function ConnectionsLoading() {
  return (
    <PageContainer>
      {/* Page header skeleton */}
      <div className="flex items-start justify-between gap-4 pb-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-[160px]" />
          <Skeleton className="h-4 w-[420px]" />
        </div>
      </div>

      {/* Connection cards skeleton */}
      <div className="space-y-3">
        {/* Create button */}
        <div className="flex justify-end">
          <Skeleton className="h-9 w-[170px]" />
        </div>

        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border-0 p-6 shadow-[var(--shadow-card)]"
            >
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
    </PageContainer>
  );
}
