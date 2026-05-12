export type PisCofinsMode = "cumulative" | "monophasic";

export type ImportCalculationInput = {
  ncm: string;
  description: string;
  quantity: number;
  unitPriceUsd: number;
  fobUsd: number;
  internationalFreightUsd: number;
  insuranceUsd: number;
  exchangeRate: number;
  afrmmBrl: number;
  capataziaBrl: number;
  otherImportCostsBrl: number;
  unitWeightKg: number;
  unitsPerCarton: number;
  cartonLengthCm: number;
  cartonWidthCm: number;
  cartonHeightCm: number;
  nwKg: number;
  gwKg: number;
  cbm: number;
  iiRate: number;
  ipiImportRate: number;
  pisImportRate: number;
  cofinsImportRate: number;
  icmsImportRate: number;
  salePriceBrl: number;
  icmsSaleRate: number;
  ivaStRate: number;
  ipiOutputRate: number;
  pisCofinsMode: PisCofinsMode;
  pisRevenueRate: number;
  cofinsRevenueRate: number;
  containerCbmCapacity: number;
  containerWeightCapacityKg: number;
};

export type QuoteItemInput = {
  id: string;
  ncm: string;
  description: string;
  quantity: number;
  unitPriceUsd: number;
  unitWeightKg: number;
  unitsPerCarton: number;
  cartonLengthCm: number;
  cartonWidthCm: number;
  cartonHeightCm: number;
  iiRate: number;
  ipiImportRate: number;
  pisImportRate: number;
  cofinsImportRate: number;
  icmsImportRate: number;
  ipiOutputRate: number;
};

export type QuoteCalculationInput = {
  items: QuoteItemInput[];
  exchangeRate: number;
  internationalFreightUsd: number;
  insuranceUsd: number;
  afrmmBrl: number;
  capataziaBrl: number;
  otherImportCostsBrl: number;
  salePriceBrl: number;
  icmsSaleRate: number;
  ivaStRate: number;
  pisCofinsMode: PisCofinsMode;
  pisRevenueRate: number;
  cofinsRevenueRate: number;
  containerCbmCapacity: number;
  containerWeightCapacityKg: number;
};

export type ImportCalculationResult = {
  exchangeRate: number;
  fobBrl: number;
  freightBrl: number;
  insuranceBrl: number;
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
  sale: {
    grossRevenueBrl: number;
    icmsOwnDebitBrl: number;
    ipiOutputDebitBrl: number;
    icmsStBaseBrl: number;
    icmsStDebitBrl: number;
    pisRevenueDebitBrl: number;
    cofinsRevenueDebitBrl: number;
    totalDebitsBrl: number;
    ipiCreditBrl: number;
    icmsCreditBrl: number;
    totalCreditsBrl: number;
    netTaxBrl: number;
    grossMarginBrl: number;
    netResultBrl: number;
    marginPercent: number;
    taxBurdenPercent: number;
  };
  container: {
    cbmUsagePercent: number;
    weightUsagePercent: number;
    limitingFactor: "cbm" | "weight" | "none";
    alertLevel: "ok" | "attention" | "exceeded";
  };
};

export type QuoteItemCalculation = {
  input: QuoteItemInput;
  result: ImportCalculationResult;
  fobUsd: number;
  cartons: number;
  cbm: number;
  weightKg: number;
  sharePercent: number;
};

export type QuoteCalculationResult = ImportCalculationResult & {
  items: QuoteItemCalculation[];
  totalQuantity: number;
  totalFobUsd: number;
  totalCartons: number;
  totalCbm: number;
  totalWeightKg: number;
  ncmList: string;
};

