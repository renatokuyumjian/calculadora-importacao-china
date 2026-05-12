import { COOKIE_NAME } from "@shared/const";
import {
  calculateImport,
  calculateQuote,
  defaultInput,
  defaultQuoteInput,
  ImportCalculationInput,
  ImportCalculationResult,
  legacyToQuoteInput,
  QuoteCalculationInput,
  QuoteCalculationResult,
} from "@shared/importCalculator";
import PDFDocument from "pdfkit";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createQuote,
  createReport,
  deleteQuote,
  ensureSeedTaxRates,
  getQuote,
  listQuotes,
  listReports,
  listAllReports,
  searchTaxRates,
  updateQuote,
  upsertTaxRate,
} from "./db";
import { storagePut } from "./storage";

const calculationInputSchema = z.object({
  ncm: z.string().min(1),
  description: z.string().default(""),
  quantity: z.number().nonnegative(),
  unitPriceUsd: z.number().nonnegative().default(0),
  fobUsd: z.number().nonnegative(),
  internationalFreightUsd: z.number().nonnegative(),
  insuranceUsd: z.number().nonnegative(),
  exchangeRate: z.number().positive(),
  afrmmBrl: z.number().nonnegative(),
  capataziaBrl: z.number().nonnegative(),
  otherImportCostsBrl: z.number().nonnegative(),
  unitWeightKg: z.number().nonnegative().default(0),
  unitsPerCarton: z.number().nonnegative().default(0),
  cartonLengthCm: z.number().nonnegative().default(0),
  cartonWidthCm: z.number().nonnegative().default(0),
  cartonHeightCm: z.number().nonnegative().default(0),
  nwKg: z.number().nonnegative(),
  gwKg: z.number().nonnegative(),
  cbm: z.number().nonnegative(),
  iiRate: z.number().nonnegative(),
  ipiImportRate: z.number().nonnegative(),
  pisImportRate: z.number().nonnegative(),
  cofinsImportRate: z.number().nonnegative(),
  icmsImportRate: z.number().nonnegative(),
  salePriceBrl: z.number().nonnegative(),
  icmsSaleRate: z.number().nonnegative(),
  ivaStRate: z.number().nonnegative(),
  ipiOutputRate: z.number().nonnegative(),
  pisCofinsMode: z.enum(["cumulative", "monophasic"]),
  pisRevenueRate: z.number().nonnegative(),
  cofinsRevenueRate: z.number().nonnegative(),
  containerCbmCapacity: z.number().positive(),
  containerWeightCapacityKg: z.number().positive(),
}) satisfies z.ZodType<ImportCalculationInput>;

const quoteItemSchema = z.object({
  id: z.string().min(1),
  ncm: z.string().min(1),
  description: z.string().default(""),
  quantity: z.number().nonnegative(),
  unitPriceUsd: z.number().nonnegative(),
  unitWeightKg: z.number().nonnegative(),
  unitsPerCarton: z.number().positive(),
  cartonLengthCm: z.number().nonnegative(),
  cartonWidthCm: z.number().nonnegative(),
  cartonHeightCm: z.number().nonnegative(),
  iiRate: z.number().nonnegative(),
  ipiImportRate: z.number().nonnegative(),
  pisImportRate: z.number().nonnegative(),
  cofinsImportRate: z.number().nonnegative(),
  icmsImportRate: z.number().nonnegative(),
  ipiOutputRate: z.number().nonnegative(),
});

const quoteInputSchema = z.object({
  items: z.array(quoteItemSchema).min(1),
  exchangeRate: z.number().positive(),
  internationalFreightUsd: z.number().nonnegative(),
  insuranceUsd: z.number().nonnegative(),
  afrmmBrl: z.number().nonnegative(),
  capataziaBrl: z.number().nonnegative(),
  otherImportCostsBrl: z.number().nonnegative(),
  salePriceBrl: z.number().nonnegative(),
  icmsSaleRate: z.number().nonnegative(),
  ivaStRate: z.number().nonnegative(),
  pisCofinsMode: z.enum(["cumulative", "monophasic"]),
  pisRevenueRate: z.number().nonnegative(),
  cofinsRevenueRate: z.number().nonnegative(),
  containerCbmCapacity: z.number().positive(),
  containerWeightCapacityKg: z.number().positive(),
}) satisfies z.ZodType<QuoteCalculationInput>;

