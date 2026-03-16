import { render, screen } from "@testing-library/react";
import { LanguageDistributionPanel } from "./LanguageDistributionPanel";

describe("LanguageDistributionPanel", () => {
  it("renders the language ranking and executive metrics", () => {
    render(
      <LanguageDistributionPanel
        total={100}
        data={[
          { language: "en", label: "English", count: 48 },
          { language: "pt", label: "Português", count: 32 },
          { language: "es", label: "Español", count: 20 },
        ]}
      />,
    );

    expect(screen.getByText("Idiomas de interacao")).toBeInTheDocument();
    expect(screen.getByText("Idioma dominante")).toBeInTheDocument();
    expect(screen.getAllByText("English")).toHaveLength(2);
    expect(screen.getByText("48% do total")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("shows an empty state when there is no language data", () => {
    render(<LanguageDistributionPanel total={0} data={[]} />);

    expect(
      screen.getByText("Nenhum idioma foi detectado ainda."),
    ).toBeInTheDocument();
  });
});
