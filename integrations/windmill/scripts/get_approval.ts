// Windmill Script: Get OKRunit Approval by ID
// Resource type: gatekeeper

type Gatekeeper = {
  api_key: string;
  api_url: string;
};

export async function main(gatekeeper: Gatekeeper, approval_id: string) {
  const response = await fetch(
    `${gatekeeper.api_url}/api/v1/approvals/${approval_id}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${gatekeeper.api_key}`,
      },
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