export const defaultInput: ImportCalculationInput = {
  ncm: "3307.20.10",
  description: "Desodorantes corporais e antiperspirantes",
  quantity: 10000,
  unitPriceUsd: 1.2,
  fobUsd: 12000,
  internationalFreightUsd: 1800,
  insuranceUsd: 120,
  exchangeRate: 5.05,
  afrmmBrl: 1440,
  capataziaBrl: 1850,
  otherImportCostsBrl: 0,
  unitWeightKg: 0.255,
  unitsPerCarton: 100,
  cartonLengthCm: 60,
  cartonWidthCm: 40,
  cartonHeightCm: 76.67,
  nwKg: 2100,
  gwKg: 2550,
  cbm: 18.4,
  iiRate: 18,
  ipiImportRate: 9.75,
  pisImportRate: 2.1,
  cofinsImportRate: 9.65,
  icmsImportRate: 18,
  salePriceBrl: 145000,
  icmsSaleRate: 18,
  ivaStRate: 62.24,
  ipiOutputRate: 9.75,
  pisCofinsMode: "cumulative",
  pisRevenueRate: 0.65,
  cofinsRevenueRate: 3,
  containerCbmCapacity: 68,
  containerWeightCapacityKg: 26000,
};

export const defaultQuoteInput: QuoteCalculationInput = {
  items: [toQuoteItem(defaultInput, "item-1")],
  exchangeRate: defaultInput.exchangeRate,
  internationalFreightUsd: defaultInput.internationalFreightUsd,
  insuranceUsd: defaultInput.insuranceUsd,
  afrmmBrl: defaultInput.afrmmBrl,
  capataziaBrl: defaultInput.capataziaBrl,
  otherImportCostsBrl: defaultInput.otherImportCostsBrl,
  salePriceBrl: defaultInput.salePriceBrl,
  icmsSaleRate: defaultInput.icmsSaleRate,
  ivaStRate: defaultInput.ivaStRate,
  pisCofinsMode: defaultInput.pisCofinsMode,
  pisRevenueRate: defaultInput.pisRevenueRate,
  cofinsRevenueRate: defaultInput.cofinsRevenueRate,
  containerCbmCapacity: defaultInput.containerCbmCapacity,
  containerWeightCapacityKg: defaultInput.containerWeightCapacityKg,
};

function pct(rate: number) {
  return Number.isFinite(rate) ? rate / 100 : 0;
}

function money(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

function safeDiv(numerator: number, denominator: number) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return 0;
  return numerator / denominator;
}

function itemFobUsd(item: Pick<QuoteItemInput, "quantity" | "unitPriceUsd">) {
  return Math.max(0, item.quantity || 0) * Math.max(0, item.unitPriceUsd || 0);
}

export function calculateCartons(quantity: number, unitsPerCarton: number) {
  if (!Number.isFinite(quantity) || !Number.isFinite(unitsPerCarton) || quantity <= 0 || unitsPerCarton <= 0) return 0;
  return Math.ceil(quantity / unitsPerCarton);
}

export function calculateCbm(quantity: number, unitsPerCarton: number, lengthCm: number, widthCm: number, heightCm: number) {
  const cartons = calculateCartons(quantity, unitsPerCarton);
  if (cartons <= 0 || lengthCm <= 0 || widthCm <= 0 || heightCm <= 0) return 0;
  return cartons * lengthCm * widthCm * heightCm / 1_000_000;
}

export function toQuoteItem(input: ImportCalculationInput, id = "item-1"): QuoteItemInput {
  return {
    id,
    ncm: input.ncm,
    description: input.description,
    quantity: input.quantity,
    unitPriceUsd: input.unitPriceUsd || safeDiv(input.fobUsd, input.quantity),
    unitWeightKg: input.unitWeightKg || safeDiv(input.gwKg, input.quantity),
    unitsPerCarton: input.unitsPerCarton || input.quantity,
    cartonLengthCm: input.cartonLengthCm,
    cartonWidthCm: input.cartonWidthCm,
    cartonHeightCm: input.cartonHeightCm,
    iiRate: input.iiRate,
    ipiImportRate: input.ipiImportRate,
    pisImportRate: input.pisImportRate,
    cofinsImportRate: input.cofinsImportRate,
    icmsImportRate: input.icmsImportRate,
    ipiOutputRate: input.ipiOutputRate,
  };
}

