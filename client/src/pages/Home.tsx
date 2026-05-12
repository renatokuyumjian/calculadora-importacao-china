import {
  calculateBasicNationalization,
  defaultPremises,
  defaultProduct,
  type BasicNationalizationResult,
  type Currency,
  type PremiseInput,
  type ProductInput,
  type ProductResult,
} from "@shared/nationalizationBasics";
import { ChevronDown, ChevronUp, ExternalLink, Info, Plus, Trash2 } from "lucide-react";
import React, { useMemo, useState } from "react";

const brlFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const usdFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD" });
const numFmt = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 });

type CalculationExplanation = {
  base: string;
  formula: string;
  reason: string;
};

function brl(value: number) {
  return brlFmt.format(Number.isFinite(value) ? value : 0);
}

function usd(value: number) {
  return usdFmt.format(Number.isFinite(value) ? value : 0);
}

function number(value: number) {
  return numFmt.format(Number.isFinite(value) ? value : 0);
}

function percent(value: number) {
  return `${number(value)}%`;
}

function toNumber(value: string) {
  return Number(value || 0);
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function NumberField({ label, value, onChange, suffix, step = "0.01" }: { label: string; value: number; onChange: (value: number) => void; suffix?: string; step?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <div className="flex rounded-xl border border-slate-300 bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
        <input
          className="min-w-0 flex-1 rounded-xl bg-transparent px-3 py-2.5 text-base text-slate-950 outline-none"
          type="number"
          step={step}
          value={Number.isFinite(value) ? value : 0}
          onChange={event => onChange(toNumber(event.target.value))}
        />
        {suffix ? <span className="border-l border-slate-200 px-3 py-2.5 text-sm text-slate-500">{suffix}</span> : null}
      </div>
    </label>
  );
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        value={value}
        placeholder={placeholder}
        onChange={event => onChange(event.target.value)}
      />
    </label>
  );
}

function CurrencySelect({ value, onChange }: { value: Currency; onChange: (value: Currency) => void }) {
  return (
    <select
      className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
      value={value}
      onChange={event => onChange(event.target.value as Currency)}
    >
      <option value="BRL">R$</option>
      <option value="USD">US$</option>
    </select>
  );
}

