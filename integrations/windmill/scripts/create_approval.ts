// Windmill Script: Create Gatekeeper Approval Request
// Resource type: gatekeeper

type Gatekeeper = {
  api_key: string;
  api_url: string;
};

export async function main(
  gatekeeper: Gatekeeper,
  title: string,
  priority: "low" | "medium" | "high" | "critical",
  description?: string,
  action_type?: string,
  callback_url?: string,
  metadata?: Record<string, unknown>,
  expires_at?: string,
  idempotency_key?: string,
  required_approvals?: number,
  context_html?: string,
) {
  const body: Record<string, unknown> = { title, priority };
  if (description) body.description = description;
  if (action_type) body.action_type = action_type;
  if (callback_url) body.callback_url = callback_url;
  if (metadata) body.metadata = metadata;
  if (expires_at) body.expires_at = expires_at;
  if (idempotency_key) body.idempotency_key = idempotency_key;
  if (required_approvals) body.required_approvals = required_approvals;
  if (context_html) body.context_html = context_html;

  const response = await fetch(`${gatekeeper.api_url}/api/v1/approvals`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${gatekeeper.api_key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(
      `Gatekeeper API error (${response.status}): ${err.error ?? JSON.stringify(err)}`,
    );
  }

  return await response.json();
}
