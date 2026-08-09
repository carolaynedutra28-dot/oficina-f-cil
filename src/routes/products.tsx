import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { listProductsFn, updateProductQuantityFn } from "@/lib/workshop.functions";
import { requireUnlockedFn } from "@/lib/gate.functions";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";

const productsQueryOptions = queryOptions({
  queryKey: ["products"],
  queryFn: () => listProductsFn(),
});

export const Route = createFileRoute("/products")({
  beforeLoad: async () => {
    await requireUnlockedFn();
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQueryOptions),
  component: Products,
});

function Products() {
  const { data: products } = useSuspenseQuery(productsQueryOptions);
  const updateQuantity = useServerFn(updateProductQuantityFn);
  const queryClient = useQueryClient();

  async function adjust(id: string, delta: number) {
    await updateQuantity({ data: { id, delta } });
    await queryClient.invalidateQueries({ queryKey: ["products"] });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Estoque</h1>
        <Link
          to="/products/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Novo produto
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Código</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Qtd</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Mínimo</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Preço venda</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Ajustar</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum produto cadastrado.
                </td>
              </tr>
            )}
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-3 text-muted-foreground">{product.code || "—"}</td>
                <td className="px-4 py-3 font-medium text-foreground">{product.name}</td>
                <td className="px-4 py-3 text-right">
                  <span className={product.quantity <= product.min_quantity ? "font-semibold text-red-600" : ""}>
                    {product.quantity}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">{product.min_quantity}</td>
                <td className="px-4 py-3 text-right text-foreground">
                  {Number(product.sale_price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => adjust(product.id, -1)}
                      className="rounded-md border px-2 py-1 text-xs hover:bg-accent"
                    >
                      −
                    </button>
                    <button
                      onClick={() => adjust(product.id, 1)}
                      className="rounded-md border px-2 py-1 text-xs hover:bg-accent"
                    >
                      +
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Outlet />
    </div>
  );
}