export function calculateImport(input: ImportCalculationInput): ImportCalculationResult {
  const quantity = Math.max(0, input.quantity || 0);
  const cartons = calculateCartons(quantity, input.unitsPerCarton);
  const calculatedFobUsd = input.unitPriceUsd > 0 ? quantity * input.unitPriceUsd : 0;
  const derivedFobUsd = input.fobUsd > 0 ? input.fobUsd : calculatedFobUsd;
  const derivedCbm = calculateCbm(quantity, input.unitsPerCarton, input.cartonLengthCm, input.cartonWidthCm, input.cartonHeightCm);
  const derivedWeightKg = input.unitWeightKg > 0 ? quantity * input.unitWeightKg : 0;
  const fobBrl = derivedFobUsd * input.exchangeRate;
  const freightBrl = input.internationalFreightUsd * input.exchangeRate;
  const insuranceBrl = input.insuranceUsd * input.exchangeRate;
  const customsValueBrl = fobBrl + freightBrl + insuranceBrl;

  const iiBrl = customsValueBrl * pct(input.iiRate);
  const ipiImportBaseBrl = customsValueBrl + iiBrl;
  const ipiImportBrl = ipiImportBaseBrl * pct(input.ipiImportRate);
  const pisImportBrl = customsValueBrl * pct(input.pisImportRate);
  const cofinsImportBrl = customsValueBrl * pct(input.cofinsImportRate);

  const icmsImportNumerator =
    customsValueBrl +
    iiBrl +
    ipiImportBrl +
    pisImportBrl +
    cofinsImportBrl +
    input.afrmmBrl +
    input.capataziaBrl +
    input.otherImportCostsBrl;
  const icmsImportBaseBrl = safeDiv(icmsImportNumerator, 1 - pct(input.icmsImportRate));
  const icmsImportBrl = icmsImportBaseBrl * pct(input.icmsImportRate);

  const importTaxesBrl = iiBrl + ipiImportBrl + pisImportBrl + cofinsImportBrl + icmsImportBrl;
  const landedCostBrl =
    customsValueBrl +
    input.afrmmBrl +
    input.capataziaBrl +
    input.otherImportCostsBrl +
    importTaxesBrl;

  const saleGross = input.salePriceBrl;
  const icmsOwnDebitBrl = saleGross * pct(input.icmsSaleRate);
  const ipiOutputDebitBrl = saleGross * pct(input.ipiOutputRate);
  const icmsStBaseBrl = (saleGross + ipiOutputDebitBrl) * (1 + pct(input.ivaStRate));
  const icmsStDebitBrl = Math.max(icmsStBaseBrl * pct(input.icmsSaleRate) - icmsOwnDebitBrl, 0);
  const pisRevenueDebitBrl = input.pisCofinsMode === "cumulative" ? saleGross * pct(input.pisRevenueRate) : 0;
  const cofinsRevenueDebitBrl = input.pisCofinsMode === "cumulative" ? saleGross * pct(input.cofinsRevenueRate) : 0;
  const totalDebitsBrl = icmsOwnDebitBrl + ipiOutputDebitBrl + icmsStDebitBrl + pisRevenueDebitBrl + cofinsRevenueDebitBrl;
  const ipiCreditBrl = ipiImportBrl;
  const icmsCreditBrl = icmsImportBrl;
  const totalCreditsBrl = ipiCreditBrl + icmsCreditBrl;
  const netTaxBrl = totalDebitsBrl - totalCreditsBrl;
  const grossMarginBrl = saleGross - landedCostBrl;
  const netResultBrl = saleGross - landedCostBrl - netTaxBrl;
  const marginPercent = safeDiv(netResultBrl, saleGross) * 100;
  const taxBurdenPercent = safeDiv(importTaxesBrl + Math.max(netTaxBrl, 0), saleGross || landedCostBrl) * 100;

  const cbm = input.cbm > 0 ? input.cbm : derivedCbm;
  const grossWeight = input.gwKg > 0 ? input.gwKg : derivedWeightKg;
  const cbmUsagePercent = safeDiv(cbm, input.containerCbmCapacity) * 100;
  const weightUsagePercent = safeDiv(grossWeight, input.containerWeightCapacityKg) * 100;
  const maxUsage = Math.max(cbmUsagePercent, weightUsagePercent);
  const limitingFactor = maxUsage <= 0 ? "none" : cbmUsagePercent >= weightUsagePercent ? "cbm" : "weight";
  const alertLevel = maxUsage >= 100 ? "exceeded" : maxUsage >= 85 ? "attention" : "ok";

  return {
    exchangeRate: input.exchangeRate,
    fobBrl: money(fobBrl),
    freightBrl: money(freightBrl),
    insuranceBrl: money(insuranceBrl),
    customsValueBrl: money(customsValueBrl),
    iiBrl: money(iiBrl),
    ipiImportBaseBrl: money(ipiImportBaseBrl),
    ipiImportBrl: money(ipiImportBrl),
    pisImportBrl: money(pisImportBrl),
    cofinsImportBrl: money(cofinsImportBrl),
    icmsImportBaseBrl: money(icmsImportBaseBrl),
    icmsImportBrl: money(icmsImportBrl),
    importTaxesBrl: money(importTaxesBrl),
    landedCostBrl: money(landedCostBrl),
    unitLandedCostBrl: money(safeDiv(landedCostBrl, quantity)),
    sale: {
      grossRevenueBrl: money(saleGross),
      icmsOwnDebitBrl: money(icmsOwnDebitBrl),
      ipiOutputDebitBrl: money(ipiOutputDebitBrl),
      icmsStBaseBrl: money(icmsStBaseBrl),
      icmsStDebitBrl: money(icmsStDebitBrl),
      pisRevenueDebitBrl: money(pisRevenueDebitBrl),
      cofinsRevenueDebitBrl: money(cofinsRevenueDebitBrl),
      totalDebitsBrl: money(totalDebitsBrl),
      ipiCreditBrl: money(ipiCreditBrl),
      icmsCreditBrl: money(icmsCreditBrl),
      totalCreditsBrl: money(totalCreditsBrl),
      netTaxBrl: money(netTaxBrl),
      grossMarginBrl: money(grossMarginBrl),
      netResultBrl: money(netResultBrl),
      marginPercent: money(marginPercent),
      taxBurdenPercent: money(taxBurdenPercent),
    },
    container: {
      cbmUsagePercent: money(cbmUsagePercent),
      weightUsagePercent: money(weightUsagePercent),
      limitingFactor,
      alertLevel,
    },
  };
}

