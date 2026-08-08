import { createServerFn } from "@tanstack/react-start";
import {
  getSettings,
  ensureSettings,
  listCustomers,
  getCustomer,
  createCustomer,
  listVehicles,
  createVehicle,
  listProducts,
  getProduct,
  createProduct,
  listOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  listCashFlow,
  createCashFlow,
  updateProductQuantity,
} from "./workshop.server";
import { requireUnlocked } from "./gate.functions";

export const getWorkshopSettingsFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireUnlocked();
  return getSettings();
});

export const ensureWorkshopSettingsFn = createServerFn({ method: "POST" })
  .inputValidator((data: { name: string; document?: string; phone?: string; address?: string }) => data)
  .handler(async ({ data }) => {
    await requireUnlocked();
    return ensureSettings(data);
  });

export const listCustomersFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireUnlocked();
  return listCustomers();
});

export const getCustomerFn = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await requireUnlocked();
    return getCustomer(data.id);
  });

export const createCustomerFn = createServerFn({ method: "POST" })
  .inputValidator((data: { name: string; phone?: string; document?: string; address?: string }) => data)
  .handler(async ({ data }) => {
    await requireUnlocked();
    return createCustomer({
      name: data.name,
      phone: data.phone ?? null,
      document: data.document ?? null,
      address: data.address ?? null,
    });
  });

export const listVehiclesFn = createServerFn({ method: "GET" })
  .inputValidator((data: { customerId?: string }) => data)
  .handler(async ({ data }) => {
    await requireUnlocked();
    return listVehicles(data.customerId);
  });

export const createVehicleFn = createServerFn({ method: "POST" })
  .inputValidator((data: { customer_id: string; plate?: string; model: string; year?: number; color?: string }) => data)
  .handler(async ({ data }) => {
    await requireUnlocked();
    return createVehicle({
      customer_id: data.customer_id,
      plate: data.plate ?? null,
      model: data.model,
      year: data.year ?? null,
      color: data.color ?? null,
    });
  });

export const listProductsFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireUnlocked();
  return listProducts();
});

export const getProductFn = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await requireUnlocked();
    return getProduct(data.id);
  });

export const createProductFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { name: string; code?: string; quantity: number; min_quantity: number; cost_price: number; sale_price: number }) => data
  )
  .handler(async ({ data }) => {
    await requireUnlocked();
    return createProduct({
      name: data.name,
      code: data.code ?? null,
      quantity: data.quantity,
      min_quantity: data.min_quantity,
      cost_price: data.cost_price,
      sale_price: data.sale_price,
    });
  });

export const listOrdersFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireUnlocked();
  return listOrders();
});

export const getOrderFn = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await requireUnlocked();
    return getOrder(data.id);
  });

export const createOrderFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      customer_id: string;
      vehicle_id?: string;
      description?: string;
      labor_value: number;
      items: { product_id?: string; description: string; quantity: number; unit_price: number }[];
    }) => data
  )
  .handler(async ({ data }) => {
    await requireUnlocked();
    return createOrder(data);
  });

export const updateOrderStatusFn = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; status: "pending" | "approved" | "in_progress" | "finished" | "paid" }) => data)
  .handler(async ({ data }) => {
    await requireUnlocked();
    return updateOrderStatus(data.id, data.status);
  });

export const listCashFlowFn = createServerFn({ method: "GET" })
  .inputValidator((data?: { start?: string; end?: string; type?: "income" | "expense" }) => data ?? {})
  .handler(async ({ data }) => {
    await requireUnlocked();
    return listCashFlow(data);
  });

export const createCashFlowFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { type: "income" | "expense"; category: string; description: string; amount: number; date: string; order_id?: string }) => data
  )
  .handler(async ({ data }) => {
    await requireUnlocked();
    return createCashFlow(data);
  });

export const updateProductQuantityFn = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; delta: number }) => data)
  .handler(async ({ data }) => {
    await requireUnlocked();
    return updateProductQuantity(data.id, data.delta);
  });
