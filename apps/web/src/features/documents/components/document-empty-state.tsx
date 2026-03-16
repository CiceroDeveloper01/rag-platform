import { EmptyState } from "@/src/components/ui/empty-state";

export function DocumentEmptyState({ description }: { description: string }) {
  return (
    <EmptyState title="Nenhum documento listado" description={description} />
  );
}
