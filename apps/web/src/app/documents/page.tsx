import { PageHeader } from "@/src/components/ui/page-header";
import { UploadPanel } from "@/src/features/documents/components/upload-panel";

export default function DocumentsPage() {
  return (
    <div className="space-y-8">

      <PageHeader
        eyebrow="Documents"
        title="Ingestao e acompanhamento de documentos."
        description="Envie arquivos PDF ou TXT, acompanhe o progresso da ingestao e consulte a base local ou a listagem retornada pela API."
      />

      <UploadPanel />

    </div>
  );
}
