import { describe, expect, it } from "vitest";
import { calculateBasicNationalization, calculateProduct, defaultProduct, type ProductInput } from "../shared/nationalizationBasics";

function product(overrides: Partial<ProductInput>): ProductInput {
  return {
    ...defaultProduct,
    ...overrides,
  };
}

describe("nationalizationBasics", () => {
  it("converte premissas em USD para BRL e mantém premissas em BRL", () => {
    const result = calculateBasicNationalization({
      exchangeRate: 5,
      premises: [
        { key: "freight", label: "Frete", value: 100, currency: "USD" },
        { key: "capatazias", label: "Capatazias", value: 250, currency: "BRL" },
      ],
      products: [],
    });

    expect(result.premises[0].valueBrl).toBe(500);
    expect(result.premises[1].valueBrl).toBe(250);
    expect(result.totalPremisesBrl).toBe(750);
  });

  it("calcula cartons arredondando para cima para atingir a quantidade desejada", () => {
    const calculatedProduct = calculateProduct(product({
      id: "p1",
      description: "Produto teste",
      ncm: "1234.56.78",
      desiredQuantity: 101,
      unitsPerCarton: 20,
      fobUnitUsd: 0,
      grossWeightPerCartonKg: 8,
      netWeightPerCartonKg: 7,
      cartonHeightCm: 40,
      cartonWidthCm: 30,
      cartonLengthCm: 50,
    }));

    expect(calculatedProduct.cartons).toBe(6);
    expect(calculatedProduct.orderedUnits).toBe(120);
    expect(calculatedProduct.extraUnits).toBe(19);
  });

  it("calcula peso bruto, peso líquido e CBM totais por produto e no consolidado", () => {
    const result = calculateBasicNationalization({
      exchangeRate: 5,
      premises: [],
      products: [
        product({
          id: "p1",
          description: "Produto A",
          ncm: "1111.11.11",
          desiredQuantity: 100,
          unitsPerCarton: 10,
          fobUnitUsd: 0,
          grossWeightPerCartonKg: 12,
          netWeightPerCartonKg: 10,
          cartonHeightCm: 50,
          cartonWidthCm: 40,
          cartonLengthCm: 30,
        }),
        product({
          id: "p2",
          description: "Produto B",
          ncm: "2222.22.22",
          desiredQuantity: 45,
          unitsPerCarton: 12,
          fobUnitUsd: 0,
          grossWeightPerCartonKg: 6,
          netWeightPerCartonKg: 5,
          cartonHeightCm: 25,
          cartonWidthCm: 20,
          cartonLengthCm: 40,
        }),
      ],
    });

    expect(result.products[0].cartons).toBe(10);
    expect(result.products[0].totalGrossWeightKg).toBe(120);
    expect(result.products[0].totalNetWeightKg).toBe(100);
    expect(result.products[0].totalCbm).toBeCloseTo(0.6, 6);

    expect(result.products[1].cartons).toBe(4);
    expect(result.products[1].totalGrossWeightKg).toBe(24);
    expect(result.products[1].totalNetWeightKg).toBe(20);
    expect(result.products[1].totalCbm).toBeCloseTo(0.08, 6);

    expect(result.totalCartons).toBe(14);
    expect(result.totalGrossWeightKg).toBe(144);
    expect(result.totalNetWeightKg).toBe(120);
    expect(result.totalCbm).toBeCloseTo(0.68, 6);
  });

  it("calcula FOB unitário e total em USD e BRL usando o câmbio das premissas", () => {
    const result = calculateBasicNationalization({
      exchangeRate: 5.2,
      premises: [],
      products: [
        product({
          id: "p1",
          description: "Produto com FOB",
          ncm: "9999.99.99",
          desiredQuantity: 125,
          unitsPerCarton: 50,
          fobUnitUsd: 3.5,
          grossWeightPerCartonKg: 0,
          netWeightPerCartonKg: 0,
          cartonHeightCm: 0,
          cartonWidthCm: 0,
          cartonLengthCm: 0,
        }),
      ],
    });

    expect(result.products[0].fobUnitUsd).toBe(3.5);
    expect(result.products[0].fobTotalUsd).toBe(437.5);
    expect(result.products[0].fobUnitBrl).toBeCloseTo(18.2, 6);
    expect(result.products[0].fobTotalBrl).toBeCloseTo(2275, 6);
  });

  it("calcula impostos de importação por item usando valor aduaneiro, alíquotas e ICMS por dentro", () => {
    const result = calculateBasicNationalization({
      exchangeRate: 5,
      premises: [
        { key: "freight", label: "Frete", value: 100, currency: "USD" },
        { key: "capatazias", label: "Capatazias", value: 100, currency: "BRL" },
      ],
      products: [
        product({
          id: "p1",
          description: "Produto tributado",
          ncm: "1111.11.11",
          desiredQuantity: 100,
          unitsPerCarton: 10,
          fobUnitUsd: 10,
          iiRate: 10,
          ipiImportRate: 5,
          pisImportRate: 2,
          cofinsImportRate: 8,
          icmsImportRate: 18,
        }),
      ],
    });

    const calculatedProduct = result.products[0];

    expect(calculatedProduct.fobTotalBrl).toBe(5000);
    expect(calculatedProduct.allocatedFreightBrl).toBe(500);
    expect(calculatedProduct.allocatedAduaneiraCostsBrl).toBe(0);
    expect(calculatedProduct.allocatedCapataziasBrl).toBe(100);
    expect(calculatedProduct.allocatedOtherCostsBrl).toBe(100);
    expect(calculatedProduct.customsValueBrl).toBe(5500);
    expect(calculatedProduct.iiBrl).toBe(550);
    expect(calculatedProduct.ipiImportBaseBrl).toBe(6050);
    expect(calculatedProduct.ipiImportBrl).toBe(302.5);
    expect(calculatedProduct.pisImportBrl).toBe(110);
    expect(calculatedProduct.cofinsImportBrl).toBe(440);
    expect(calculatedProduct.icmsImportBaseBrl).toBeCloseTo(8417.682927, 6);
    expect(calculatedProduct.icmsImportBrl).toBeCloseTo(1515.182927, 6);
    expect(calculatedProduct.importTaxesBrl).toBeCloseTo(2917.682927, 6);
    expect(calculatedProduct.landedCostBrl).toBeCloseTo(8517.682927, 6);
    expect(calculatedProduct.unitLandedCostBrl).toBeCloseTo(85.176829, 6);
  });

  it("exclui despesas portuárias brasileiras, capatazias nacionais e frete rodoviário nacional da base do ICMS, mas mantém todos no custo nacionalizado", () => {
    const result = calculateBasicNationalization({
      exchangeRate: 5,
      premises: [
        { key: "freight", label: "Frete", value: 100, currency: "USD" },
        { key: "portExpenses", label: "Despesas Portuárias", value: 500, currency: "BRL" },
        { key: "capatazias", label: "Capatazias", value: 100, currency: "BRL" },
        { key: "roadFreight", label: "Frete Rodoviário", value: 1000, currency: "BRL" },
      ],
      products: [
        product({
          id: "p1",
          description: "Produto com frete nacional",
          ncm: "1111.11.11",
          desiredQuantity: 100,
          unitsPerCarton: 10,
          fobUnitUsd: 10,
          iiRate: 10,
          ipiImportRate: 5,
          pisImportRate: 2,
          cofinsImportRate: 8,
          icmsImportRate: 18,
        }),
      ],
    });

    const calculatedProduct = result.products[0];
    const icmsNumeratorWithoutPortExpensesCapataziasOrRoadFreight = 5500 + 550 + 302.5 + 110 + 440;

    expect(calculatedProduct.allocatedAduaneiraCostsBrl).toBe(0);
    expect(calculatedProduct.allocatedPortExpensesBrl).toBe(500);
    expect(calculatedProduct.allocatedCapataziasBrl).toBe(100);
    expect(calculatedProduct.allocatedRoadFreightBrl).toBe(1000);
    expect(calculatedProduct.allocatedOtherCostsBrl).toBe(1600);
    expect(calculatedProduct.icmsImportBaseBrl).toBeCloseTo(icmsNumeratorWithoutPortExpensesCapataziasOrRoadFreight / 0.82, 6);
    expect(calculatedProduct.icmsImportBrl).toBeCloseTo((icmsNumeratorWithoutPortExpensesCapataziasOrRoadFreight / 0.82) * 0.18, 6);
    expect(calculatedProduct.landedCostBrl).toBeCloseTo(5500 + 1600 + calculatedProduct.importTaxesBrl, 6);
    expect(result.totalAduaneiraCostsBrl).toBe(0);
    expect(result.totalPortExpensesBrl).toBe(500);
    expect(result.totalCapataziasBrl).toBe(100);
    expect(result.totalRoadFreightBrl).toBe(1000);
    expect(result.totalOtherCostsBrl).toBe(1600);
  });

  it("rateia frete e demais custos por participação no FOB e consolida os impostos de todos os itens", () => {
    const result = calculateBasicNationalization({
      exchangeRate: 5,
      premises: [
        { key: "freight", label: "Frete", value: 300, currency: "USD" },
        { key: "portExpenses", label: "Despesas Portuárias", value: 500, currency: "BRL" },
      ],
      products: [
        product({
          id: "p1",
          description: "Produto A",
          ncm: "1111.11.11",
          desiredQuantity: 100,
          unitsPerCarton: 10,
          fobUnitUsd: 10,
          iiRate: 10,
          ipiImportRate: 0,
          pisImportRate: 0,
          cofinsImportRate: 0,
          icmsImportRate: 0,
        }),
        product({
          id: "p2",
          description: "Produto B",
          ncm: "2222.22.22",
          desiredQuantity: 50,
          unitsPerCarton: 10,
          fobUnitUsd: 20,
          iiRate: 20,
          ipiImportRate: 0,
          pisImportRate: 0,
          cofinsImportRate: 0,
          icmsImportRate: 0,
        }),
      ],
    });

    expect(result.products[0].sharePercent).toBe(50);
    expect(result.products[1].sharePercent).toBe(50);
    expect(result.products[0].allocatedFreightBrl).toBe(750);
    expect(result.products[1].allocatedFreightBrl).toBe(750);
    expect(result.products[0].allocatedPortExpensesBrl).toBe(250);
    expect(result.products[1].allocatedPortExpensesBrl).toBe(250);
    expect(result.products[0].allocatedOtherCostsBrl).toBe(250);
    expect(result.products[1].allocatedOtherCostsBrl).toBe(250);
    expect(result.totalAduaneiraCostsBrl).toBe(0);
    expect(result.totalPortExpensesBrl).toBe(500);

    expect(result.totalFobUsd).toBe(2000);
    expect(result.totalFobBrl).toBe(10000);
    expect(result.totalCustomsValueBrl).toBe(11500);
    expect(result.totalIiBrl).toBe(1725);
    expect(result.totalImportTaxesBrl).toBe(1725);
    expect(result.totalLandedCostBrl).toBe(13725);
  });
});
