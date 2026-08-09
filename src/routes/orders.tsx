import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { listOrdersFn } from "@/lib/workshop.functions";
import { requireUnlockedFn } from "@/lib/gate.functions";

const ordersQueryOptions = queryOptions({
  queryKey: ["orders"],
  queryFn: () => listOrdersFn(),
});

export const Route = createFileRoute("/orders")({
  beforeLoad: async () => {
    await requireUnlocked();
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(ordersQueryOptions),
  component: Orders,
});

function Orders() {
  const { data: orders } = useSuspenseQuery(ordersQueryOptions);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Ordens de Serviço</h1>
        <Link
          to="/orders/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Nova OS
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Número</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhuma ordem cadastrada.
                </td>
              </tr>
            )}
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-4 py-3 font-medium text-foreground">{order.number}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-3 text-right text-foreground">
                  {Number(order.total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </td>
                <td className="px-4 py-3 text-center">
                  <Link
                    to="/orders/$id"
                    params={{ id: order.id }}
                    className="text-sm text-primary hover:underline"
                  >
                    Abrir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    pending: "Pendente",
    approved: "Aprovado",
    in_progress: "Em execução",
    finished: "Finalizado",
    paid: "Pago",
  };
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-blue-100 text-blue-800",
    in_progress: "bg-purple-100 text-purple-800",
    finished: "bg-green-100 text-green-800",
    paid: "bg-gray-100 text-gray-800",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? "bg-gray-100"}`}>
      {labels[status] ?? status}
    </span>
  );
}
