import { OmnichannelRequestDetailsPage } from "@/src/features/omnichannel/components/omnichannel-request-details-page";

export default async function OmnichannelRequestDetailsRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const requestId = Number(resolvedParams.id);

  return <OmnichannelRequestDetailsPage requestId={requestId} />;
}
