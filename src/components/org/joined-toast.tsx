"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

export function JoinedToast() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("joined") === "true") {
      toast.success("You've joined the organization!", {
        description: "You're now a member and can start collaborating.",
      });
      // Clean up the URL param
      router.replace("/org/overview", { scroll: false });
    }
  }, [searchParams, router]);

  return null;
}
