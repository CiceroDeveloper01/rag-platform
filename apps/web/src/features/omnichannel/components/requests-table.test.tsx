import { fireEvent, render, screen } from "@testing-library/react";
import { RequestsTable } from "./requests-table";

describe("RequestsTable", () => {
  it("renders a loading state while requests are pending", () => {
    render(
      <RequestsTable
        requests={[]}
        pagination={{ total: 0, limit: 20, offset: 0 }}
        filters={{ limit: 20, offset: 0 }}
        isLoading
        error={null}
        onChangeFilters={() => undefined}
      />,
    );

    expect(screen.getByText("Carregando requests")).toBeInTheDocument();
  });

  it("renders rows with omnichannel request data", () => {
    render(
      <RequestsTable
        requests={[
          {
            id: 1,
            channel: "TELEGRAM",
            conversationId: "123",
            senderName: "Cicero",
            senderAddress: "cicero",
            normalizedTextPreview: "Preciso do manual",
            status: "PROCESSED",
            receivedAt: "2026-03-13T12:00:00.000Z",
            processedAt: "2026-03-13T12:00:01.000Z",
            latencyMs: 120,
            usedRag: true,
          },
        ]}
        pagination={{ total: 1, limit: 20, offset: 0 }}
        filters={{ limit: 20, offset: 0 }}
        isLoading={false}
        error={null}
        onChangeFilters={() => undefined}
      />,
    );

    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getAllByText("TELEGRAM").length).toBeGreaterThan(0);
    expect(screen.getByText("Preciso do manual")).toBeInTheDocument();
    expect(screen.getByText("120 ms")).toBeInTheDocument();
  });

  it("renders the empty state and error state branches", () => {
    const { rerender } = render(
      <RequestsTable
        requests={[]}
        pagination={{ total: 0, limit: 20, offset: 0 }}
        filters={{ limit: 20, offset: 0 }}
        isLoading={false}
        error={null}
        onChangeFilters={() => undefined}
      />,
    );

    expect(
      screen.getByText(
        "Nenhuma requisicao encontrada para os filtros selecionados.",
      ),
    ).toBeInTheDocument();

    rerender(
      <RequestsTable
        requests={[]}
        pagination={{ total: 0, limit: 20, offset: 0 }}
        filters={{ limit: 20, offset: 0 }}
        isLoading={false}
        error="gateway unavailable"
        onChangeFilters={() => undefined}
      />,
    );

    expect(screen.getByText("gateway unavailable")).toBeInTheDocument();
  });

  it("updates filters and pagination controls", () => {
    const onChangeFilters = vi.fn();

    render(
      <RequestsTable
        requests={[
          {
            id: 1,
            channel: "TELEGRAM",
            conversationId: "123",
            senderName: null,
            senderAddress: null,
            normalizedTextPreview: "Preciso do manual",
            status: "FAILED",
            receivedAt: "2026-03-13T12:00:00.000Z",
            processedAt: "2026-03-13T12:00:01.000Z",
            latencyMs: null,
            usedRag: false,
          },
        ]}
        pagination={{ total: 45, limit: 20, offset: 20 }}
        filters={{ limit: 20, offset: 20, sortOrder: "desc" }}
        isLoading={false}
        error={null}
        onChangeFilters={onChangeFilters}
      />,
    );

    fireEvent.change(screen.getByLabelText("Filtrar por canal"), {
      target: { value: "EMAIL" },
    });
    fireEvent.change(screen.getByLabelText("Filtrar por status"), {
      target: { value: "FAILED" },
    });
    fireEvent.change(screen.getByLabelText("Filtrar por data inicial"), {
      target: { value: "2026-03-01" },
    });
    fireEvent.change(screen.getByLabelText("Filtrar por data final"), {
      target: { value: "2026-03-31" },
    });
    fireEvent.change(screen.getByLabelText("Ordenar por data"), {
      target: { value: "asc" },
    });
    fireEvent.click(screen.getByText("Anterior"));
    fireEvent.click(screen.getByText("Proxima"));

    expect(onChangeFilters).toHaveBeenCalledWith({
      channel: "EMAIL",
      offset: 0,
    });
    expect(onChangeFilters).toHaveBeenCalledWith({
      status: "FAILED",
      offset: 0,
    });
    expect(onChangeFilters).toHaveBeenCalledWith({
      startDate: "2026-03-01",
      offset: 0,
    });
    expect(onChangeFilters).toHaveBeenCalledWith({
      endDate: "2026-03-31",
      offset: 0,
    });
    expect(onChangeFilters).toHaveBeenCalledWith({
      sortOrder: "asc",
      offset: 0,
    });
    expect(onChangeFilters).toHaveBeenCalledWith({
      offset: 0,
    });
    expect(onChangeFilters).toHaveBeenCalledWith({
      offset: 40,
    });
    expect(screen.getByText("Sem nome")).toBeInTheDocument();
    expect(screen.getByText("Direct")).toBeInTheDocument();
    expect(screen.getByText("n/a")).toBeInTheDocument();
  });
});
