"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type PeriodType = "years" | "months" | "days";

/** Orden de granularidad: el más fino primero */
const PERIOD_ORDER: Record<PeriodType, number> = { days: 0, months: 1, years: 2 };

function getPeriodsPerYear(type: PeriodType): number {
  if (type === "days") return 365;
  if (type === "months") return 12;
  return 1;
}

/** Convierte "cada X [unit]" a número de periodos de tipo base. */
function contributionIntervalInBasePeriods(
  contribEvery: number,
  contribType: PeriodType,
  baseType: PeriodType
): number {
  const contribPerYear = getPeriodsPerYear(contribType);
  const basePerYear = getPeriodsPerYear(baseType);
  return Math.max(1, Math.round((contribEvery * basePerYear) / contribPerYear));
}

function formatNumberThousands(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function parseNumberFromFormatted(str: string): number {
  const digits = str.replace(/[^\d]/g, "");
  return digits === "" ? 0 : parseInt(digits, 10);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatInputDisplay(value: string): string {
  const n = parseNumberFromFormatted(value);
  if (n === 0) return "";
  return formatNumberThousands(n);
}

export default function InteresSimplePage() {
  const [principal, setPrincipal] = useState<string>("1000000");
  const [ratePercent, setRatePercent] = useState<string>("10");
  const [periodType, setPeriodType] = useState<PeriodType>("years");
  const [periods, setPeriods] = useState<string>("3");
  const [contributionAmount, setContributionAmount] = useState<string>("");
  const [contributionFreqEvery, setContributionFreqEvery] = useState<string>("1");
  const [contributionFreqType, setContributionFreqType] = useState<PeriodType>("months");

  const { result, tableData, chartData, comparison, hasContribution, totalContrib, effectivePeriodLabel, evolutionTitle, effectivePeriodSingular } = useMemo(() => {
    const P = parseNumberFromFormatted(principal) || parseFloat(principal) || 0;
    const rateAnnual = (parseFloat(ratePercent) || 0) / 100;
    const n = Math.floor(parseFloat(periods) || 0);
    const PMT = parseNumberFromFormatted(contributionAmount) || parseFloat(contributionAmount) || 0;
    const contribEvery = Math.max(1, Math.floor(parseFloat(contributionFreqEvery) || 1));
    const hasContribution = PMT > 0;

    if (P <= 0 || n <= 0) {
      return {
        result: null,
        tableData: [],
        chartData: [],
        comparison: null,
        hasContribution: false,
        totalContrib: 0,
        effectivePeriodLabel: "",
        evolutionTitle: "",
        effectivePeriodSingular: "",
      };
    }

    let workingType: PeriodType = periodType;
    if (hasContribution && PERIOD_ORDER[contributionFreqType] < PERIOD_ORDER[periodType]) {
      workingType = contributionFreqType;
    }
    const periodsPerUnit = getPeriodsPerYear(workingType);
    const totalWorkingPeriods = n * (periodsPerUnit / getPeriodsPerYear(periodType));
    const nWork = Math.floor(totalWorkingPeriods);

    let r: number;
    if (workingType === "years") r = rateAnnual;
    else if (workingType === "months") r = rateAnnual / 12;
    else r = rateAnnual / 365;

    const periodLabel =
      workingType === "years" ? "Año" : workingType === "months" ? "Mes" : "Día";
    const tableData: { period: number; label: string; value: number; interest: number }[] = [];
    const chartData: { periodo: string; valor: number; intereses: number }[] = [];

    if (!hasContribution) {
      const I = P * r * n;
      const M = P + I;
      const result = { M, interest: I, r, n };
      const interestPerPeriod = P * r;
      for (let i = 0; i <= n; i++) {
        const value = P + interestPerPeriod * i;
        const periodInterest = interestPerPeriod * i;
        tableData.push({
          period: i,
          label: `${periodLabel} ${i}`,
          value,
          interest: i === 0 ? 0 : interestPerPeriod,
        });
        chartData.push({
          periodo: `${periodLabel} ${i}`,
          valor: Math.round(value),
          intereses: Math.round(periodInterest),
        });
      }
      const MCompound = P * Math.pow(1 + r, n);
      const comparison =
        n > 0 ? { simple: M, compound: MCompound, diff: MCompound - M } : null;
      const effectivePeriodLabel =
        periodType === "years" ? "años" : periodType === "months" ? "meses" : "días";
      const evolutionTitle =
        periodType === "years" ? "año a año" : periodType === "months" ? "mes a mes" : "día a día";
      const effectivePeriodSingular =
        periodType === "years" ? "Año" : periodType === "months" ? "Mes" : "Día";
      return {
        result,
        tableData,
        chartData,
        comparison,
        hasContribution: false,
        totalContrib: 0,
        effectivePeriodLabel,
        evolutionTitle,
        effectivePeriodSingular,
      };
    }

    const contribInterval = contributionIntervalInBasePeriods(
      contribEvery,
      contributionFreqType,
      workingType
    );
    const interestPerPeriod = P * r;
    let balance = P;
    const balances: number[] = [P];
    for (let i = 0; i < nWork; i++) {
      balance += interestPerPeriod;
      if ((i + 1) % contribInterval === 0) balance += PMT;
      balances.push(balance);
    }
    const M = balance;
    const totalContrib = PMT * Math.floor(nWork / contribInterval);
    const I = P * r * nWork;
    const result = { M, interest: I, r, n: nWork };

    for (let i = 0; i < balances.length; i++) {
      const value = balances[i];
      const periodInterest = i === 0 ? 0 : interestPerPeriod;
      tableData.push({
        period: i,
        label: `${periodLabel} ${i}`,
        value,
        interest: i === 0 ? 0 : interestPerPeriod,
      });
      chartData.push({
        periodo: `${periodLabel} ${i}`,
        valor: Math.round(value),
        intereses: Math.round(i === 0 ? 0 : interestPerPeriod),
      });
    }

    const MCompound = P * Math.pow(1 + r, nWork);
    const comparison =
      nWork > 0 ? { simple: M, compound: MCompound, diff: MCompound - M } : null;
    const effectivePeriodLabel =
      workingType === "years" ? "años" : workingType === "months" ? "meses" : "días";
    const evolutionTitle =
      workingType === "years" ? "año a año" : workingType === "months" ? "mes a mes" : "día a día";
    const effectivePeriodSingular =
      workingType === "years" ? "Año" : workingType === "months" ? "Mes" : "Día";

    return {
      result,
      tableData,
      chartData,
      comparison,
      hasContribution: true,
      totalContrib,
      effectivePeriodLabel,
      evolutionTitle,
      effectivePeriodSingular,
    };
  }, [
    principal,
    ratePercent,
    periodType,
    periods,
    contributionAmount,
    contributionFreqEvery,
    contributionFreqType,
  ]);

  const handlePrincipalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    setPrincipal(raw === "" ? "0" : raw);
  };

  const handleContributionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    setContributionAmount(raw === "" ? "" : raw);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 font-sans">
      <main className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Calculadora de interés simple
          </h1>
          <p className="mt-2 text-slate-400">
            Los intereses no se acumulan al capital. I = P · r · t — M = P + I
          </p>
        </header>

        <section className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 shadow-xl backdrop-blur sm:p-8">
          <div className="space-y-5">
            <div>
              <label htmlFor="principal" className="mb-1.5 block text-sm font-medium text-slate-300">
                Capital inicial (P)
              </label>
              <input
                id="principal"
                type="text"
                inputMode="numeric"
                value={formatInputDisplay(principal)}
                onChange={handlePrincipalChange}
                placeholder="Ej: 1.000.000"
                className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div>
              <label htmlFor="rate" className="mb-1.5 block text-sm font-medium text-slate-300">
                Tasa de interés anual (%)
              </label>
              <input
                id="rate"
                type="number"
                min="0"
                step="0.1"
                value={ratePercent}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRatePercent(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                placeholder="Ej: 10"
              />
            </div>

            <div>
              <span className="mb-1.5 block text-sm font-medium text-slate-300">
                Tipo de periodo
              </span>
              <div className="flex gap-2 rounded-lg border border-slate-600 bg-slate-900/60 p-1">
                <button
                  type="button"
                  onClick={() => setPeriodType("years")}
                  className={`flex-1 rounded-md py-2.5 text-sm font-medium transition-colors ${
                    periodType === "years"
                      ? "bg-amber-600 text-white"
                      : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
                  }`}
                >
                  Años
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodType("months")}
                  className={`flex-1 rounded-md py-2.5 text-sm font-medium transition-colors ${
                    periodType === "months"
                      ? "bg-amber-600 text-white"
                      : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
                  }`}
                >
                  Meses
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodType("days")}
                  className={`flex-1 rounded-md py-2.5 text-sm font-medium transition-colors ${
                    periodType === "days"
                      ? "bg-amber-600 text-white"
                      : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
                  }`}
                >
                  Diario
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="periods" className="mb-1.5 block text-sm font-medium text-slate-300">
                {periodType === "years"
                  ? "Número de años (t)"
                  : periodType === "months"
                    ? "Número de meses (t)"
                    : "Número de días (t)"}
              </label>
              <input
                id="periods"
                type="number"
                min="1"
                step={1}
                value={periods}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPeriods(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                placeholder={
                  periodType === "years" ? "Ej: 3" : periodType === "months" ? "Ej: 6" : "Ej: 30"
                }
              />
              {periodType === "months" && (
                <p className="mt-1 text-xs text-slate-500">
                  Tasa por periodo: {(parseFloat(ratePercent) || 0) / 12}% mensual
                </p>
              )}
              {periodType === "days" && (
                <p className="mt-1 text-xs text-slate-500">
                  Tasa por periodo: {((parseFloat(ratePercent) || 0) / 365).toFixed(4)}% diaria
                </p>
              )}
            </div>

            <div className="rounded-xl border border-slate-600/50 bg-slate-900/40 p-4">
              <p className="mb-3 text-sm font-medium text-slate-300">
                Abono periódico <span className="text-slate-500">(opcional)</span>
              </p>
              <p className="mb-3 text-xs text-slate-500">
                Ej.: inversión inicial 1.000.000 y cada mes agrego 100.000
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="contribution"
                    className="mb-1.5 block text-xs font-medium text-slate-400"
                  >
                    Monto del abono
                  </label>
                  <input
                    id="contribution"
                    type="text"
                    inputMode="numeric"
                    value={
                      contributionAmount === ""
                        ? ""
                        : formatNumberThousands(parseNumberFromFormatted(contributionAmount) || 0)
                    }
                    onChange={handleContributionChange}
                    placeholder="Ej: 100000"
                    className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <div className="flex-1 min-w-[80px]">
                    <label
                      htmlFor="contributionFreq"
                      className="mb-1.5 block text-xs font-medium text-slate-400"
                    >
                      Cada
                    </label>
                    <input
                      id="contributionFreq"
                      type="number"
                      min="1"
                      value={contributionFreqEvery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setContributionFreqEvery(e.target.value || "1")
                      }
                      className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>
                  <div className="flex-1 min-w-[100px]">
                    <span className="mb-1.5 block text-xs font-medium text-slate-400">
                      Unidad
                    </span>
                    <div className="flex gap-1 rounded-lg border border-slate-600 bg-slate-900/60 p-1">
                      <button
                        type="button"
                        onClick={() => setContributionFreqType("days")}
                        className={`flex-1 rounded py-2 text-xs font-medium transition-colors ${
                          contributionFreqType === "days"
                            ? "bg-amber-600 text-white"
                            : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
                        }`}
                      >
                        Días
                      </button>
                      <button
                        type="button"
                        onClick={() => setContributionFreqType("months")}
                        className={`flex-1 rounded py-2 text-xs font-medium transition-colors ${
                          contributionFreqType === "months"
                            ? "bg-amber-600 text-white"
                            : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
                        }`}
                      >
                        Meses
                      </button>
                      <button
                        type="button"
                        onClick={() => setContributionFreqType("years")}
                        className={`flex-1 rounded py-2 text-xs font-medium transition-colors ${
                          contributionFreqType === "years"
                            ? "bg-amber-600 text-white"
                            : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
                        }`}
                      >
                        Años
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {result && (
            <div className="mt-8 rounded-xl border border-slate-600/50 bg-slate-900/60 p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
                Resultado
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Monto final (M)</span>
                  <span className="font-semibold text-amber-400">
                    {formatCurrency(result.M)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Interés ganado (I)</span>
                  <span className="font-semibold text-white">
                    {formatCurrency(result.interest)}
                  </span>
                </div>
                {hasContribution && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Total abonado</span>
                    <span className="font-medium text-amber-400">
                      {formatCurrency(totalContrib)}
                    </span>
                  </div>
                )}
                <p className="mt-3 border-t border-slate-700 pt-3 text-xs text-slate-500">
                  I = P · r · t — M = P + I
                  {hasContribution && " + abonos"}
                  {" "}
                  — r = {(result.r * 100).toFixed(4)}% por periodo, t = {result.n}{" "}
                  {effectivePeriodLabel}
                </p>
              </div>
            </div>
          )}
        </section>

        {tableData.length > 0 && (
          <section className="mt-8 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 shadow-xl backdrop-blur sm:p-8">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Evolución {evolutionTitle}
            </h2>
            <p className="mb-4 text-sm text-slate-400">
              Cada periodo se suma el mismo interés (calculado siempre sobre el capital inicial).
            </p>
            <div className="overflow-x-auto rounded-xl border border-slate-600/50">
              <table className="w-full min-w-[320px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-600 bg-slate-900/80">
                    <th className="px-4 py-3 font-medium text-slate-300">
                      {effectivePeriodSingular ||
                        (periodType === "years" ? "Año" : periodType === "months" ? "Mes" : "Día")}
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-300 text-right">
                      Interés del periodo
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-300 text-right">
                      Valor acumulado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row) => (
                    <tr
                      key={row.period}
                      className="border-b border-slate-700/50 hover:bg-slate-700/30"
                    >
                      <td className="px-4 py-2.5 text-slate-300">{row.label}</td>
                      <td className="px-4 py-2.5 text-right text-slate-400">
                        {row.period === 0 ? "—" : formatCurrency(row.interest)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium text-amber-400">
                        {formatCurrency(row.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {chartData.length > 0 && (
          <section className="mt-8 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 shadow-xl backdrop-blur sm:p-8">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Crecimiento lineal (interés simple)
            </h2>
            <div className="h-[320px] min-h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorValorSimple" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="periodo"
                    stroke="#94a3b8"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    tickLine={{ stroke: "#475569" }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    tickLine={{ stroke: "#475569" }}
                    tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #475569",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#e2e8f0" }}
                    formatter={(value: number | undefined) => [formatCurrency(value ?? 0), "Valor"]}
                    labelFormatter={(label) => label}
                  />
                  <Area
                    type="monotone"
                    dataKey="valor"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorValorSimple)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {comparison && (
          <section className="mt-8 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 shadow-xl backdrop-blur sm:p-8">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Comparación: Simple vs. Compuesto
            </h2>
            <p className="mb-4 text-sm text-slate-400">
              Mismo capital, tasa y tiempo. El compuesto crece en curva; el simple en línea recta.
            </p>
            <div className="overflow-x-auto rounded-xl border border-slate-600/50">
              <table className="w-full min-w-[280px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-600 bg-slate-900/80">
                    <th className="px-4 py-3 font-medium text-slate-300">Tipo</th>
                    <th className="px-4 py-3 font-medium text-slate-300 text-right">
                      Monto final
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-700/50">
                    <td className="px-4 py-2.5 text-amber-400">Interés simple</td>
                    <td className="px-4 py-2.5 text-right font-medium text-amber-400">
                      {formatCurrency(comparison.simple)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="px-4 py-2.5 text-emerald-400">Interés compuesto</td>
                    <td className="px-4 py-2.5 text-right font-medium text-emerald-400">
                      {formatCurrency(comparison.compound)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-slate-400">Diferencia (compuesto − simple)</td>
                    <td className="px-4 py-2.5 text-right font-medium text-white">
                      +{formatCurrency(comparison.diff)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        <div className="mt-8 rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 text-sm text-slate-400">
          <p className="font-medium text-slate-300">Resumen</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              <strong>Fórmula:</strong> I = P · r · t (interés) y M = P + I (monto total).
            </li>
            <li>
              <strong>Base de cálculo:</strong> siempre sobre el capital inicial; los intereses no
              se acumulan.
            </li>
            <li>
              <strong>Anual:</strong> tasa en años, tiempo en años.
            </li>
            <li>
              <strong>Meses:</strong> tasa anual ÷ 12, tiempo en meses.
            </li>
            <li>
              <strong>Diario:</strong> tasa anual ÷ 365, tiempo en días.
            </li>
            <li>
              Uso común: préstamos a corto plazo, empeños. El compuesto suele usarse en ahorros e
              inversiones.
            </li>
            <li>
              <strong>Abono periódico (opcional):</strong> puedes agregar un monto fijo cada X días,
              meses o años. En interés simple solo el capital inicial (P) genera interés; los abonos
              se suman al monto final sin generar interés.
            </li>
          </ul>
        </div>

        <footer className="mt-12 pb-8 text-center text-sm text-slate-500">
          Derechos © Tatis Vivas
        </footer>
      </main>
    </div>
  );
}
