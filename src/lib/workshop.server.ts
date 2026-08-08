import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function getAdminClient() {
  return createClient<Database>(
    process.env['SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!,
    { auth: { persistSession: false } }
  );
}

export type WorkshopSettings = {
  id: string;
  name: string;
  document: string | null;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
};

export async function getSettings(): Promise<WorkshopSettings | null> {
  const supabase = getAdminClient();
  const { data } = await supabase.from("workshop_settings").select("*").single();
  return data as WorkshopSettings | null;
}

export async function ensureSettings(defaults: Partial<WorkshopSettings>) {
  const supabase = getAdminClient();
  const existing = await getSettings();
  if (existing) return existing;
  const { data, error } = await supabase
    .from("workshop_settings")
    .insert({ name: defaults.name ?? "Oficina", ...defaults })
    .select()
    .single();
  if (error) throw error;
  return data as WorkshopSettings;
}

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  document: string | null;
  address: string | null;
};

export async function listCustomers(): Promise<Customer[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from("customers").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as Customer[];
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from("customers").select("*").eq("id", id).single();
  if (error) return null;
  return data as Customer;
}

export async function createCustomer(input: Omit<Customer, "id">): Promise<Customer> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from("customers").insert(input).select().single();
  if (error) throw error;
  return data as Customer;
}

export type Vehicle = {
  id: string;
  customer_id: string;
  plate: string | null;
  model: string;
  year: number | null;
  color: string | null;
};

export async function listVehicles(customerId?: string): Promise<Vehicle[]> {
  const supabase = getAdminClient();
  let query = supabase.from("vehicles").select("*").order("model");
  if (customerId) query = query.eq("customer_id", customerId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Vehicle[];
}

export async function createVehicle(input: Omit<Vehicle, "id">): Promise<Vehicle> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from("vehicles").insert(input).select().single();
  if (error) throw error;
  return data as Vehicle;
}

export type Product = {
  id: string;
  name: string;
  code: string | null;
  quantity: number;
  min_quantity: number;
  cost_price: number;
  sale_price: number;
};

export async function listProducts(): Promise<Product[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from("products").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function getProduct(id: string): Promise<Product | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
  if (error) return null;
  return data as Product;
}

export async function createProduct(input: Omit<Product, "id">): Promise<Product> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from("products").insert(input).select().single();
  if (error) throw error;
  return data as Product;
}

export async function updateProductQuantity(id: string, delta: number) {
  const supabase = getAdminClient();
  const product = await getProduct(id);
  if (!product) throw new Error("Produto não encontrado");
  const { error } = await supabase.from("products").update({ quantity: product.quantity + delta }).eq("id", id);
  if (error) throw error;
}

export type OrderStatus = "pending" | "approved" | "in_progress" | "finished" | "paid";

export type Order = {
  id: string;
  number: string;
  customer_id: string;
  vehicle_id: string | null;
  status: OrderStatus;
  description: string | null;
  labor_value: number;
  total: number;
  created_at: string;
  finished_at: string | null;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
};

export async function listOrders(): Promise<Order[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Order[];
}

export async function getOrder(id: string): Promise<(Order & { items: OrderItem[] }) | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from("orders").select("*, items:order_items(*)").eq("id", id).single();
  if (error) return null;
  return data as Order & { items: OrderItem[] };
}

export async function createOrder(input: {
  customer_id: string;
  vehicle_id?: string;
  description?: string;
  labor_value: number;
  items: { product_id?: string; description: string; quantity: number; unit_price: number }[];
}): Promise<Order & { items: OrderItem[] }> {
  const supabase = getAdminClient();
  const number = `OS${Date.now()}`;
  const itemsTotal = input.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const total = itemsTotal + input.labor_value;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      number,
      customer_id: input.customer_id,
      vehicle_id: input.vehicle_id ?? null,
      description: input.description ?? null,
      labor_value: input.labor_value,
      total,
    })
    .select()
    .single();
  if (orderError) throw orderError;

  const orderItems = input.items.map((item) => ({
    order_id: order.id,
    product_id: item.product_id ?? null,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
  }));

  const { data: items, error: itemsError } = await supabase.from("order_items").insert(orderItems).select();
  if (itemsError) throw itemsError;

  for (const item of input.items) {
    if (item.product_id) {
      await updateProductQuantity(item.product_id, -item.quantity);
    }
  }

  return { ...(order as Order), items: (items ?? []) as OrderItem[] };
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const supabase = getAdminClient();
  const order = await getOrder(id);
  if (!order) throw new Error("Ordem não encontrada");

  const updates: Partial<Order> = { status };
  if (status === "finished" || status === "paid") {
    updates.finished_at = new Date().toISOString();
  }

  const { error } = await supabase.from("orders").update(updates).eq("id", id);
  if (error) throw error;

  if ((status === "finished" || status === "paid") && order.status !== "paid" && order.status !== "finished") {
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from("cash_flow").insert({
      type: "income" as const,
      category: "Serviços",
      description: `Pagamento OS ${order.number}`,
      amount: order.total,
      date: today,
      order_id: order.id,
    });
  }
}

export type CashFlow = {
  id: string;
  type: "income" | "expense";
  category: string;
  description: string;
  amount: number;
  date: string;
  order_id: string | null;
};

export async function listCashFlow(filters?: { start?: string; end?: string; type?: "income" | "expense" }): Promise<CashFlow[]> {
  const supabase = getAdminClient();
  let query = supabase.from("cash_flow").select("*").order("date", { ascending: false });
  if (filters?.start) query = query.gte("date", filters.start);
  if (filters?.end) query = query.lte("date", filters.end);
  if (filters?.type) query = query.eq("type", filters.type);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as CashFlow[];
}

export async function createCashFlow(input: Omit<CashFlow, "id" | "order_id"> & { order_id?: string }) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("cash_flow")
    .insert({ ...input, order_id: input.order_id ?? null })
    .select()
    .single();
  if (error) throw error;
  return data as CashFlow;
}
