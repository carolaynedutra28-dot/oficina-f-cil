import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { listCustomersFn, listProductsFn, createOrderFn } from "@/lib/workshop.functions";
import { useServerFn } from "@tanstack/react-start";
import { requireUnlockedFn } from "@/lib/gate.functions";

const newOrderQueryOptions = queryOptions({
  queryKey: ["new-order"],
  queryFn: async () => {
    const [customers, products] = await Promise.all([listCustomersFn(), listProductsFn()]);
    return { customers, products };
  },
});

export const Route = createFileRoute("/orders/new")({
  beforeLoad: async () => {
    await requireUnlockedFn();
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(newOrderQueryOptions),
  component: NewOrder,
});

function NewOrder() {
  const router = useRouter();
  const { data } = useSuspenseQuery(newOrderQueryOptions);
  const { customers, products } = data;
  const create = useServerFn(createOrderFn);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<{ product_id?: string; description: string; quantity: number; unit_price: number }[]>([
    { description: "", quantity: 1, unit_price: 0 },
  ]);

  function addItem() {
    setItems([...items, { description: "", quantity: 1, unit_price: 0 }]);
  }

  function updateItem(index: number, field: string, value: unknown) {
    const next = [...items];
    (next[index] as Record<string, unknown>)[field] = value;
    setItems(next);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const payload: Parameters<typeof create>[0]["data"] = {
      customer_id: String(form.get("customer_id")),
      labor_value: Number(form.get("labor_value")),
      items: items.map((item) => {
        const base = {
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        };
        return item.product_id ? { ...base, product_id: item.product_id } : base;
      }),
    };
    const description = String(form.get("description") || "").trim();
    if (description) payload.description = description;
    await create({ data: payload });
    setSaving(false);
    await router.navigate({ to: "/orders" });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Nova ordem de serviço</h1>
      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Cliente *</label>
            <select name="customer_id" required className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              <option value="">Selecione</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Mão de obra (R$)</label>
            <input
              name="labor_value"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={0}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Descrição do serviço</label>
          <textarea
            name="description"
            rows={3}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-foreground">Itens</h3>
            <button
              type="button"
              onClick={addItem}
              className="rounded-md border px-3 py-1 text-sm text-foreground hover:bg-accent"
            >
              + Adicionar item
            </button>
          </div>
          {items.map((item, index) => (
            <div key={index} className="grid gap-3 rounded-md border bg-background p-3 sm:grid-cols-12">
              <div className="sm:col-span-4">
                <label className="text-xs text-muted-foreground">Produto</label>
                <select
                  value={item.product_id || ""}
                  onChange={(e) => {
                    const product = products.find((p) => p.id === e.target.value);
                    updateItem(index, "product_id", e.target.value || undefined);
                    if (product) {
                      updateItem(index, "description", product.name);
                      updateItem(index, "unit_price", Number(product.sale_price));
                    }
                  }}
                  className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                >
                  <option value="">Produto avulso</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.quantity} disp.)
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-4">
                <label className="text-xs text-muted-foreground">Descrição</label>
                <input
                  value={item.description}
                  onChange={(e) => updateItem(index, "description", e.target.value)}
                  className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground">Qtd</label>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                  className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground">Unit. R$</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.unit_price}
                  onChange={(e) => updateItem(index, "unit_price", Number(e.target.value))}
                  className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                />
              </div>
              {items.length > 1 && (
                <div className="flex items-end sm:col-span-12">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Remover item
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex flex-1 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar OS"}
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
