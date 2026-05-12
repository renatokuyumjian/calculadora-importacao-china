import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { calculateImport, calculateQuote, defaultInput, defaultQuoteInput } from "../shared/importCalculator";
import { buildPdfBuffer, buildQuotePdfBuffer } from "./routers";

describe("relatório PDF de importação", () => {
  it("inclui resumo executivo, tributos, créditos, débitos, landed cost e container no modelo legado", async () => {
    const input = {
      ...defaultInput,
      ncm: "33072010",
      description: "Desodorante corporal simulado",
      salePriceBrl: 25000,
    };
    const result = calculateImport(input);
    const pdf = await buildPdfBuffer("Orçamento de validação", input, result);
    const dir = mkdtempSync(join(tmpdir(), "import-report-"));
    const pdfPath = join(dir, "relatorio.pdf");
    const textPath = join(dir, "relatorio.txt");

    writeFileSync(pdfPath, pdf);
    execFileSync("pdftotext", [pdfPath, textPath]);
    const text = readFileSync(textPath, "utf8");

    expect(text).toContain("Resumo executivo");
    expect(text).toContain("Tributos de importação");
    expect(text).toContain("Custo nacionalizado total");
    expect(text).toContain("Débitos, créditos e resultado fiscal na venda");
    expect(text).toContain("Créditos aproveitáveis estimados");
    expect(text).toContain("Aproveitamento de container");
  });

  it("inclui múltiplos produtos/NCMs, cartons e CBM no relatório consolidado", async () => {
    const input = {
      ...defaultQuoteInput,
      items: [
        {
          ...defaultQuoteInput.items[0],
          id: "a",
          ncm: "33072010",
          description: "Produto A",
          quantity: 100,
          unitPriceUsd: 2,
          unitsPerCarton: 20,
          cartonLengthCm: 50,
          cartonWidthCm: 40,
          cartonHeightCm: 30,
        },
        {
          ...defaultQuoteInput.items[0],
          id: "b",
          ncm: "85171231",
          description: "Produto B",
          quantity: 50,
          unitPriceUsd: 3,
          unitsPerCarton: 10,
          cartonLengthCm: 60,
          cartonWidthCm: 40,
          cartonHeightCm: 30,
        },
      ],
    };
    const result = calculateQuote(input);
    const pdf = await buildQuotePdfBuffer("Orçamento multi-NCM", input, result);
    const dir = mkdtempSync(join(tmpdir(), "import-report-multi-"));
    const pdfPath = join(dir, "relatorio.pdf");
    const textPath = join(dir, "relatorio.txt");

    writeFileSync(pdfPath, pdf);
    execFileSync("pdftotext", [pdfPath, textPath]);
    const text = readFileSync(textPath, "utf8");

    expect(text).toContain("33072010");
    expect(text).toContain("85171231");
    expect(text).toContain("Itens do orçamento");
    expect(text).toContain("Cartons");
    expect(text).toContain("CBM");
    expect(text).toContain("FOB total");
  });
});