function sum(items: number[]) {
  return items.reduce((total, item) => total + (Number.isFinite(item) ? item : 0), 0);
}

export function calculateQuote(input: QuoteCalculationInput): QuoteCalculationResult {
  const items = input.items.length ? input.items : defaultQuoteInput.items;
  const fobs = items.map(itemFobUsd);
  const totalFobUsd = sum(fobs);
  const totalQuantity = sum(items.map(item => item.quantity));
  const totalWeightKg = sum(items.map(item => item.unitWeightKg * item.quantity));
  const totalCbm = sum(items.map(item => calculateCbm(item.quantity, item.unitsPerCarton, item.cartonLengthCm, item.cartonWidthCm, item.cartonHeightCm)));
  const totalCartons = sum(items.map(item => calculateCartons(item.quantity, item.unitsPerCarton)));

  const itemCalculations = items.map((item, index) => {
    const fobUsd = fobs[index] || 0;
    const share = totalFobUsd > 0 ? fobUsd / totalFobUsd : 1 / items.length;
    const itemInput: ImportCalculationInput = {
      ncm: item.ncm,
      description: item.description,
      quantity: item.quantity,
      unitPriceUsd: item.unitPriceUsd,
      fobUsd,
      internationalFreightUsd: input.internationalFreightUsd * share,
      insuranceUsd: input.insuranceUsd * share,
      exchangeRate: input.exchangeRate,
      afrmmBrl: input.afrmmBrl * share,
      capataziaBrl: input.capataziaBrl * share,
      otherImportCostsBrl: input.otherImportCostsBrl * share,
      unitWeightKg: item.unitWeightKg,
      unitsPerCarton: item.unitsPerCarton,
      cartonLengthCm: item.cartonLengthCm,
      cartonWidthCm: item.cartonWidthCm,
      cartonHeightCm: item.cartonHeightCm,
      nwKg: item.unitWeightKg * item.quantity,
      gwKg: item.unitWeightKg * item.quantity,
      cbm: calculateCbm(item.quantity, item.unitsPerCarton, item.cartonLengthCm, item.cartonWidthCm, item.cartonHeightCm),
      iiRate: item.iiRate,
      ipiImportRate: item.ipiImportRate,
      pisImportRate: item.pisImportRate,
      cofinsImportRate: item.cofinsImportRate,
      icmsImportRate: item.icmsImportRate,
      salePriceBrl: input.salePriceBrl * share,
      icmsSaleRate: input.icmsSaleRate,
      ivaStRate: input.ivaStRate,
      ipiOutputRate: item.ipiOutputRate,
      pisCofinsMode: input.pisCofinsMode,
      pisRevenueRate: input.pisRevenueRate,
      cofinsRevenueRate: input.cofinsRevenueRate,
      containerCbmCapacity: input.containerCbmCapacity,
      containerWeightCapacityKg: input.containerWeightCapacityKg,
    };
    return {
      input: item,
      result: calculateImport(itemInput),
      fobUsd,
      cartons: calculateCartons(item.quantity, item.unitsPerCarton),
      cbm: calculateCbm(item.quantity, item.unitsPerCarton, item.cartonLengthCm, item.cartonWidthCm, item.cartonHeightCm),
      weightKg: item.unitWeightKg * item.quantity,
      sharePercent: money(share * 100),
    };
  });

  const result = aggregateResults(input, itemCalculations, totalQuantity, totalFobUsd, totalCartons, totalCbm, totalWeightKg);
  return result;
}

