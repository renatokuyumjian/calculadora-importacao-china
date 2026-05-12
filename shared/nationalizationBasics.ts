export type Currency = "BRL" | "USD";

export type PremiseKey =
  | "freight"
  | "capatazias"
  | "portExpenses"
  | "siscomex"
  | "afrmm"
  | "roadFreight";

export type PremiseInput = {
  key: PremiseKey;
  label: string;
  value: number;
  currency: Currency;
};

export type ProductInput = {
  id: string;
  description: string;
  ncm: string;
  desiredQuantity: number;
  unitsPerCarton: number;
  fobUnitUsd: number;
  iiRate: number;
  ipiImportRate: number;
  pisImportRate: number;
  cofinsImportRate: number;
  icmsImportRate: number;
  grossWeightPerCartonKg: number;
  netWeightPerCartonKg: number;
  cartonHeightCm: number;
  cartonWidthCm: number;
  cartonLengthCm: number;
};

export type PremiseResult = PremiseInput & {
  valueBrl: number;
};

export type ProductResult = ProductInput & {
  cartons: number;
  totalGrossWeightKg: number;
  totalNetWeightKg: number;
  cbmPerCarton: number;
  totalCbm: number;
  orderedUnits: number;
  extraUnits: number;
  fobTotalUsd: number;
  fobUnitBrl: number;
  fobTotalBrl: number;
  sharePercent: number;
  allocatedFreightBrl: number;
  allocatedAduaneiraCostsBrl: number;
  allocatedCapataziasBrl: number;
  allocatedPortExpensesBrl: number;
  allocatedRoadFreightBrl: number;
  allocatedOtherCostsBrl: number;
  customsValueBrl: number;
  iiBrl: number;
  ipiImportBaseBrl: number;
  ipiImportBrl: number;
  pisImportBrl: number;
  cofinsImportBrl: number;
  icmsImportBaseBrl: number;
  icmsImportBrl: number;
  importTaxesBrl: number;
  landedCostBrl: number;
  unitLandedCostBrl: number;
  costWithoutIpiIcmsBrl: number;
  unitCostWithoutIpiIcmsBrl: number;
  importIndex: number;
};

export type BasicNationalizationInput = {
  exchangeRate: number;
  premises: PremiseInput[];
  products: ProductInput[];
};

export type BasicNationalizationResult = {
  exchangeRate: number;
  premises: PremiseResult[];
  products: ProductResult[];
  totalPremisesBrl: number;
  totalFreightBrl: number;
  totalAduaneiraCostsBrl: number;
  totalCapataziasBrl: number;
  totalPortExpensesBrl: number;
  totalRoadFreightBrl: number;
  totalOtherCostsBrl: number;
  totalCartons: number;
  totalGrossWeightKg: number;
  totalNetWeightKg: number;
  totalCbm: number;
  totalFobUsd: number;
  totalFobBrl: number;
  totalCustomsValueBrl: number;
  totalIiBrl: number;
  totalIpiImportBrl: number;
  totalPisImportBrl: number;
  totalCofinsImportBrl: number;
  totalIcmsImportBrl: number;
  totalImportTaxesBrl: number;
  totalLandedCostBrl: number;
};

export const defaultPremises: PremiseInput[] = [
  { key: "freight", label: "Frete", value: 0, currency: "USD" },
  { key: "capatazias", label: "Capatazias", value: 0, currency: "BRL" },
  { key: "portExpenses", label: "Despesas Portuárias", value: 0, currency: "BRL" },
  { key: "siscomex", label: "Siscomex", value: 0, currency: "BRL" },
  { key: "afrmm", label: "AFRMM", value: 0, currency: "BRL" },
  { key: "roadFreight", label: "Frete Rodoviário", value: 0, currency: "BRL" },
];

export const defaultProduct: ProductInput = {
  id: "produto-1",
  description: "",
  ncm: "",
  desiredQuantity: 0,
  unitsPerCarton: 1,
  fobUnitUsd: 0,
  iiRate: 0,
  ipiImportRate: 0,
  pisImportRate: 2.1,
  cofinsImportRate: 9.65,
  icmsImportRate: 18,
  grossWeightPerCartonKg: 0,
  netWeightPerCartonKg: 0,
  cartonHeightCm: 0,
  cartonWidthCm: 0,
  cartonLengthCm: 0,
};

function safeNumber(value: number) {
  return Number.isFinite(value) ? Math.max(value, 0) : 0;
}

function pct(rate: number) {
  return safeNumber(rate) / 100;
}

function safeDiv(numerator: number, denominator: number) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return 0;
  return numerator / denominator;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0);
}

