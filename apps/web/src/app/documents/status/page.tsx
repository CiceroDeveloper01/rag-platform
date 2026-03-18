import { PageHeader } from "@/src/components/ui/page-header";
import { UploadPanel } from "@/src/features/documents/components/upload-panel";

export default function DocumentStatusPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Documents"
        title="Document processing status"
        description="Track asynchronous ingestion requests, processing steps, and failures through the persisted platform status."
      />

      <UploadPanel />
    </div>
  );
}
