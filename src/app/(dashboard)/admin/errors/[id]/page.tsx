import { ErrorDetailView } from "@/components/admin/errors/error-detail-view";

export const metadata = {
  title: "Error Detail - Admin - OKrunit",
};

export default async function AdminErrorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ErrorDetailView issueId={id} />;
}