function productFobBrl(product: ProductInput, exchangeRate: number) {
  return safeNumber(product.desiredQuantity) * safeNumber(product.fobUnitUsd) * safeNumber(exchangeRate);
}

export function convertPremiseToBrl(value: number, currency: Currency, exchangeRate: number) {
  const amount = safeNumber(value);
  if (currency === "USD") return amount * safeNumber(exchangeRate);
  return amount;
}

export function calculateProduct(
  product: ProductInput,
  exchangeRate = 0,
  allocation: {
    sharePercent?: number;
    allocatedFreightBrl?: number;
    allocatedAduaneiraCostsBrl?: number;
    allocatedCapataziasBrl?: number;
    allocatedPortExpensesBrl?: number;
    allocatedRoadFreightBrl?: number;
    allocatedOtherCostsBrl?: number;
  } = {},
): ProductResult {
  const desiredQuantity = safeNumber(product.desiredQuantity);
  const unitsPerCarton = Math.max(safeNumber(product.unitsPerCarton), 1);
  const cartons = desiredQuantity > 0 ? Math.ceil(desiredQuantity / unitsPerCarton) : 0;
  const orderedUnits = cartons * unitsPerCarton;
  const cbmPerCarton =
    (safeNumber(product.cartonHeightCm) * safeNumber(product.cartonWidthCm) * safeNumber(product.cartonLengthCm)) / 1_000_000;
  const fobUnitUsd = safeNumber(product.fobUnitUsd);
  const fobTotalUsd = desiredQuantity * fobUnitUsd;
  const fobUnitBrl = fobUnitUsd * safeNumber(exchangeRate);
  const fobTotalBrl = fobTotalUsd * safeNumber(exchangeRate);
  const allocatedFreightBrl = safeNumber(allocation.allocatedFreightBrl || 0);
  const allocatedAduaneiraCostsBrl = safeNumber(allocation.allocatedAduaneiraCostsBrl || 0);
  const allocatedCapataziasBrl = safeNumber(allocation.allocatedCapataziasBrl || 0);
  const allocatedPortExpensesBrl = safeNumber(allocation.allocatedPortExpensesBrl || 0);
  const allocatedRoadFreightBrl = safeNumber(allocation.allocatedRoadFreightBrl || 0);
  const allocatedOtherCostsBrl = allocatedAduaneiraCostsBrl + allocatedCapataziasBrl + allocatedPortExpensesBrl + allocatedRoadFreightBrl;
  const customsValueBrl = fobTotalBrl + allocatedFreightBrl;

  const iiRate = safeNumber(product.iiRate);
  const ipiImportRate = safeNumber(product.ipiImportRate);
  const pisImportRate = safeNumber(product.pisImportRate);
  const cofinsImportRate = safeNumber(product.cofinsImportRate);
  const icmsImportRate = safeNumber(product.icmsImportRate);

  const iiBrl = customsValueBrl * pct(iiRate);
  const ipiImportBaseBrl = customsValueBrl + iiBrl;
  const ipiImportBrl = ipiImportBaseBrl * pct(ipiImportRate);
  const pisImportBrl = customsValueBrl * pct(pisImportRate);
  const cofinsImportBrl = customsValueBrl * pct(cofinsImportRate);
  const icmsNumerator = customsValueBrl + iiBrl + ipiImportBrl + pisImportBrl + cofinsImportBrl + allocatedAduaneiraCostsBrl;
  const icmsImportBaseBrl = safeDiv(icmsNumerator, 1 - pct(icmsImportRate));
  const icmsImportBrl = icmsImportBaseBrl * pct(icmsImportRate);
  const importTaxesBrl = iiBrl + ipiImportBrl + pisImportBrl + cofinsImportBrl + icmsImportBrl;
  const landedCostBrl = customsValueBrl + allocatedOtherCostsBrl + importTaxesBrl;
  const costWithoutIpiIcmsBrl = landedCostBrl - ipiImportBrl - icmsImportBrl;

  return {
    ...product,
    desiredQuantity,
    unitsPerCarton,
    fobUnitUsd,
    iiRate,
    ipiImportRate,
    pisImportRate,
    cofinsImportRate,
    icmsImportRate,
    cartons,
    orderedUnits,
    extraUnits: Math.max(orderedUnits - desiredQuantity, 0),
    totalGrossWeightKg: cartons * safeNumber(product.grossWeightPerCartonKg),
    totalNetWeightKg: cartons * safeNumber(product.netWeightPerCartonKg),
    cbmPerCarton,
    totalCbm: cartons * cbmPerCarton,
    fobTotalUsd,
    fobUnitBrl,
    fobTotalBrl,
    sharePercent: safeNumber(allocation.sharePercent || 0),
    allocatedFreightBrl,
    allocatedAduaneiraCostsBrl,
    allocatedCapataziasBrl,
    allocatedPortExpensesBrl,
    allocatedRoadFreightBrl,
    allocatedOtherCostsBrl,
    customsValueBrl,
    iiBrl,
    ipiImportBaseBrl,
    ipiImportBrl,
    pisImportBrl,
    cofinsImportBrl,
    icmsImportBaseBrl,
    icmsImportBrl,
    importTaxesBrl,
    landedCostBrl,
    unitLandedCostBrl: safeDiv(landedCostBrl, desiredQuantity),
    costWithoutIpiIcmsBrl,
    unitCostWithoutIpiIcmsBrl: safeDiv(costWithoutIpiIcmsBrl, desiredQuantity),
    importIndex: safeDiv(safeDiv(costWithoutIpiIcmsBrl, desiredQuantity), fobUnitUsd),
  };
}

