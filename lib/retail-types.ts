export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  createdAt: string;
  owner: string;
  consent: boolean;
  notes: { text: string; date: string }[];
};
export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  reorderAt: number;
  image: string;
  color: string;
};
export type OrderStatus = "Delivered" | "Processing" | "Shipped" | "Cancelled";
export type Order = {
  id: string;
  customerId: string;
  productId: string;
  quantity: number;
  total: number;
  cost: number;
  date: string;
  status: OrderStatus;
  channel: string;
  store: string;
};
export type Deal = {
  id: string;
  title: string;
  customerId: string;
  value: number;
  stage: string;
  owner: string;
  due: string;
};
export type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  owner: string;
  due: string;
  customerId?: string;
  source?: string;
};
export type Campaign = {
  id: string;
  name: string;
  segment: string;
  channel: string;
  status: string;
  budget: number;
  date: string;
};
export type Automation = {
  id: string;
  name: string;
  description: string;
  trigger: "customer_created" | "order_created" | "low_stock" | "deal_won";
  enabled: boolean;
  runs: number;
};
export type Ticket = {
  id: string;
  subject: string;
  customerId: string;
  priority: string;
  status: string;
  date: string;
};
export type Activity = {
  id: string;
  text: string;
  date: string;
  type: string;
  customerId?: string;
};
export type RetailDB = {
  version: number;
  referenceDate: string;
  customers: Customer[];
  products: Product[];
  orders: Order[];
  deals: Deal[];
  tasks: Task[];
  campaigns: Campaign[];
  automations: Automation[];
  tickets: Ticket[];
  activity: Activity[];
  settings: {
    company: string;
    email: string;
    currency: string;
    monthlyGoal: number;
    lowStockAlerts: boolean;
    orderAlerts: boolean;
  };
};
export const money = (value: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value);
export const number = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);
export const dateLabel = (value: string) =>
  new Date(value.slice(0, 10) + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
export const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
export const stages = [
  "New lead",
  "Contacted",
  "Proposal",
  "Negotiation",
  "Won",
];
export const taskStages = ["To do", "In progress", "Done"];
export const owners = [
  "Alex Morgan",
  "Sarah Chen",
  "James Wilson",
  "Olivia Parker",
];
export const stores = ["Online store", "Downtown", "Westfield"];
export function customerMetrics(db: RetailDB, id: string) {
  const orders = db.orders.filter(
    (o) => o.customerId === id && o.status !== "Cancelled",
  );
  const spent = orders.reduce((s, o) => s + o.total, 0);
  const lastOrder = orders
    .map((o) => o.date)
    .sort()
    .at(-1);
  const recency = lastOrder
    ? Math.floor(
        (Date.parse(db.referenceDate) - Date.parse(lastOrder.slice(0, 10))) /
          86400000,
      )
    : 999;
  const segment =
    spent >= 1800
      ? "VIP"
      : recency > 30 && orders.length
        ? "At risk"
        : orders.length > 1
          ? "Returning"
          : "New";
  return {
    orders,
    spent,
    lastOrder,
    recency,
    segment,
    points: Math.floor(spent),
    score: Math.min(
      100,
      Math.round(orders.length * 7 + spent / 80 + Math.max(0, 30 - recency)),
    ),
  };
}
export function periodOrders(
  db: RetailDB,
  period: string,
  store = "All stores",
) {
  const end = Date.parse(db.referenceDate + "T23:59:59.999Z");
  const days =
    period === "Last 7 days"
      ? 7
      : period === "Last 30 days"
        ? 30
        : Number(db.referenceDate.slice(8));
  const start = end - days * 86400000;
  const valid = db.orders.filter(
    (o) =>
      o.status !== "Cancelled" && (store === "All stores" || o.store === store),
  );
  return {
    current: valid.filter(
      (o) => Date.parse(o.date) > start && Date.parse(o.date) <= end,
    ),
    previous: valid.filter(
      (o) =>
        Date.parse(o.date) > start - days * 86400000 &&
        Date.parse(o.date) <= start,
    ),
    days,
    start,
    end,
  };
}
