import { LanguageDetectionService } from "./language-detection.service";

describe("LanguageDetectionService", () => {
  let service: LanguageDetectionService;

  beforeEach(() => {
    service = new LanguageDetectionService();
  });

  it("detects portuguese questions", () => {
    expect(service.detect("Onde esta minha fatura?")).toMatchObject({
      detectedLanguage: "pt",
      usedFallback: false,
    });
  });

  it("detects english questions", () => {
    expect(service.detect("Where is my invoice?")).toMatchObject({
      detectedLanguage: "en",
      usedFallback: false,
    });
    expect(service.getResponseInstruction("en")).toContain("answer in English");
  });

  it("detects spanish questions", () => {
    expect(service.detect("¿Dónde está mi factura?")).toMatchObject({
      detectedLanguage: "es",
      usedFallback: false,
    });
    expect(service.getResponseInstruction("es")).toContain(
      "Debes responder en español",
    );
  });

  it("falls back safely when the language is uncertain", () => {
    expect(service.detect("12345 ???")).toMatchObject({
      detectedLanguage: "pt",
      usedFallback: true,
    });
  });

  it("keeps portuguese as the explicit fallback instruction when needed", () => {
    expect(service.getResponseInstruction("pt")).toContain(
      "responder em português",
    );
  });
});
