import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { createProductFn } from "@/lib/workshop.functions";
import { useServerFn } from "@tanstack/react-start";
import { requireUnlocked } from "@/lib/gate.functions";

export const Route = createFileRoute("/products/new")({
  beforeLoad: async () => {
    await requireUnlocked();
  },
  component: NewProduct,
});

function NewProduct() {
  const router = useRouter();
  const create = useServerFn(createProductFn);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    await create({
      data: {
        name: String(form.get("name")),
        code: String(form.get("code")) || undefined,
        quantity: Number(form.get("quantity")),
        min_quantity: Number(form.get("min_quantity")),
        cost_price: Number(form.get("cost_price")),
        sale_price: Number(form.get("sale_price")),
      },
    });
    setSaving(false);
    await router.navigate({ to: "/products" });
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Novo produto</h1>
      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Código</label>
            <input
              name="code"
              type="text"
              placeholder="Opcional"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Nome *</label>
            <input
              name="name"
              type="text"
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Quantidade *</label>
            <input
              name="quantity"
              type="number"
              min="0"
              required
              defaultValue={0}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Estoque mínimo *</label>
            <input
              name="min_quantity"
              type="number"
              min="0"
              required
              defaultValue={1}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Preço de custo (R$)</label>
            <input
              name="cost_price"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={0}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Preço de venda (R$) *</label>
            <input
              name="sale_price"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={0}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
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
