import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/ui/page-container";

export default function RulesLoading() {
  return (
    <PageContainer>
      {/* Page header skeleton */}
      <div className="flex items-start justify-between gap-4 pb-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-[80px]" />
          <Skeleton className="h-4 w-[460px]" />
        </div>
      </div>

      {/* Create button */}
      <div className="mb-4 flex justify-end">
        <Skeleton className="h-9 w-[140px]" />
      </div>

      {/* Rule cards skeleton */}
      <div className="grid gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border-0 p-6 shadow-[var(--shadow-card)]"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-[220px]" />
                  <Skeleton className="h-4 w-[340px]" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-9 rounded-full" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-[80px] rounded-full" />
                <Skeleton className="h-5 w-[60px] rounded-full" />
                <Skeleton className="h-5 w-[100px] rounded-full" />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Skeleton className="h-8 w-[60px]" />
                <Skeleton className="h-8 w-[70px]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
