import { createFileRoute, Link } from "@tanstack/react-router";
import { requireUnlockedFn } from "@/lib/gate.functions";
import { getOrderFn, getCustomerFn, getWorkshopSettingsFn } from "@/lib/workshop.functions";
import type { OrderItem } from "@/lib/workshop.functions";


export const Route = createFileRoute("/orders/$id/receipt")({
  beforeLoad: async () => {
    await requireUnlockedFn();
  },
  loader: async ({ params }) => {
    const order = await getOrderFn({ data: { id: params.id } });
    if (!order) {
      return { order: null as null, customer: null as null, settings: null as null };
    }
    const [customer, settings] = await Promise.all([
      getCustomerFn({ data: { id: order.customer_id } }),
      getWorkshopSettingsFn(),
    ]);
    return { order, customer, settings };
  },
  head: () => ({
    meta: [
      { title: "Recibo — Belmoch Garage" },
      { name: "description", content: "Recibo da ordem de serviço da Belmoch Garage." },
    ],
  }),
  component: ReceiptPage,
  notFoundComponent: () => <p className="p-8 text-center">Ordem não encontrada.</p>,
  errorComponent: ({ error }) => (
    <p className="p-8 text-center text-red-600">Erro ao carregar recibo: {error.message}</p>
  ),
});

function ReceiptPage() {
  const { order, customer, settings } = Route.useLoaderData();

  if (!order) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Ordem não encontrada.</p>
        <Link to="/orders" className="mt-4 inline-block text-primary hover:underline">
          Voltar para ordens
        </Link>
      </div>
    );
  }

  const itemsTotal = order.items.reduce((sum: number, item: OrderItem) => sum + item.quantity * Number(item.unit_price), 0);


  return (
    <div className="min-h-screen bg-white p-6 text-black">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <Link to="/orders/$id" params={{ id: order.id }} className="text-primary hover:underline">
            ← Voltar
          </Link>
          <button
            onClick={() => window.print()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Imprimir / Salvar PDF
          </button>
        </div>

        <div className="rounded-lg border border-gray-300 p-8">
          <div className="mb-6 border-b border-gray-300 pb-6">
            <h1 className="text-2xl font-bold">{settings?.name ?? "Belmoch Garage"}</h1>
            {settings?.document && <p className="text-sm text-gray-600">CNPJ/CPF: {settings.document}</p>}
            {settings?.phone && <p className="text-sm text-gray-600">Telefone: {settings.phone}</p>}
            {settings?.address && <p className="text-sm text-gray-600">Endereço: {settings.address}</p>}
          </div>

          <div className="mb-6 flex flex-wrap justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">{order.number}</h2>
              <p className="text-sm text-gray-600">
                Data: {new Date(order.created_at).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">
                Status: {statusLabel(order.status)}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="mb-2 font-semibold">Cliente</h3>
            <p className="text-sm">{customer?.name ?? "—"}</p>
            {customer?.phone && <p className="text-sm text-gray-600">Telefone: {customer.phone}</p>}
            {customer?.document && <p className="text-sm text-gray-600">Documento: {customer.document}</p>}
          </div>

          <div className="mb-6">
            <h3 className="mb-2 font-semibold">Serviço</h3>
            <p className="text-sm">{order.description || "Sem descrição"}</p>
            <p className="mt-1 text-sm text-gray-600">
              Mão de obra: {Number(order.labor_value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </div>

          <div className="mb-6">
            <h3 className="mb-2 font-semibold">Itens</h3>
            <table className="w-full text-sm">
              <thead className="border-b border-gray-300">
                <tr>
                  <th className="py-2 text-left font-medium">Descrição</th>
                  <th className="py-2 text-right font-medium">Qtd</th>
                  <th className="py-2 text-right font-medium">Unit.</th>
                  <th className="py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {order.items.map((item: OrderItem) => (
                  <tr key={item.id}>
                    <td className="py-2">{item.description}</td>
                    <td className="py-2 text-right">{item.quantity}</td>
                    <td className="py-2 text-right">
                      {Number(item.unit_price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </td>
                    <td className="py-2 text-right font-medium">
                      {(item.quantity * Number(item.unit_price)).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex justify-end border-t border-gray-300 pt-4">
              <p className="text-lg font-bold">
                Total: {Number(order.total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-300 pt-6 text-center text-sm text-gray-600">
            <p>Obrigado pela preferência!</p>
            <p>{settings?.name ?? "Belmoch Garage"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Pendente",
    approved: "Aprovado",
    in_progress: "Em execução",
    finished: "Finalizado",
    paid: "Pago",
  };
  return labels[status] ?? status;
}
