import { ConversationDetailsPage } from "@/src/features/operations/components/conversation-details-page";

export default async function ConversationDetailsRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;

  return <ConversationDetailsPage id={resolvedParams.id} />;
}
