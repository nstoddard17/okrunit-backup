// Windmill Script: Add Comment to OKRunit Approval
// Resource type: gatekeeper

type Gatekeeper = {
  api_key: string;
  api_url: string;
};

export async function main(
  gatekeeper: Gatekeeper,
  approval_id: string,
  body: string,
) {
  const response = await fetch(
    `${gatekeeper.api_url}/api/v1/approvals/${approval_id}/comments`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${gatekeeper.api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ body }),
    },
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(
      `OKRunit API error (${response.status}): ${err.error ?? JSON.stringify(err)}`,
    );
  }

  return await response.json();
}
