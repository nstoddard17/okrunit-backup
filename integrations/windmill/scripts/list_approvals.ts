// Windmill Script: List/Search OKRunit Approvals
// Resource type: gatekeeper

type Gatekeeper = {
  api_key: string;
  api_url: string;
};

export async function main(
  gatekeeper: Gatekeeper,
  status?: "pending" | "approved" | "rejected" | "cancelled" | "expired",
  priority?: "low" | "medium" | "high" | "critical",
  search?: string,
  page?: number,
  page_size?: number,
) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (priority) params.set("priority", priority);
  if (search) params.set("search", search);
  if (page) params.set("page", String(page));
  if (page_size) params.set("page_size", String(page_size));

  const qs = params.toString();
  const url = `${gatekeeper.api_url}/api/v1/approvals${qs ? `?${qs}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${gatekeeper.api_key}`,
    },
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(
      `OKRunit API error (${response.status}): ${err.error ?? JSON.stringify(err)}`,
    );
  }

  return await response.json();
}
