import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { getOrderFn, updateOrderStatusFn, getCustomerFn } from "@/lib/workshop.functions";
import { useServerFn } from "@tanstack/react-start";
import { requireUnlockedFn } from "@/lib/gate.functions";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/orders/$id")({
  beforeLoad: async () => {
    await requireUnlockedFn();
  },
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(orderQueryOptions(params.id)),
  component: OrderDetail,
});

function orderQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["order", id],
    queryFn: async () => {
      const order = await getOrderFn({ data: { id } });
      const customer = order ? await getCustomerFn({ data: { id: order.customer_id } }) : null;
      return { order, customer };
    },
  });
}

function OrderDetail() {
  const { id } = Route.useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(orderQueryOptions(id));
  const { order, customer } = data;
  const updateStatus = useServerFn(updateOrderStatusFn);

  if (!order) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Ordem não encontrada.</p>
        <Link to="/orders" className="mt-4 inline-block text-primary hover:underline">
          Voltar para ordens
        </Link>
      </div>
    );
  }

  const orderData = order;

  async function setStatus(status: "pending" | "approved" | "in_progress" | "finished" | "paid") {
    await updateStatus({ data: { id: orderData.id, status } });
    await queryClient.invalidateQueries({ queryKey: ["order", id] });
    await queryClient.invalidateQueries({ queryKey: ["orders"] });
    await queryClient.invalidateQueries({ queryKey: ["cash-flow"] });
    await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }

  const itemsTotal = order.items.reduce((sum, item) => sum + item.quantity * Number(item.unit_price), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{order.number}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(order.created_at).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          <Link
            to="/orders/$id/receipt"
            params={{ id: order.id }}
            target="_blank"
            className="inline-flex items-center justify-center rounded-md border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Imprimir
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border bg-card p-6">
          <h2 className="font-semibold text-card-foreground">Cliente</h2>
          <p className="text-foreground">{customer?.name ?? "—"}</p>
          {customer?.phone && <p className="text-sm text-muted-foreground">{customer.phone}</p>}
        </div>

        <div className="space-y-4 rounded-xl border bg-card p-6">
          <h2 className="font-semibold text-card-foreground">Serviço</h2>
          <p className="text-foreground">{order.description || "Sem descrição"}</p>
          <p className="text-sm text-muted-foreground">
            Mão de obra:{" "}
            {Number(order.labor_value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 font-semibold text-card-foreground">Itens</h2>
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Descrição</th>
              <th className="px-4 py-2 text-right font-medium text-muted-foreground">Qtd</th>
              <th className="px-4 py-2 text-right font-medium text-muted-foreground">Unit.</th>
              <th className="px-4 py-2 text-right font-medium text-muted-foreground">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 text-foreground">{item.description}</td>
                <td className="px-4 py-3 text-right">{item.quantity}</td>
                <td className="px-4 py-3 text-right">
                  {Number(item.unit_price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {(item.quantity * Number(item.unit_price)).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex justify-end border-t pt-4">
          <p className="text-lg font-semibold text-foreground">
            Total:{" "}
            {Number(order.total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 font-semibold text-card-foreground">Alterar status</h2>
        <div className="flex flex-wrap gap-2">
          {order.status !== "approved" && (
            <button
              onClick={() => setStatus("approved")}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Aprovar
            </button>
          )}
          {order.status !== "in_progress" && (
            <button
              onClick={() => setStatus("in_progress")}
              className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
            >
              Iniciar execução
            </button>
          )}
          {order.status !== "finished" && order.status !== "paid" && (
            <button
              onClick={() => setStatus("finished")}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Finalizar
            </button>
          )}
          {order.status !== "paid" && (
            <button
              onClick={() => setStatus("paid")}
              className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
            >
              Marcar pago
            </button>
          )}
        </div>
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
    <span className={`rounded-full px-3 py-1 text-sm font-medium ${styles[status] ?? "bg-gray-100"}`}>
      {labels[status] ?? status}
    </span>
  );
}
