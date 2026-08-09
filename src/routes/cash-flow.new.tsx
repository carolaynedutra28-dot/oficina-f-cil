import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { createCashFlowFn } from "@/lib/workshop.functions";
import { useServerFn } from "@tanstack/react-start";
import { requireUnlockedFn } from "@/lib/gate.functions";

export const Route = createFileRoute("/cash-flow/new")({
  beforeLoad: async () => {
    await requireUnlocked();
  },
  component: NewCashFlow,
});

function NewCashFlow() {
  const router = useRouter();
  const create = useServerFn(createCashFlowFn);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    await create({
      data: {
        type: form.get("type") as "income" | "expense",
        category: String(form.get("category")),
        description: String(form.get("description")),
        amount: Number(form.get("amount")),
        date: String(form.get("date")),
      },
    });
    setSaving(false);
    await router.navigate({ to: "/cash-flow" });
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Novo lançamento</h1>
      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tipo</label>
            <select name="type" required className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              <option value="income">Entrada</option>
              <option value="expense">Saída</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Data</label>
            <input
              name="date"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Categoria</label>
          <input
            name="category"
            type="text"
            required
            placeholder="Ex: Serviços, Peças, Aluguel"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Descrição</label>
          <input
            name="description"
            type="text"
            required
            placeholder="Ex: Pagamento OS 0001"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Valor (R$)</label>
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex flex-1 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
          <button
            type="button"
            onClick={() => router.history.back()}
            className="inline-flex flex-1 items-center justify-center rounded-md border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
