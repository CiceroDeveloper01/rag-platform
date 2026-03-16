import { fireEvent, render, screen } from "@testing-library/react";
import { DocumentToolbar } from "./document-toolbar";

describe("DocumentToolbar", () => {
  it("emits search, filter and sort changes", () => {
    const onChange = vi.fn();

    render(
      <DocumentToolbar
        filters={{
          search: "",
          type: "all",
          sort: "newest",
        }}
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByLabelText("Buscar documentos"), {
      target: { value: "postgres" },
    });
    fireEvent.change(screen.getByLabelText("Filtrar documentos por tipo"), {
      target: { value: "pdf" },
    });
    fireEvent.change(screen.getByLabelText("Ordenar documentos"), {
      target: { value: "oldest" },
    });

    expect(onChange).toHaveBeenNthCalledWith(1, { search: "postgres" });
    expect(onChange).toHaveBeenNthCalledWith(2, { type: "pdf" });
    expect(onChange).toHaveBeenNthCalledWith(3, { sort: "oldest" });
  });
});
