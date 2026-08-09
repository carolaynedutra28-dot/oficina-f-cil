import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { listCashFlowFn } from "@/lib/workshop.functions";
import { requireUnlocked } from "@/lib/gate.functions";
import { useState } from "react";

export const Route = createFileRoute("/cash-flow")({
  beforeLoad: async () => {
    await requireUnlocked();
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(cashFlowQueryOptions({})),
  component: CashFlow,
});

function cashFlowQueryOptions(filters: { start?: string; end?: string; type?: "income" | "expense" }) {
  return queryOptions({
    queryKey: ["cash-flow", filters],
    queryFn: () => listCashFlowFn({ data: filters }),
  });
}

function CashFlow() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [type, setType] = useState<"income" | "expense" | "">("");

  const filters: { start?: string; end?: string; type?: "income" | "expense" } = {
    ...(start ? { start } : {}),
    ...(end ? { end } : {}),
    ...(type ? { type } : {}),
  };

  const { data: entries } = useQuery(cashFlowQueryOptions(filters));

  const income = entries?.filter((e) => e.type === "income").reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;
  const expense = entries?.filter((e) => e.type === "expense").reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;
  const balance = income - expense;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Fluxo de Caixa</h1>
        <Link
          to="/cash-flow/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Novo lançamento
        </Link>
      </div>

      <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-3">
        <div>
          <p className="text-sm text-muted-foreground">Entradas</p>
          <p className="text-lg font-semibold text-green-600">
            {income.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Saídas</p>
          <p className="text-lg font-semibold text-red-600">
            {expense.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Saldo</p>
          <p className={`text-lg font-semibold ${balance >= 0 ? "text-foreground" : "text-red-600"}`}>
            {balance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as "income" | "expense" | "")}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">Todos</option>
          <option value="income">Entrada</option>
          <option value="expense">Saída</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Categoria</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Descrição</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {entries?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum lançamento encontrado.
                </td>
              </tr>
            )}
            {entries?.map((entry) => (
              <tr key={entry.id}>
                <td className="px-4 py-3 text-foreground">
                  {new Date(entry.date).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      entry.type === "income" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {entry.type === "income" ? "Entrada" : "Saída"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{entry.category}</td>
                <td className="px-4 py-3 text-foreground">{entry.description}</td>
                <td className="px-4 py-3 text-right font-medium text-foreground">
                  {Number(entry.amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
