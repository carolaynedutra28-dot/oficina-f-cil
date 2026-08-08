import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { listOrdersFn, listProductsFn, listCashFlowFn } from "@/lib/workshop.functions";
import { requireUnlocked } from "@/lib/gate.functions";

const dashboardQueryOptions = queryOptions({
  queryKey: ["dashboard"],
  queryFn: async () => {
    const [orders, products, cashFlow] = await Promise.all([
      listOrdersFn(),
      listProductsFn(),
      listCashFlowFn({}),
    ]);
    return { orders, products, cashFlow };
  },
});

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    await requireUnlocked();
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(dashboardQueryOptions),
  component: Dashboard,
});

function Dashboard() {
  const { data } = useSuspenseQuery(dashboardQueryOptions);
  const { orders, products, cashFlow } = data;

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthEntries = cashFlow.filter((entry) => entry.date.startsWith(currentMonth) && entry.type === "income");
  const monthExpenses = cashFlow.filter((entry) => entry.date.startsWith(currentMonth) && entry.type === "expense");
  const incomeTotal = monthEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);
  const expenseTotal = monthExpenses.reduce((sum, entry) => sum + Number(entry.amount), 0);
  const balance = incomeTotal - expenseTotal;

  const openOrders = orders.filter((order) => order.status !== "paid" && order.status !== "finished");
  const lowStock = products.filter((product) => product.quantity <= product.min_quantity);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <span className="text-sm text-muted-foreground">{new Date().toLocaleDateString("pt-BR")}</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Entradas do mês</p>
          <p className="mt-1 text-2xl font-semibold text-card-foreground">
            {incomeTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Saídas do mês</p>
          <p className="mt-1 text-2xl font-semibold text-card-foreground">
            {expenseTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Saldo do mês</p>
          <p className={`mt-1 text-2xl font-semibold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
            {balance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-card-foreground">Ordens em aberto</h2>
            <Link to="/orders" className="text-sm text-primary hover:underline">
              Ver todas
            </Link>
          </div>
          {openOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma ordem em aberto.</p>
          ) : (
            <ul className="divide-y">
              {openOrders.slice(0, 5).map((order) => (
                <li key={order.id} className="py-3">
                  <Link to="/orders/$id" params={{ id: order.id }} className="block hover:bg-accent/50 rounded-md -mx-2 px-2 py-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{order.number}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-card-foreground">Estoque baixo</h2>
            <Link to="/products" className="text-sm text-primary hover:underline">
              Ver estoque
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum produto com estoque baixo.</p>
          ) : (
            <ul className="divide-y">
              {lowStock.map((product) => (
                <li key={product.id} className="flex items-center justify-between py-3">
                  <span className="text-foreground">{product.name}</span>
                  <span className="text-sm font-medium text-red-600">
                    {product.quantity} unidades
                  </span>
                </li>
              ))}
            </ul>
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
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? "bg-gray-100"}`}>
      {labels[status] ?? status}
    </span>
  );
}
