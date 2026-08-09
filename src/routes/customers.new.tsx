import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { createCustomerFn } from "@/lib/workshop.functions";
import { useServerFn } from "@tanstack/react-start";
import { requireUnlocked } from "@/lib/gate.functions";

export const Route = createFileRoute("/customers/new")({
  beforeLoad: async () => {
    await requireUnlocked();
  },
  component: NewCustomer,
});

function NewCustomer() {
  const router = useRouter();
  const create = useServerFn(createCustomerFn);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    await create({
      data: {
        name: String(form.get("name")),
        phone: String(form.get("phone") || "").trim() || undefined,
        document: String(form.get("document") || "").trim() || undefined,
        address: String(form.get("address") || "").trim() || undefined,
      },
    });
    setSaving(false);
    await router.navigate({ to: "/customers" });
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Novo cliente</h1>
      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border bg-card p-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Nome *</label>
          <input
            name="name"
            type="text"
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Telefone</label>
            <input
              name="phone"
              type="tel"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">CPF/CNPJ</label>
            <input
              name="document"
              type="text"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Endereço</label>
          <input
            name="address"
            type="text"
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