export function calculateBasicNationalization(input: BasicNationalizationInput): BasicNationalizationResult {
  const exchangeRate = safeNumber(input.exchangeRate);
  const premises = input.premises.map(premise => ({
    ...premise,
    value: safeNumber(premise.value),
    valueBrl: convertPremiseToBrl(premise.value, premise.currency, exchangeRate),
  }));
  const totalPremisesBrl = sum(premises.map(premise => premise.valueBrl));
  const totalFreightBrl = sum(premises.filter(premise => premise.key === "freight").map(premise => premise.valueBrl));
  const totalCapataziasBrl = sum(premises.filter(premise => premise.key === "capatazias").map(premise => premise.valueBrl));
  const totalPortExpensesBrl = sum(premises.filter(premise => premise.key === "portExpenses").map(premise => premise.valueBrl));
  const totalAduaneiraCostsBrl = sum(
    premises.filter(premise => ["siscomex", "afrmm"].includes(premise.key)).map(premise => premise.valueBrl),
  );
  const totalRoadFreightBrl = sum(premises.filter(premise => premise.key === "roadFreight").map(premise => premise.valueBrl));
  const totalOtherCostsBrl = totalAduaneiraCostsBrl + totalCapataziasBrl + totalPortExpensesBrl + totalRoadFreightBrl;
  const totalFobBrlForShare = sum(input.products.map(product => productFobBrl(product, exchangeRate)));
  const productCount = input.products.length;

  const products = input.products.map(product => {
    const fobBrl = productFobBrl(product, exchangeRate);
    const share = totalFobBrlForShare > 0 ? fobBrl / totalFobBrlForShare : productCount > 0 ? 1 / productCount : 0;
    return calculateProduct(product, exchangeRate, {
      sharePercent: share * 100,
      allocatedFreightBrl: totalFreightBrl * share,
      allocatedAduaneiraCostsBrl: totalAduaneiraCostsBrl * share,
      allocatedCapataziasBrl: totalCapataziasBrl * share,
      allocatedPortExpensesBrl: totalPortExpensesBrl * share,
      allocatedRoadFreightBrl: totalRoadFreightBrl * share,
    });
  });

  return {
    exchangeRate,
    premises,
    products,
    totalPremisesBrl,
    totalFreightBrl,
    totalAduaneiraCostsBrl,
    totalCapataziasBrl,
    totalPortExpensesBrl,
    totalRoadFreightBrl,
    totalOtherCostsBrl,
    totalCartons: sum(products.map(product => product.cartons)),
    totalGrossWeightKg: sum(products.map(product => product.totalGrossWeightKg)),
    totalNetWeightKg: sum(products.map(product => product.totalNetWeightKg)),
    totalCbm: sum(products.map(product => product.totalCbm)),
    totalFobUsd: sum(products.map(product => product.fobTotalUsd)),
    totalFobBrl: sum(products.map(product => product.fobTotalBrl)),
    totalCustomsValueBrl: sum(products.map(product => product.customsValueBrl)),
    totalIiBrl: sum(products.map(product => product.iiBrl)),
    totalIpiImportBrl: sum(products.map(product => product.ipiImportBrl)),
    totalPisImportBrl: sum(products.map(product => product.pisImportBrl)),
    totalCofinsImportBrl: sum(products.map(product => product.cofinsImportBrl)),
    totalIcmsImportBrl: sum(products.map(product => product.icmsImportBrl)),
    totalImportTaxesBrl: sum(products.map(product => product.importTaxesBrl)),
    totalLandedCostBrl: sum(products.map(product => product.landedCostBrl)),
  };
}
