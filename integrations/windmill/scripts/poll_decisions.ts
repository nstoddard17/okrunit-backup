// Windmill Script: Poll for Decided Gatekeeper Approvals
// Use as a trigger in a Windmill flow to detect new approval decisions.
// Resource type: gatekeeper

type Gatekeeper = {
  api_key: string;
  api_url: string;
};

type ApprovalDecision = {
  id: string;
  title: string;
  status: string;
  priority: string;
  decided_by: string | null;
  decided_at: string | null;
  decision_comment: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export async function main(
  gatekeeper: Gatekeeper,
  since: string,
  status_filter?: "approved" | "rejected",
  priority_filter?: "low" | "medium" | "high" | "critical",
): Promise<ApprovalDecision[]> {
  const statuses: string[] = status_filter
    ? [status_filter]
    : ["approved", "rejected"];

  const results: ApprovalDecision[] = [];

  for (const status of statuses) {
    const params = new URLSearchParams({
      status,
      page_size: "50",
    });
    if (priority_filter) params.set("priority", priority_filter);

    const url = `${gatekeeper.api_url}/api/v1/approvals?${params}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${gatekeeper.api_key}`,
      },
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(
        `Gatekeeper API error (${response.status}): ${err.error ?? JSON.stringify(err)}`,
      );
    }

    const data = await response.json();
    const approvals: ApprovalDecision[] = data.data ?? [];

    // Only include approvals decided after the `since` timestamp
    for (const approval of approvals) {
      if (approval.decided_at && approval.decided_at > since) {
        results.push(approval);
      }
    }
  }

  // Sort by decided_at descending (most recent first)
  results.sort((a, b) => {
    const ta = a.decided_at ? new Date(a.decided_at).getTime() : 0;
    const tb = b.decided_at ? new Date(b.decided_at).getTime() : 0;
    return tb - ta;
  });

  return results;
}