function ResultBox({ label, value, explanation }: { label: string; value: string; explanation?: CalculationExplanation }) {
  return (
    <div className="group relative rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm text-slate-500">{label}</div>
          <div className="mt-1 break-words text-xl font-semibold text-slate-950">{value}</div>
        </div>
        {explanation ? (
          <button
            className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-700 outline-none transition hover:border-blue-400 hover:bg-blue-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            type="button"
            aria-label={`Ver base de cálculo de ${label}`}
          >
            <Info className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {explanation ? (
        <div className="pointer-events-none absolute right-0 top-[calc(100%-0.25rem)] z-40 hidden w-[min(22rem,calc(100vw-3rem))] rounded-2xl border border-blue-200 bg-white p-4 text-left text-xs leading-relaxed text-slate-700 shadow-2xl group-hover:block group-focus-within:block">
          <p className="text-sm font-semibold text-slate-950">Como este valor foi calculado</p>
          <div className="mt-3 space-y-3">
            <div>
              <p className="font-semibold text-blue-800">Base usada</p>
              <p>{explanation.base}</p>
            </div>
            <div>
              <p className="font-semibold text-blue-800">Fórmula aplicada</p>
              <p>{explanation.formula}</p>
            </div>
            <div>
              <p className="font-semibold text-blue-800">Por que é feito assim</p>
              <p>{explanation.reason}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function productTaxExplanation(product: ProductResult | undefined, tax: "ii" | "ipi" | "pis" | "cofins" | "icms" | "total"): CalculationExplanation | undefined {
  if (!product) return undefined;

  if (tax === "ii") {
    return {
      base: `Valor aduaneiro do item: FOB em reais ${brl(product.fobTotalBrl)} + frete rateado ${brl(product.allocatedFreightBrl)} = ${brl(product.customsValueBrl)}.`,
      formula: `II = valor aduaneiro × alíquota de II = ${brl(product.customsValueBrl)} × ${percent(product.iiRate)} = ${brl(product.iiBrl)}.`,
      reason: "Nesta calculadora, o Imposto de Importação incide diretamente sobre o valor aduaneiro do item, que é a base formada pelo valor FOB convertido em reais mais o frete internacional rateado para o produto.",
    };
  }

  if (tax === "ipi") {
    return {
      base: `Base do IPI de importação: valor aduaneiro ${brl(product.customsValueBrl)} + II ${brl(product.iiBrl)} = ${brl(product.ipiImportBaseBrl)}.`,
      formula: `IPI = base do IPI × alíquota de IPI = ${brl(product.ipiImportBaseBrl)} × ${percent(product.ipiImportRate)} = ${brl(product.ipiImportBrl)}.`,
      reason: "O IPI de importação é calculado depois do II, por isso esta versão considera o valor aduaneiro acrescido do Imposto de Importação antes de aplicar a alíquota informada para o NCM.",
    };
  }

  if (tax === "pis") {
    return {
      base: `Base do PIS-Importação: valor aduaneiro do item = ${brl(product.customsValueBrl)}.`,
      formula: `PIS-Importação = valor aduaneiro × alíquota de PIS = ${brl(product.customsValueBrl)} × ${percent(product.pisImportRate)} = ${brl(product.pisImportBrl)}.`,
      reason: "Para manter a simulação auditável por item, o PIS-Importação usa a mesma base aduaneira do item e aplica a alíquota editável que você informou para aquele NCM.",
    };
  }

  if (tax === "cofins") {
    return {
      base: `Base da COFINS-Importação: valor aduaneiro do item = ${brl(product.customsValueBrl)}.`,
      formula: `COFINS-Importação = valor aduaneiro × alíquota de COFINS = ${brl(product.customsValueBrl)} × ${percent(product.cofinsImportRate)} = ${brl(product.cofinsImportBrl)}.`,
      reason: "Assim como o PIS-Importação, a COFINS-Importação é simulada sobre o valor aduaneiro do item para permitir conferência direta por NCM e comparação com as alíquotas transcritas do simulador oficial.",
    };
  }

  if (tax === "icms") {
    const numerator = product.customsValueBrl + product.iiBrl + product.ipiImportBrl + product.pisImportBrl + product.cofinsImportBrl + product.allocatedAduaneiraCostsBrl;
    return {
      base: `Base por dentro antes do ICMS: valor aduaneiro ${brl(product.customsValueBrl)} + II ${brl(product.iiBrl)} + IPI ${brl(product.ipiImportBrl)} + PIS ${brl(product.pisImportBrl)} + COFINS ${brl(product.cofinsImportBrl)} + custos aduaneiros rateados ${brl(product.allocatedAduaneiraCostsBrl)} = ${brl(numerator)}. Despesas portuárias brasileiras pagas a terminais, operadores, recintos alfandegados ou terceiros privados (${brl(product.allocatedPortExpensesBrl)}), capatazias nacionais destacadas (${brl(product.allocatedCapataziasBrl)}) e frete rodoviário pós-desembaraço (${brl(product.allocatedRoadFreightBrl)}) ficam fora desta base. Base final: ${brl(product.icmsImportBaseBrl)}.`,
      formula: `Base ICMS = ${brl(numerator)} ÷ (1 - ${percent(product.icmsImportRate)}). ICMS = base ICMS ${brl(product.icmsImportBaseBrl)} × ${percent(product.icmsImportRate)} = ${brl(product.icmsImportBrl)}.`,
      reason: "O ICMS-Importação é tratado por dentro nesta simulação: a própria carga de ICMS compõe a base. Nesta versão, apenas despesas aduaneiras que continuam no numerador, como Siscomex e AFRMM, entram na base; despesas portuárias brasileiras pagas a terceiros, capatazias nacionais destacadas e frete rodoviário contratado após o desembaraço permanecem apenas no custo nacionalizado.",
    };
  }

  return {
    base: `Soma dos impostos calculados para este item: II ${brl(product.iiBrl)}, IPI ${brl(product.ipiImportBrl)}, PIS ${brl(product.pisImportBrl)}, COFINS ${brl(product.cofinsImportBrl)} e ICMS ${brl(product.icmsImportBrl)}.`,
    formula: `Total de impostos = ${brl(product.iiBrl)} + ${brl(product.ipiImportBrl)} + ${brl(product.pisImportBrl)} + ${brl(product.cofinsImportBrl)} + ${brl(product.icmsImportBrl)} = ${brl(product.importTaxesBrl)}.`,
    reason: "O total de impostos consolida os tributos calculados individualmente para o produto, permitindo verificar a carga tributária do item antes de somar custo nacionalizado e demais produtos.",
  };
}

function totalTaxExplanation(result: BasicNationalizationResult, tax: "ii" | "ipi" | "pis" | "cofins" | "icms" | "total"): CalculationExplanation {
  if (tax === "ii") {
    return {
      base: `Soma dos valores de II calculados item por item, cada um sobre seu respectivo valor aduaneiro. Valor aduaneiro total: ${brl(result.totalCustomsValueBrl)}.`,
      formula: `II total = soma do II de todos os produtos = ${brl(result.totalIiBrl)}.`,
      reason: "O consolidado não aplica uma alíquota média. Ele soma os impostos já calculados por item para preservar diferenças de NCM, alíquota e participação no frete.",
    };
  }

  if (tax === "ipi") {
    return {
      base: "Soma das bases de IPI de cada produto, nas quais cada item considera seu valor aduaneiro mais o II do próprio item.",
      formula: `IPI-Importação total = soma do IPI de todos os produtos = ${brl(result.totalIpiImportBrl)}.`,
      reason: "A totalização respeita a alíquota informada em cada NCM. Por isso, o valor total é a soma dos resultados individuais, e não um cálculo único sobre todos os itens.",
    };
  }

  if (tax === "pis") {
    return {
      base: `Soma dos valores de PIS-Importação calculados sobre o valor aduaneiro de cada item. Valor aduaneiro total: ${brl(result.totalCustomsValueBrl)}.`,
      formula: `PIS-Importação total = soma do PIS de todos os produtos = ${brl(result.totalPisImportBrl)}.`,
      reason: "Cada produto pode ter participação diferente no FOB e no frete rateado. O total soma os resultados item por item para manter rastreabilidade por NCM.",
    };
  }

  if (tax === "cofins") {
    return {
      base: `Soma dos valores de COFINS-Importação calculados sobre o valor aduaneiro de cada item. Valor aduaneiro total: ${brl(result.totalCustomsValueBrl)}.`,
      formula: `COFINS-Importação total = soma da COFINS de todos os produtos = ${brl(result.totalCofinsImportBrl)}.`,
      reason: "A calculadora mantém a apuração separada por item e apenas consolida o resultado final, evitando perder diferenças de alíquota por NCM.",
    };
  }

  if (tax === "icms") {
    return {
      base: "Soma dos valores de ICMS-Importação calculados por dentro em cada produto, usando a base individual de cada item com custos aduaneiros rateados e sem incluir despesas portuárias brasileiras pagas a terceiros, capatazias nacionais destacadas nem frete rodoviário pós-desembaraço.",
      formula: `ICMS-Importação total = soma do ICMS de todos os produtos = ${brl(result.totalIcmsImportBrl)}.`,
      reason: "Como o ICMS pode variar por item e sua base é calculada por dentro, o total consolidado precisa somar os cálculos individuais para manter coerência com cada NCM.",
    };
  }

  return {
    base: `Soma dos tributos consolidados: II ${brl(result.totalIiBrl)}, IPI ${brl(result.totalIpiImportBrl)}, PIS ${brl(result.totalPisImportBrl)}, COFINS ${brl(result.totalCofinsImportBrl)} e ICMS ${brl(result.totalIcmsImportBrl)}.`,
    formula: `Total de impostos = ${brl(result.totalIiBrl)} + ${brl(result.totalIpiImportBrl)} + ${brl(result.totalPisImportBrl)} + ${brl(result.totalCofinsImportBrl)} + ${brl(result.totalIcmsImportBrl)} = ${brl(result.totalImportTaxesBrl)}.`,
    reason: "O total consolidado soma todos os impostos dos produtos para mostrar a carga tributária estimada da importação inteira, sem misturar alíquotas de NCMs diferentes em uma média artificial.",
  };
}

function newProduct(): ProductInput {
  return {
    ...defaultProduct,
    id: `produto-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  };
}

// ── Compact list row (collapsed) ──────────────────────────────────────────────

function ProductRow({
  index,
  product,
  calculated,
  expanded,
  onToggle,
  onRemove,
  onUpdate,
  isOnly,
}: {
  index: number;
  product: ProductInput;
  calculated: ProductResult | undefined;
  expanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onUpdate: (patch: Partial<ProductInput>) => void;
  isOnly: boolean;
}) {
  const label = product.description || `Produto ${index + 1}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* ── Summary row ─────────────────────────────────────────────────────── */}
      <div
        className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-slate-50 md:gap-4"
        onClick={onToggle}
        role="button"
        aria-expanded={expanded}
      >
        {/* Index */}
        <span className="w-6 shrink-0 text-center text-sm font-bold text-slate-400">{index + 1}</span>

        {/* Description + NCM */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{label}</p>
          <p className="truncate text-xs text-slate-500">{product.ncm || <span className="italic">NCM não informado</span>}</p>
        </div>

        {/* Key metrics – hidden on very small screens */}
        <div className="hidden shrink-0 text-right sm:block">
          <p className="text-sm font-medium text-slate-800">{number(product.desiredQuantity)}</p>
        </div>

        <div className="hidden shrink-0 text-right md:block">
          <p className="text-sm font-medium text-slate-800">{usd(calculated?.fobTotalUsd || 0)}</p>
        </div>

        <div className="hidden shrink-0 text-right lg:block">
          <p className="text-sm font-medium text-slate-800">{brl(calculated?.costWithoutIpiIcmsBrl || 0)}</p>
        </div>

        <div className="hidden shrink-0 text-right lg:block">
          <p className="text-sm font-medium text-slate-800">{brl(calculated?.unitCostWithoutIpiIcmsBrl || 0)}</p>
        </div>

        <div className="hidden shrink-0 text-right xl:block">
          <p className="text-sm font-medium text-blue-700">{number(calculated?.importIndex || 0)}</p>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
            type="button"
            onClick={e => { e.stopPropagation(); onRemove(); }}
            disabled={isOnly}
            title="Remover produto"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </div>
      </div>

      {/* ── Expanded detail panel ────────────────────────────────────────────── */}
      {expanded && (
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-5 space-y-5">

          {/* Inputs */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <TextField label="Descrição curta do produto" value={product.description} onChange={description => onUpdate({ description })} placeholder="Ex.: garrafa térmica" />
            <TextField label="NCM" value={product.ncm} onChange={ncm => onUpdate({ ncm })} placeholder="Ex.: 9617.00.10" />
            <NumberField label="Quantidade desejada" value={product.desiredQuantity} onChange={desiredQuantity => onUpdate({ desiredQuantity })} step="1" />
            <NumberField label="Preço unitário FOB" value={product.fobUnitUsd} onChange={fobUnitUsd => onUpdate({ fobUnitUsd })} suffix="US$" />
            <NumberField label="Unidades por carton" value={product.unitsPerCarton} onChange={unitsPerCarton => onUpdate({ unitsPerCarton })} step="1" />
            <NumberField label="Peso bruto do carton" value={product.grossWeightPerCartonKg} onChange={grossWeightPerCartonKg => onUpdate({ grossWeightPerCartonKg })} suffix="kg" />
            <NumberField label="Peso líquido do carton" value={product.netWeightPerCartonKg} onChange={netWeightPerCartonKg => onUpdate({ netWeightPerCartonKg })} suffix="kg" />
            <NumberField label="Altura da caixa" value={product.cartonHeightCm} onChange={cartonHeightCm => onUpdate({ cartonHeightCm })} suffix="cm" />
            <NumberField label="Largura da caixa" value={product.cartonWidthCm} onChange={cartonWidthCm => onUpdate({ cartonWidthCm })} suffix="cm" />
            <NumberField label="Comprimento da caixa" value={product.cartonLengthCm} onChange={cartonLengthCm => onUpdate({ cartonLengthCm })} suffix="cm" />
          </div>

          {/* Tax rates */}
          <div className="rounded-2xl border border-blue-100 bg-white p-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-blue-800">Alíquotas de importação por NCM</h4>
            <p className="mt-1 text-sm text-slate-500">Consulte o NCM no simulador da Receita e informe os percentuais abaixo.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-5">
              <NumberField label="II" value={product.iiRate} onChange={iiRate => onUpdate({ iiRate })} suffix="%" />
              <NumberField label="IPI" value={product.ipiImportRate} onChange={ipiImportRate => onUpdate({ ipiImportRate })} suffix="%" />
              <NumberField label="PIS-Importação" value={product.pisImportRate} onChange={pisImportRate => onUpdate({ pisImportRate })} suffix="%" />
              <NumberField label="COFINS-Importação" value={product.cofinsImportRate} onChange={cofinsImportRate => onUpdate({ cofinsImportRate })} suffix="%" />
              <NumberField label="ICMS-Importação" value={product.icmsImportRate} onChange={icmsImportRate => onUpdate({ icmsImportRate })} suffix="%" />
            </div>
          </div>

          {/* FOB results */}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <ResultBox label="FOB unitário em USD" value={usd(calculated?.fobUnitUsd || 0)} />
            <ResultBox label="FOB total em USD" value={usd(calculated?.fobTotalUsd || 0)} />
            <ResultBox label="FOB unitário em BRL" value={brl(calculated?.fobUnitBrl || 0)} />
            <ResultBox label="FOB total em BRL" value={brl(calculated?.fobTotalBrl || 0)} />
          </div>

          {/* Allocation */}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
            <ResultBox label="Rateio do frete" value={brl(calculated?.allocatedFreightBrl || 0)} />
            <ResultBox label="Rateio custos aduaneiros ICMS" value={brl(calculated?.allocatedAduaneiraCostsBrl || 0)} />
            <ResultBox label="Rateio despesas portuárias fora ICMS" value={brl(calculated?.allocatedPortExpensesBrl || 0)} />
            <ResultBox label="Rateio capatazias fora ICMS" value={brl(calculated?.allocatedCapataziasBrl || 0)} />
            <ResultBox label="Rateio frete rodoviário" value={brl(calculated?.allocatedRoadFreightBrl || 0)} />
            <ResultBox label="Valor aduaneiro" value={brl(calculated?.customsValueBrl || 0)} />
            <ResultBox label="Participação no FOB" value={`${number(calculated?.sharePercent || 0)}%`} />
          </div>

          {/* Tax results */}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <ResultBox label="II" value={brl(calculated?.iiBrl || 0)} explanation={productTaxExplanation(calculated, "ii")} />
            <ResultBox label="IPI importação" value={brl(calculated?.ipiImportBrl || 0)} explanation={productTaxExplanation(calculated, "ipi")} />
            <ResultBox label="PIS importação" value={brl(calculated?.pisImportBrl || 0)} explanation={productTaxExplanation(calculated, "pis")} />
            <ResultBox label="COFINS importação" value={brl(calculated?.cofinsImportBrl || 0)} explanation={productTaxExplanation(calculated, "cofins")} />
            <ResultBox label="Base ICMS importação" value={brl(calculated?.icmsImportBaseBrl || 0)} explanation={productTaxExplanation(calculated, "icms")} />
            <ResultBox label="ICMS importação" value={brl(calculated?.icmsImportBrl || 0)} explanation={productTaxExplanation(calculated, "icms")} />
            <ResultBox label="Total impostos" value={brl(calculated?.importTaxesBrl || 0)} explanation={productTaxExplanation(calculated, "total")} />
            <ResultBox label="Custo nacionalizado" value={brl(calculated?.landedCostBrl || 0)} />
            <ResultBox label="Custo total S/ IPI e ICMS" value={brl(calculated?.costWithoutIpiIcmsBrl || 0)} />
            <ResultBox label="Custo un. S/ IPI e ICMS" value={brl(calculated?.unitCostWithoutIpiIcmsBrl || 0)} />
            <ResultBox label="Índice importação" value={number(calculated?.importIndex || 0)} />
          </div>

          {/* Carton results */}
          <div className="grid gap-3 md:grid-cols-5">
            <ResultBox label="Cartons necessários" value={number(calculated?.cartons || 0)} />
            <ResultBox label="Unidades pedidas" value={number(calculated?.orderedUnits || 0)} />
            <ResultBox label="Peso bruto total" value={`${number(calculated?.totalGrossWeightKg || 0)} kg`} />
            <ResultBox label="Peso líquido total" value={`${number(calculated?.totalNetWeightKg || 0)} kg`} />
            <ResultBox label="CBM total" value={`${number(calculated?.totalCbm || 0)} m³`} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Home() {
  const [exchangeRate, setExchangeRate] = useState(5.05);
  const [premises, setPremises] = useState<PremiseInput[]>(defaultPremises);
  const [products, setProducts] = useState<ProductInput[]>([{ ...defaultProduct }]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set([defaultProduct.id]));
  const [premisesOpen, setPremisesOpen] = useState(true);

  const result = useMemo(
    () => calculateBasicNationalization({ exchangeRate, premises, products }),
    [exchangeRate, premises, products],
  );

  function updatePremise(index: number, patch: Partial<PremiseInput>) {
    setPremises(current => current.map((p, i) => i === index ? { ...p, ...patch } : p));
  }

  function updateProduct(index: number, patch: Partial<ProductInput>) {
    setProducts(current => current.map((p, i) => i === index ? { ...p, ...patch } : p));
  }

  function addProduct() {
    const next = newProduct();
    setProducts(current => [...current, next]);
    setExpandedIds(current => new Set([...current, next.id]));
  }

  function removeProduct(index: number) {
    const id = products[index]?.id;
    setProducts(current => current.length === 1 ? current : current.filter((_, i) => i !== index));
    if (id) setExpandedIds(current => { const s = new Set(current); s.delete(id); return s; });
  }

  function toggleExpanded(id: string) {
    setExpandedIds(current => {
      const s = new Set(current);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <header className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Calculadora de Nacionalização</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Premissas, produtos, FOB e impostos de importação</h1>
          <p className="mt-3 max-w-4xl text-base text-slate-600">
            Informe as premissas em dólar ou real, cadastre os produtos e preencha as alíquotas conforme o NCM para calcular FOB, valor aduaneiro, impostos item por item e total consolidado.
          </p>
          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-950">
            <p>
              Use o simulador oficial da Receita Federal como referência para conferir NCM, alíquotas e tratamento tributário. Como o site oficial possui validação humana, esta calculadora mantém os campos de alíquotas editáveis para você transcrever os percentuais corretos por item.
            </p>
            <a
              className="mt-2 inline-flex items-center font-semibold text-blue-800 underline-offset-4 hover:underline"
              href="https://www4.receita.fazenda.gov.br/simulador/"
              target="_blank"
              rel="noreferrer"
            >
              Abrir simulador da Receita Federal <ExternalLink className="ml-1 h-4 w-4" />
            </a>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            {/* Premises */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <button
                className="flex w-full cursor-pointer items-center justify-between gap-4 p-5 text-left hover:bg-slate-50"
                type="button"
                onClick={() => setPremisesOpen(o => !o)}
                aria-expanded={premisesOpen}
              >
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Premissas da nacionalização</h2>
                  {!premisesOpen && (
                    <p className="mt-0.5 text-sm text-slate-500">
                      Câmbio: {brl(exchangeRate)} · Premissas: {brl(result.totalPremisesBrl)}
                    </p>
                  )}
                </div>
                {premisesOpen ? <ChevronUp className="h-5 w-5 shrink-0 text-slate-400" /> : <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" />}
              </button>

              {premisesOpen && (
                <div className="border-t border-slate-200 px-5 pb-5 pt-5">
                  <p className="mb-5 text-sm text-slate-600">O frete internacional entra no valor aduaneiro. Siscomex e AFRMM são rateados para a base do ICMS-Importação; despesas portuárias brasileiras pagas a terceiros, capatazias nacionais destacadas e frete rodoviário pós-desembaraço entram apenas no custo nacionalizado.</p>
                  <div className="mb-5 max-w-xs">
                    <NumberField label="Dólar / Câmbio" value={exchangeRate} onChange={setExchangeRate} suffix="BRL" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {premises.map((premise, index) => (
                      <div key={premise.key} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <span className="mb-2 block text-sm font-medium text-slate-700">{premise.label}</span>
                        <div className="grid grid-cols-[1fr_92px] gap-2">
                          <input
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            type="number"
                            step="0.01"
                            value={Number.isFinite(premise.value) ? premise.value : 0}
                            onChange={event => updatePremise(index, { value: toNumber(event.target.value) })}
                          />
                          <CurrencySelect value={premise.currency} onChange={currency => updatePremise(index, { currency })} />
                        </div>
                        <p className="mt-2 text-sm text-slate-500">Total em reais: <strong className="text-slate-900">{brl(result.premises[index]?.valueBrl || 0)}</strong></p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Products */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Produtos que serão importados</h2>
                  <p className="mt-1 text-sm text-slate-600">{products.length} {products.length === 1 ? "produto" : "produtos"} — clique em um item para expandir e editar.</p>
                </div>
                <button
                  className="inline-flex shrink-0 items-center justify-center rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
                  type="button"
                  onClick={addProduct}
                >
                  <Plus className="mr-2 h-4 w-4" /> Adicionar
                </button>
              </div>

              {/* Column headers (visible md+) */}
              <div className="mb-1 hidden items-center gap-3 px-4 md:flex md:gap-4">
                <span className="w-6 shrink-0" />
                <span className="flex-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Produto / NCM</span>
                <span className="hidden w-16 shrink-0 text-right text-xs font-semibold uppercase tracking-wide text-slate-400 sm:block">Qtd</span>
                <span className="hidden w-28 shrink-0 text-right text-xs font-semibold uppercase tracking-wide text-slate-400 md:block">FOB total</span>
                <span className="hidden w-32 shrink-0 text-right text-xs font-semibold uppercase tracking-wide text-slate-400 lg:block">Custo S/ IPI ICMS</span>
                <span className="hidden w-24 shrink-0 text-right text-xs font-semibold uppercase tracking-wide text-slate-400 lg:block">Custo un.</span>
                <span className="hidden w-16 shrink-0 text-right text-xs font-semibold uppercase tracking-wide text-slate-400 xl:block">Índice</span>
                <span className="w-20 shrink-0" />
              </div>

              <div className="space-y-2">
                {products.map((product, index) => (
                  <ProductRow
                    key={product.id}
                    index={index}
                    product={product}
                    calculated={result.products[index]}
                    expanded={expandedIds.has(product.id)}
                    onToggle={() => toggleExpanded(product.id)}
                    onRemove={() => removeProduct(index)}
                    onUpdate={patch => updateProduct(index, patch)}
                    isOnly={products.length === 1}
                  />
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar summary */}
          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <Section title="Resumo consolidado" subtitle="Totais de todos os produtos e impostos calculados com as alíquotas informadas por item.">
              <div className="grid gap-3">
                <ResultBox label="Premissas em reais" value={brl(result.totalPremisesBrl)} />
                <ResultBox label="FOB total em USD" value={usd(result.totalFobUsd)} />
                <ResultBox label="FOB total em BRL" value={brl(result.totalFobBrl)} />
                <ResultBox label="Valor aduaneiro total" value={brl(result.totalCustomsValueBrl)} />
                <ResultBox label="II total" value={brl(result.totalIiBrl)} explanation={totalTaxExplanation(result, "ii")} />
                <ResultBox label="IPI importação total" value={brl(result.totalIpiImportBrl)} explanation={totalTaxExplanation(result, "ipi")} />
                <ResultBox label="PIS importação total" value={brl(result.totalPisImportBrl)} explanation={totalTaxExplanation(result, "pis")} />
                <ResultBox label="COFINS importação total" value={brl(result.totalCofinsImportBrl)} explanation={totalTaxExplanation(result, "cofins")} />
                <ResultBox label="ICMS importação total" value={brl(result.totalIcmsImportBrl)} explanation={totalTaxExplanation(result, "icms")} />
                <ResultBox label="Total de impostos" value={brl(result.totalImportTaxesBrl)} explanation={totalTaxExplanation(result, "total")} />
                <ResultBox label="Custo nacionalizado total" value={brl(result.totalLandedCostBrl)} />
                <ResultBox label="Cartons totais" value={number(result.totalCartons)} />
                <ResultBox label="Peso bruto total" value={`${number(result.totalGrossWeightKg)} kg`} />
                <ResultBox label="Peso líquido total" value={`${number(result.totalNetWeightKg)} kg`} />
                <ResultBox label="CBM total" value={`${number(result.totalCbm)} m³`} />
              </div>
            </Section>
          </aside>
        </div>
      </div>
    </main>
  );
}
