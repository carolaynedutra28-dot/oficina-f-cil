import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { listCustomersFn } from "@/lib/workshop.functions";
import { requireUnlockedFn } from "@/lib/gate.functions";

const customersQueryOptions = queryOptions({
  queryKey: ["customers"],
  queryFn: () => listCustomersFn(),
});

export const Route = createFileRoute("/customers")({
  beforeLoad: async () => {
    await requireUnlockedFn();
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(customersQueryOptions),
  component: Customers,
});

function Customers() {
  const { data: customers } = useSuspenseQuery(customersQueryOptions);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Clientes</h1>
        <Link
          to="/customers/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Novo cliente
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Telefone</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Documento</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Endereço</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {customers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum cliente cadastrado.
                </td>
              </tr>
            )}
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td className="px-4 py-3 font-medium text-foreground">{customer.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{customer.phone || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{customer.document || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{customer.address || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
