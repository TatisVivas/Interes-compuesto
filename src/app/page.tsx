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

export default function Home() {
  const [principal, setPrincipal] = useState<string>("1000000");
  const [ratePercent, setRatePercent] = useState<string>("10");
  const [periodType, setPeriodType] = useState<PeriodType>("years");
  const [periods, setPeriods] = useState<string>("3");

  const { result, tableData, chartData } = useMemo(() => {
    const P = parseNumberFromFormatted(principal) || parseFloat(principal) || 0;
    const rateAnnual = (parseFloat(ratePercent) || 0) / 100;
    const n = Math.floor(parseFloat(periods) || 0);

    if (P <= 0 || n <= 0) {
      return { result: null, tableData: [], chartData: [] };
    }

    let r: number;
    if (periodType === "years") {
      r = rateAnnual;
    } else if (periodType === "months") {
      r = rateAnnual / 12;
    } else {
      r = rateAnnual / 365;
    }

    const M = P * Math.pow(1 + r, n);
    const interest = M - P;
    const result = { M, interest, r, n };

    const periodLabel =
      periodType === "years" ? "Año" : periodType === "months" ? "Mes" : "Día";
    const tableData: { period: number; label: string; value: number }[] = [];
    const chartData: { periodo: string; valor: number; intereses: number }[] = [];

    for (let i = 0; i <= n; i++) {
      const value = P * Math.pow(1 + r, i);
      const periodInterest = value - P;
      tableData.push({
        period: i,
        label: `${periodLabel} ${i}`,
        value,
      });
      chartData.push({
        periodo: `${periodLabel} ${i}`,
        valor: Math.round(value),
        intereses: Math.round(periodInterest),
      });
    }

    return { result, tableData, chartData };
  }, [principal, ratePercent, periodType, periods]);

  const handlePrincipalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    setPrincipal(raw === "" ? "0" : raw);
  };

  const handlePrincipalBlur = () => {
    if (principal === "" || principal === "0") setPrincipal("0");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 font-sans">
      <main className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Calculadora de interés compuesto
          </h1>
          <p className="mt-2 text-slate-400">
            Se calcula el monto final con la fórmula: M = P(1 + r)^n
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
                onBlur={handlePrincipalBlur}
                placeholder="Ej: 10.000.000"
                className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
                className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
                      ? "bg-emerald-600 text-white"
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
                      ? "bg-emerald-600 text-white"
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
                      ? "bg-emerald-600 text-white"
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
                  ? "Número de años (n)"
                  : periodType === "months"
                    ? "Número de meses (n)"
                    : "Número de días (n)"}
              </label>
              <input
                id="periods"
                type="number"
                min="1"
                step={1}
                value={periods}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPeriods(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                placeholder={
                  periodType === "years" ? "Ej: 3" : periodType === "months" ? "Ej: 6" : "Ej: 30"
                }
              />
              {periodType === "months" && (
                <p className="mt-1 text-xs text-slate-500">
                  Tasa usada por periodo: {(parseFloat(ratePercent) || 0) / 12}% mensual
                </p>
              )}
              {periodType === "days" && (
                <p className="mt-1 text-xs text-slate-500">
                  Tasa usada por periodo: {((parseFloat(ratePercent) || 0) / 365).toFixed(4)}%
                  diaria
                </p>
              )}
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
                  <span className="font-semibold text-emerald-400">
                    {formatCurrency(result.M)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Intereses ganados</span>
                  <span className="font-semibold text-white">
                    {formatCurrency(result.interest)}
                  </span>
                </div>
                <p className="mt-3 border-t border-slate-700 pt-3 text-xs text-slate-500">
                  Fórmula: M = P(1 + r)^n — r ={" "}
                  {(result.r * 100).toFixed(4)}% por periodo, n = {result.n}{" "}
                  {periodType === "years" ? "años" : periodType === "months" ? "meses" : "días"}
                </p>
              </div>
            </div>
          )}
        </section>

        {tableData.length > 0 && (
          <section className="mt-8 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 shadow-xl backdrop-blur sm:p-8">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Evolución{" "}
              {periodType === "years"
                ? "año a año"
                : periodType === "months"
                  ? "mes a mes"
                  : "día a día"}
            </h2>
            <div className="overflow-x-auto rounded-xl border border-slate-600/50">
              <table className="w-full min-w-[280px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-600 bg-slate-900/80">
                    <th className="px-4 py-3 font-medium text-slate-300">
                      {periodType === "years" ? "Año" : periodType === "months" ? "Mes" : "Día"}
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
                      <td className="px-4 py-2.5 text-right font-medium text-emerald-400">
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
              Gráfica del crecimiento
            </h2>
            <div className="h-[320px] min-h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorValor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        <div className="mt-8 rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 text-sm text-slate-400">
          <p className="font-medium text-slate-300">Resumen</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              <strong>Anual:</strong> se usa la tasa tal cual y el número de años.
            </li>
            <li>
              <strong>Mensual:</strong> la tasa anual se divide entre 12 y los periodos son meses.
            </li>
            <li>
              <strong>Diario:</strong> la tasa anual se divide entre 365 y los periodos son días.
            </li>
            <li>
              A mayor frecuencia de capitalización (diario &gt; mensual &gt; anual), el capital crece
              más rápido con la misma tasa nominal.
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
