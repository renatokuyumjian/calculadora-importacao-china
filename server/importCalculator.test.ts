import { describe, expect, it } from "vitest";
import { calculateImport, calculateQuote, defaultInput, defaultQuoteInput } from "../shared/importCalculator";

describe("calculateImport", () => {
  it("calcula valor aduaneiro, II e IPI-Importação com base no CIF somado ao II", () => {
    const result = calculateImport({
      ...defaultInput,
      fobUsd: 10000,
      internationalFreightUsd: 1000,
      insuranceUsd: 0,
      exchangeRate: 5,
      iiRate: 10,
      ipiImportRate: 5,
      pisImportRate: 0,
      cofinsImportRate: 0,
      icmsImportRate: 0,
      afrmmBrl: 0,
      capataziaBrl: 0,
      otherImportCostsBrl: 0,
    });

    expect(result.customsValueBrl).toBe(55000);
    expect(result.iiBrl).toBe(5500);
    expect(result.ipiImportBaseBrl).toBe(60500);
    expect(result.ipiImportBrl).toBe(3025);
  });

  it("calcula ICMS-Importação por dentro incorporando tributos e despesas aduaneiras", () => {
    const result = calculateImport({
      ...defaultInput,
      fobUsd: 1000,
      internationalFreightUsd: 0,
      insuranceUsd: 0,
      exchangeRate: 5,
      iiRate: 10,
      ipiImportRate: 0,
      pisImportRate: 0,
      cofinsImportRate: 0,
      icmsImportRate: 18,
      afrmmBrl: 100,
      capataziaBrl: 50,
      otherImportCostsBrl: 0,
    });

    const numerator = 5000 + 500 + 100 + 50;
    expect(result.icmsImportBaseBrl).toBeCloseTo(numerator / 0.82, 2);
    expect(result.icmsImportBrl).toBeCloseTo((numerator / 0.82) * 0.18, 2);
  });

  it("zera PIS/COFINS sobre receita quando a venda é configurada como monofásica", () => {
    const result = calculateImport({
      ...defaultInput,
      pisCofinsMode: "monophasic",
      salePriceBrl: 100000,
      pisRevenueRate: 0.65,
      cofinsRevenueRate: 3,
    });

    expect(result.sale.pisRevenueDebitBrl).toBe(0);
    expect(result.sale.cofinsRevenueDebitBrl).toBe(0);
  });

  it("emite alerta visual quando o container excede o limite de peso", () => {
    const result = calculateImport({
      ...defaultInput,
      cbm: 20,
      containerCbmCapacity: 68,
      gwKg: 30000,
      containerWeightCapacityKg: 26000,
    });

    expect(result.container.limitingFactor).toBe("weight");
    expect(result.container.alertLevel).toBe("exceeded");
  });
});

describe("calculateQuote", () => {
  it("consolida múltiplos produtos/NCMs com preço unitário, cartons, CBM e peso", () => {
    const result = calculateQuote({
      ...defaultQuoteInput,
      exchangeRate: 5,
      internationalFreightUsd: 0,
      insuranceUsd: 0,
      afrmmBrl: 0,
      capataziaBrl: 0,
      otherImportCostsBrl: 0,
      salePriceBrl: 0,
      items: [
        {
          ...defaultQuoteInput.items[0],
          id: "a",
          ncm: "33072010",
          description: "Produto A",
          quantity: 100,
          unitPriceUsd: 2,
          unitWeightKg: 0.1,
          unitsPerCarton: 20,
          cartonLengthCm: 50,
          cartonWidthCm: 40,
          cartonHeightCm: 30,
          iiRate: 0,
          ipiImportRate: 0,
          pisImportRate: 0,
          cofinsImportRate: 0,
          icmsImportRate: 0,
          ipiOutputRate: 0,
        },
        {
          ...defaultQuoteInput.items[0],
          id: "b",
          ncm: "85171231",
          description: "Produto B",
          quantity: 50,
          unitPriceUsd: 3,
          unitWeightKg: 0.2,
          unitsPerCarton: 10,
          cartonLengthCm: 60,
          cartonWidthCm: 40,
          cartonHeightCm: 30,
          iiRate: 0,
          ipiImportRate: 0,
          pisImportRate: 0,
          cofinsImportRate: 0,
          icmsImportRate: 0,
          ipiOutputRate: 0,
        },
      ],
    });

    expect(result.totalFobUsd).toBe(350);
    expect(result.totalCartons).toBe(10);
    expect(result.totalCbm).toBeCloseTo(0.66, 4);
    expect(result.totalWeightKg).toBe(20);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]?.fobUsd).toBe(200);
    expect(result.items[1]?.result.fobBrl).toBe(750);
    expect(result.ncmList).toBe("33072010, 85171231");
  });
});