function aggregateResults(input: QuoteCalculationInput, items: QuoteItemCalculation[], totalQuantity: number, totalFobUsd: number, totalCartons: number, totalCbm: number, totalWeightKg: number): QuoteCalculationResult {
  const saleGross = input.salePriceBrl;
  const landedCostBrl = sum(items.map(item => item.result.landedCostBrl));
  const importTaxesBrl = sum(items.map(item => item.result.importTaxesBrl));
  const totalDebitsBrl = sum(items.map(item => item.result.sale.totalDebitsBrl));
  const totalCreditsBrl = sum(items.map(item => item.result.sale.totalCreditsBrl));
  const netTaxBrl = totalDebitsBrl - totalCreditsBrl;
  const netResultBrl = saleGross - landedCostBrl - netTaxBrl;
  const marginPercent = safeDiv(netResultBrl, saleGross) * 100;
  const taxBurdenPercent = safeDiv(importTaxesBrl + Math.max(netTaxBrl, 0), saleGross || landedCostBrl) * 100;
  const cbmUsagePercent = safeDiv(totalCbm, input.containerCbmCapacity) * 100;
  const weightUsagePercent = safeDiv(totalWeightKg, input.containerWeightCapacityKg) * 100;
  const maxUsage = Math.max(cbmUsagePercent, weightUsagePercent);
  const limitingFactor = maxUsage <= 0 ? "none" : cbmUsagePercent >= weightUsagePercent ? "cbm" : "weight";
  const alertLevel = maxUsage >= 100 ? "exceeded" : maxUsage >= 85 ? "attention" : "ok";

  return {
    exchangeRate: input.exchangeRate,
    fobBrl: money(totalFobUsd * input.exchangeRate),
    freightBrl: money(input.internationalFreightUsd * input.exchangeRate),
    insuranceBrl: money(input.insuranceUsd * input.exchangeRate),
    customsValueBrl: money(sum(items.map(item => item.result.customsValueBrl))),
    iiBrl: money(sum(items.map(item => item.result.iiBrl))),
    ipiImportBaseBrl: money(sum(items.map(item => item.result.ipiImportBaseBrl))),
    ipiImportBrl: money(sum(items.map(item => item.result.ipiImportBrl))),
    pisImportBrl: money(sum(items.map(item => item.result.pisImportBrl))),
    cofinsImportBrl: money(sum(items.map(item => item.result.cofinsImportBrl))),
    icmsImportBaseBrl: money(sum(items.map(item => item.result.icmsImportBaseBrl))),
    icmsImportBrl: money(sum(items.map(item => item.result.icmsImportBrl))),
    importTaxesBrl: money(importTaxesBrl),
    landedCostBrl: money(landedCostBrl),
    unitLandedCostBrl: money(safeDiv(landedCostBrl, totalQuantity)),
    sale: {
      grossRevenueBrl: money(saleGross),
      icmsOwnDebitBrl: money(sum(items.map(item => item.result.sale.icmsOwnDebitBrl))),
      ipiOutputDebitBrl: money(sum(items.map(item => item.result.sale.ipiOutputDebitBrl))),
      icmsStBaseBrl: money(sum(items.map(item => item.result.sale.icmsStBaseBrl))),
      icmsStDebitBrl: money(sum(items.map(item => item.result.sale.icmsStDebitBrl))),
      pisRevenueDebitBrl: money(sum(items.map(item => item.result.sale.pisRevenueDebitBrl))),
      cofinsRevenueDebitBrl: money(sum(items.map(item => item.result.sale.cofinsRevenueDebitBrl))),
      totalDebitsBrl: money(totalDebitsBrl),
      ipiCreditBrl: money(sum(items.map(item => item.result.sale.ipiCreditBrl))),
      icmsCreditBrl: money(sum(items.map(item => item.result.sale.icmsCreditBrl))),
      totalCreditsBrl: money(totalCreditsBrl),
      netTaxBrl: money(netTaxBrl),
      grossMarginBrl: money(saleGross - landedCostBrl),
      netResultBrl: money(netResultBrl),
      marginPercent: money(marginPercent),
      taxBurdenPercent: money(taxBurdenPercent),
    },
    container: {
      cbmUsagePercent: money(cbmUsagePercent),
      weightUsagePercent: money(weightUsagePercent),
      limitingFactor,
      alertLevel,
    },
    items,
    totalQuantity: money(totalQuantity),
    totalFobUsd: money(totalFobUsd),
    totalCartons: money(totalCartons),
    totalCbm: money(totalCbm),
    totalWeightKg: money(totalWeightKg),
    ncmList: items.map(item => item.input.ncm).join(", "),
  };
}

export function legacyToQuoteInput(input: ImportCalculationInput): QuoteCalculationInput {
  return {
    items: [toQuoteItem(input)],
    exchangeRate: input.exchangeRate,
    internationalFreightUsd: input.internationalFreightUsd,
    insuranceUsd: input.insuranceUsd,
    afrmmBrl: input.afrmmBrl,
    capataziaBrl: input.capataziaBrl,
    otherImportCostsBrl: input.otherImportCostsBrl,
    salePriceBrl: input.salePriceBrl,
    icmsSaleRate: input.icmsSaleRate,
    ivaStRate: input.ivaStRate,
    pisCofinsMode: input.pisCofinsMode,
    pisRevenueRate: input.pisRevenueRate,
    cofinsRevenueRate: input.cofinsRevenueRate,
    containerCbmCapacity: input.containerCbmCapacity,
    containerWeightCapacityKg: input.containerWeightCapacityKg,
  };
}
