import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { listCashFlowFn } from "@/lib/workshop.functions";
import { requireUnlocked } from "@/lib/gate.functions";
import { useState, useMemo } from "react";

const cashFlowQueryOptions = queryOptions({
  queryKey: ["cash-flow-report"],
  queryFn: () => listCashFlowFn(),
});

export const Route = createFileRoute("/reports")({
  beforeLoad: async () => {
    await requireUnlocked();
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(cashFlowQueryOptions),
  component: Reports,
});

function Reports() {
  const { data: entries } = useSuspenseQuery(cashFlowQueryOptions);
  const [year, setYear] = useState(new Date().getFullYear().toString());

  const months = useMemo(() => {
    const result: Record<string, { income: number; expense: number }> = {};
    for (let i = 1; i <= 12; i++) {
      result[i.toString().padStart(2, "0")] = { income: 0, expense: 0 };
    }
    for (const entry of entries) {
      const parts = entry.date.split("-");
      const entryYear = parts[0];
      const month = parts[1];
      if (!month || entryYear !== year) continue;
      if (entry.type === "income") result[month].income += Number(entry.amount);
      else result[month].expense += Number(entry.amount);
    }
    return result;
  }, [entries, year]);

  const totalIncome = Object.values(months).reduce((sum, m) => sum + m.income, 0);
  const totalExpense = Object.values(months).reduce((sum, m) => sum + m.expense, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Relatório Contábil</h1>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</option>
          <option value={(new Date().getFullYear() - 1).toString()}>{new Date().getFullYear() - 1}</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total de entradas</p>
          <p className="mt-1 text-xl font-semibold text-green-600">
            {totalIncome.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total de saídas</p>
          <p className="mt-1 text-xl font-semibold text-red-600">
            {totalExpense.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Saldo</p>
          <p className={`mt-1 text-xl font-semibold ${totalIncome - totalExpense >= 0 ? "text-foreground" : "text-red-600"}`}>
            {(totalIncome - totalExpense).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Mês</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Entradas</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Saídas</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {Object.entries(months).map(([month, values]) => (
              <tr key={month}>
                <td className="px-4 py-3 font-medium text-foreground">
                  {month}/{year}
                </td>
                <td className="px-4 py-3 text-right text-green-600">
                  {values.income.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </td>
                <td className="px-4 py-3 text-right text-red-600">
                  {values.expense.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {(values.income - values.expense).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