const savedPayloadSchema = z.union([quoteInputSchema, calculationInputSchema]);

function normalizeSavedPayload(payload: unknown): QuoteCalculationInput {
  const parsed = savedPayloadSchema.parse(payload);
  return "items" in parsed ? parsed : legacyToQuoteInput(parsed);
}

async function fetchUsdBrl() {
  const response = await fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL", {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Cotação indisponível");
  const data = (await response.json()) as { USDBRL?: { bid?: string; ask?: string; create_date?: string; timestamp?: string } };
  const quote = data.USDBRL;
  const bid = Number(quote?.bid);
  if (!Number.isFinite(bid) || bid <= 0) throw new Error("Resposta de câmbio inválida");
  return {
    pair: "USD/BRL",
    bid,
    ask: Number(quote?.ask ?? bid),
    source: "AwesomeAPI",
    timestamp: quote?.timestamp,
    createDate: quote?.create_date,
  };
}

function formatBrl(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

function formatUsd(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD" }).format(value || 0);
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value || 0)}%`;
}

export function buildPdfBuffer(quoteName: string, input: ImportCalculationInput, result: ImportCalculationResult) {
  return buildQuotePdfBuffer(quoteName, legacyToQuoteInput(input), calculateQuote(legacyToQuoteInput(input)));
}

export function buildQuotePdfBuffer(quoteName: string, input: QuoteCalculationInput, result: QuoteCalculationResult) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 42, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", chunk => chunks.push(Buffer.from(chunk)));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    doc.fontSize(20).font("Helvetica-Bold").text("RELATÓRIO DE IMPORTAÇÃO", { align: "left" });
    doc.moveDown(0.3);
    doc.fontSize(10).font("Helvetica").text(`Orçamento: ${quoteName}`);
    doc.text(`NCMs: ${result.ncmList || input.items.map(item => item.ncm).join(", ")}`);
    doc.text(`Itens: ${input.items.length}`);
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`);
    doc.moveDown();

    doc.fontSize(13).font("Helvetica-Bold").text("Resumo executivo");
    doc.fontSize(10).font("Helvetica");
    doc.text(`FOB total: ${formatUsd(result.totalFobUsd)} / ${formatBrl(result.fobBrl)}`);
    doc.text(`Valor aduaneiro/CIF: ${formatBrl(result.customsValueBrl)}`);
    doc.text(`Tributos de importação: ${formatBrl(result.importTaxesBrl)}`);
    doc.text(`Custo nacionalizado total: ${formatBrl(result.landedCostBrl)}`);
    doc.text(`Custo unitário nacionalizado: ${formatBrl(result.unitLandedCostBrl)}`);
    doc.text(`Resultado líquido estimado da venda: ${formatBrl(result.sale.netResultBrl)} (${formatPercent(result.sale.marginPercent)})`);
    doc.moveDown();

    doc.fontSize(13).font("Helvetica-Bold").text("Itens do orçamento");
    doc.fontSize(9).font("Helvetica");
    result.items.forEach((item, index) => {
      doc.text(`${index + 1}. ${item.input.ncm} — ${item.input.description || "sem descrição"}`);
      doc.text(`   Quantidade: ${item.input.quantity} | Unitário: ${formatUsd(item.input.unitPriceUsd)} | FOB: ${formatUsd(item.fobUsd)}`);
      doc.text(`   Cartons: ${item.cartons} | CBM: ${item.cbm.toFixed(3)} | Peso: ${item.weightKg.toFixed(2)} kg`);
      doc.text(`   Landed: ${formatBrl(item.result.landedCostBrl)} | Custo unitário: ${formatBrl(item.result.unitLandedCostBrl)}`);
    });
    doc.moveDown();

    doc.fontSize(13).font("Helvetica-Bold").text("Composição da importação consolidada");
    const importLines = [
      ["FOB convertido", result.fobBrl],
      ["Frete internacional", result.freightBrl],
      ["Seguro", result.insuranceBrl],
      ["AFRMM", input.afrmmBrl],
      ["Capatazia", input.capataziaBrl],
      ["II", result.iiBrl],
      ["IPI-Importação", result.ipiImportBrl],
      ["PIS-Importação", result.pisImportBrl],
      ["COFINS-Importação", result.cofinsImportBrl],
      ["ICMS-Importação", result.icmsImportBrl],
    ] as const;
    doc.fontSize(10).font("Helvetica");
    importLines.forEach(([label, value]) => doc.text(`${label}: ${formatBrl(value)}`));
    doc.moveDown();

    doc.fontSize(13).font("Helvetica-Bold").text("Débitos, créditos e resultado fiscal na venda");
    doc.fontSize(10).font("Helvetica");
    doc.text(`Preço de venda: ${formatBrl(result.sale.grossRevenueBrl)}`);
    doc.text(`ICMS próprio: ${formatBrl(result.sale.icmsOwnDebitBrl)}`);
    doc.text(`ICMS-ST: ${formatBrl(result.sale.icmsStDebitBrl)}`);
    doc.text(`IPI na saída: ${formatBrl(result.sale.ipiOutputDebitBrl)}`);
    doc.text(`PIS/COFINS sobre receita: ${formatBrl(result.sale.pisRevenueDebitBrl + result.sale.cofinsRevenueDebitBrl)}`);
    doc.text(`Créditos aproveitáveis estimados: ${formatBrl(result.sale.totalCreditsBrl)}`);
    doc.text(`Tributo líquido estimado: ${formatBrl(result.sale.netTaxBrl)}`);
    doc.moveDown();

    doc.fontSize(13).font("Helvetica-Bold").text("Aproveitamento de container");
    doc.fontSize(10).font("Helvetica");
    doc.text(`Cartons: ${result.totalCartons}`);
    doc.text(`CBM: ${result.totalCbm.toFixed(3)} de ${input.containerCbmCapacity} m³ (${formatPercent(result.container.cbmUsagePercent)})`);
    doc.text(`Peso bruto: ${result.totalWeightKg.toFixed(2)} de ${input.containerWeightCapacityKg} kg (${formatPercent(result.container.weightUsagePercent)})`);
    doc.text(`Fator limitante: ${result.container.limitingFactor}`);
    doc.text(`Alerta: ${result.container.alertLevel}`);
    doc.moveDown();

    doc.fontSize(8).fillColor("#333333").text(
      "Observação: relatório gerencial de simulação. As alíquotas e bases devem ser validadas com classificação fiscal, legislação vigente, despachante aduaneiro e documentos oficiais da importação.",
    );
    doc.end();
  });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  imports: router({
    defaults: publicProcedure.query(async () => {
      const rates = await ensureSeedTaxRates();
      return { input: defaultInput, quoteInput: defaultQuoteInput, rates };
    }),
    exchangeRate: publicProcedure.query(async () => {
      try {
        return await fetchUsdBrl();
      } catch (error) {
        return {
          pair: "USD/BRL",
          bid: defaultInput.exchangeRate,
          ask: defaultInput.exchangeRate,
          source: "fallback manual sugerido",
          error: error instanceof Error ? error.message : "Falha desconhecida",
        };
      }
    }),
    calculate: publicProcedure.input(calculationInputSchema).query(({ input }) => calculateImport(input)),
    calculateQuote: publicProcedure.input(quoteInputSchema).query(({ input }) => calculateQuote(input)),
    searchRates: publicProcedure.input(z.object({ term: z.string().default("") })).query(({ input }) => searchTaxRates(input.term)),
    upsertRate: protectedProcedure
      .input(
        z.object({
          ncm: z.string().min(1),
          description: z.string().min(1),
          iiRate: z.number().nonnegative(),
          ipiRate: z.number().nonnegative(),
          source: z.string().default("manual"),
        }),
      )
      .mutation(({ input }) => upsertTaxRate(input)),
    listQuotes: protectedProcedure.query(({ ctx }) => listQuotes(ctx.user.id)),
    saveQuote: protectedProcedure
      .input(
        z.object({
          id: z.number().optional(),
          name: z.string().min(1),
          payload: quoteInputSchema,
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const result = calculateQuote(input.payload);
        const firstItem = input.payload.items[0];
        const values = {
          userId: ctx.user.id,
          name: input.name,
          ncm: firstItem?.ncm || "MULTI",
          description: input.payload.items.length > 1 ? `${input.payload.items.length} itens / ${result.ncmList}` : firstItem?.description || "",
          payload: input.payload,
          results: result,
        };
        if (input.id) return updateQuote(ctx.user.id, input.id, values);
        return createQuote(values);
      }),
    duplicateQuote: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const quote = await getQuote(ctx.user.id, input.id);
      if (!quote) throw new Error("Orçamento não encontrado");
      return createQuote({
        userId: ctx.user.id,
        name: `${quote.name} — cópia`,
        ncm: quote.ncm,
        description: quote.description ?? "",
        payload: quote.payload,
        results: quote.results,
      });
    }),
    deleteQuote: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ ctx, input }) => deleteQuote(ctx.user.id, input.id)),
    reports: protectedProcedure.input(z.object({ quoteId: z.number() })).query(({ ctx, input }) => listReports(ctx.user.id, input.quoteId)),
    allReports: protectedProcedure.query(({ ctx }) => listAllReports(ctx.user.id)),
    generateReport: protectedProcedure.input(z.object({ quoteId: z.number() })).mutation(async ({ ctx, input }) => {
      const quote = await getQuote(ctx.user.id, input.quoteId);
      if (!quote) throw new Error("Orçamento não encontrado");
      const payload = normalizeSavedPayload(quote.payload);
      const result = calculateQuote(payload);
      const pdf = await buildQuotePdfBuffer(quote.name, payload, result);
      const safeName = quote.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "relatorio";
      const stored = await storagePut(`reports/${ctx.user.id}/${safeName}.pdf`, pdf, "application/pdf");
      await createReport({ quoteId: quote.id, userId: ctx.user.id, fileKey: stored.key, fileUrl: stored.url });
      return { ...stored, createdAt: new Date().toISOString() };
    }),
    dashboard: protectedProcedure.query(async ({ ctx }) => {
      const quotes = await listQuotes(ctx.user.id);
      const results = quotes.map(quote => quote.results as Partial<QuoteCalculationResult> & ImportCalculationResult);
      const count = quotes.length;
      const average = (items: number[]) => (items.length ? items.reduce((sum, item) => sum + item, 0) / items.length : 0);
      const byNcm = quotes.reduce<Record<string, { ncm: string; count: number; landed: number }>>((acc, quote) => {
        const result = quote.results as Partial<QuoteCalculationResult> & ImportCalculationResult;
        if (Array.isArray(result.items)) {
          result.items.forEach(item => {
            const ncm = item.input.ncm;
            acc[ncm] ??= { ncm, count: 0, landed: 0 };
            acc[ncm].count += 1;
            acc[ncm].landed += item.result.landedCostBrl;
          });
        } else {
          acc[quote.ncm] ??= { ncm: quote.ncm, count: 0, landed: 0 };
          acc[quote.ncm].count += 1;
          acc[quote.ncm].landed += result.landedCostBrl;
        }
        return acc;
      }, {});
      return {
        quoteCount: count,
        averageTaxBurden: average(results.map(item => item.sale.taxBurdenPercent)),
        averageMargin: average(results.map(item => item.sale.marginPercent)),
        averageLandedCost: average(results.map(item => item.landedCostBrl)),
        byNcm: Object.values(byNcm).map(item => ({ ...item, averageLandedCost: item.landed / item.count })),
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
