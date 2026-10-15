import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const target =
  process.env.AR_CRM_DATA_PATH || join(root, "data", "retail.json");
if (existsSync(target) && !process.argv.includes("--reset")) {
  console.log(
    "AR CRM data already exists. Use --reset to replace sample data.",
  );
  process.exit(0);
}
let seed = 815;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const pick = (items) => items[Math.floor(rand() * items.length)];
const base = new Date("2026-10-15T12:00:00Z");
const day = (offset) =>
  new Date(+base + offset * 86400000).toISOString().slice(0, 10);
const owners = ["Alex Morgan", "Sarah Chen", "James Wilson", "Olivia Parker"];
const names = [
  "Sophie Anderson",
  "James Mitchell",
  "Emma Thompson",
  "Noah Williams",
  "Olivia Davis",
  "Liam Wilson",
  "Isabella Garcia",
  "Ethan Taylor",
  "Mia Robinson",
  "Lucas Martin",
  "Amelia Clark",
  "Mason Lewis",
  "Charlotte Walker",
  "Logan Hall",
  "Harper Young",
  "Oliver King",
  "Evelyn Wright",
  "Elijah Scott",
  "Abigail Green",
  "Henry Adams",
  "Ella Baker",
  "Leo Nelson",
  "Scarlett Hill",
  "Jack Campbell",
  "Grace Carter",
  "Owen Roberts",
  "Chloe Phillips",
  "Daniel Evans",
  "Lily Turner",
  "Samuel Collins",
  "Zoey Stewart",
  "Ben Morris",
  "Aria Rogers",
  "Theo Reed",
  "Nora Cook",
  "William Bell",
  "Hannah Murphy",
  "Jacob Bailey",
  "Layla Rivera",
  "Max Cooper",
  "Violet Richardson",
  "Oscar Cox",
  "Stella Howard",
  "Finn Ward",
  "Lucy Brooks",
  "Adam Bennett",
  "Alice Gray",
  "Ryan James",
];
const customers = names.map((name, i) => ({
  id: `C${String(i + 1).padStart(4, "0")}`,
  name,
  email: name.toLowerCase().replace(" ", ".") + "@example.com",
  phone: `+1 (415) 555-${String(100 + i).padStart(4, "0")}`,
  city: pick([
    "San Francisco",
    "Austin",
    "New York",
    "Portland",
    "Chicago",
    "Seattle",
  ]),
  createdAt: day(-Math.floor(rand() * 100)),
  owner: pick(owners),
  consent: i % 7 !== 0,
  notes:
    i % 3 === 0
      ? [
          {
            text: "Prefers sustainable materials. Interested in early access to the autumn collection.",
            date: day(-3),
          },
        ]
      : [],
}));
const products = [
  {
    id: "P001",
    name: "Everyday Canvas Tote",
    sku: "AR-BG-001",
    category: "Accessories",
    price: 48,
    cost: 17,
    stock: 86,
    reorderAt: 15,
    image: "/products/tote.svg",
    color: "#e9e5dc",
  },
  {
    id: "P002",
    name: "Essential Cotton Tee",
    sku: "AR-AP-002",
    category: "Apparel",
    price: 38,
    cost: 12,
    stock: 124,
    reorderAt: 25,
    image: "/products/tee.svg",
    color: "#e7e9e4",
  },
  {
    id: "P003",
    name: "Studio Wireless Headphones",
    sku: "AR-TE-003",
    category: "Electronics",
    price: 189,
    cost: 82,
    stock: 8,
    reorderAt: 15,
    image: "/products/headphones.svg",
    color: "#e8e4e2",
  },
  {
    id: "P004",
    name: "Ceramic Pour-over Set",
    sku: "AR-HM-004",
    category: "Home & living",
    price: 74,
    cost: 29,
    stock: 42,
    reorderAt: 10,
    image: "/products/ceramic.svg",
    color: "#eee6df",
  },
  {
    id: "P005",
    name: "Classic Leather Sneaker",
    sku: "AR-FT-005",
    category: "Footwear",
    price: 125,
    cost: 48,
    stock: 6,
    reorderAt: 12,
    image: "/products/sneaker.svg",
    color: "#e5e7e8",
  },
  {
    id: "P006",
    name: "Daily Hydration Serum",
    sku: "AR-BE-006",
    category: "Beauty",
    price: 42,
    cost: 14,
    stock: 72,
    reorderAt: 20,
    image: "/products/serum.svg",
    color: "#e9e6df",
  },
  {
    id: "P007",
    name: "Weekend Crossbody Bag",
    sku: "AR-BG-007",
    category: "Accessories",
    price: 96,
    cost: 34,
    stock: 11,
    reorderAt: 15,
    image: "/products/bag.svg",
    color: "#e7ddd1",
  },
  {
    id: "P008",
    name: "Linen Blend Overshirt",
    sku: "AR-AP-008",
    category: "Apparel",
    price: 89,
    cost: 32,
    stock: 57,
    reorderAt: 15,
    image: "/products/shirt.svg",
    color: "#e6e6e0",
  },
];
const orders = Array.from({ length: 260 }, (_, i) => {
  const product = pick(products),
    quantity = pick([1, 1, 2, 2, 3, 4]);
  const offset =
    i < 140 ? -Math.floor(rand() * 15) : -15 - Math.floor(rand() * 45);
  const channel = pick(["Online", "Online", "In-store", "In-store", "Social"]);
  return {
    id: `ORD-${String(10240 + i)}`,
    customerId: customers[Math.floor(rand() * (i < 140 ? 40 : 48))].id,
    productId: product.id,
    quantity,
    total: product.price * quantity,
    cost: product.cost * quantity,
    date:
      day(offset) +
      `T${String(8 + Math.floor(rand() * 12)).padStart(2, "0")}:30:00Z`,
    status:
      offset < -5
        ? pick(["Delivered", "Delivered", "Delivered", "Cancelled"])
        : pick(["Delivered", "Processing", "Shipped"]),
    channel,
    store:
      channel === "In-store" ? pick(["Downtown", "Westfield"]) : "Online store",
  };
}).sort((a, b) => b.date.localeCompare(a.date));
const deals = [
  ["Autumn wardrobe refresh", "C0001", 2450, "Proposal"],
  ["Corporate welcome kits", "C0004", 6800, "Negotiation"],
  ["Holiday gifting collection", "C0008", 4200, "New lead"],
  ["Studio equipment bundle", "C0011", 1890, "Contacted"],
  ["VIP personal shopping", "C0003", 1250, "Proposal"],
  ["Westfield pop-up partnership", "C0017", 8500, "Contacted"],
  ["Team essentials order", "C0020", 3200, "Won"],
  ["Home collection package", "C0009", 960, "New lead"],
  ["Sustainable merch collection", "C0027", 5400, "Negotiation"],
  ["Winter capsule preorder", "C0014", 2100, "New lead"],
].map((d, i) => ({
  id: `D${i + 1}`,
  title: d[0],
  customerId: d[1],
  value: d[2],
  stage: d[3],
  owner: owners[i % 4],
  due: day(2 + i),
}));
const tasks = [
  ["Follow up on corporate welcome kits", "In progress", "High", "C0004"],
  ["Restock Studio Wireless Headphones", "To do", "High", ""],
  ["Prepare Sophie’s autumn recommendations", "In progress", "Medium", "C0001"],
  ["Review Westfield weekly performance", "To do", "Medium", ""],
  ["Resolve delivery question for Emma", "To do", "High", "C0003"],
  ["Photograph the winter capsule collection", "In progress", "Low", ""],
  ["Complete VIP welcome calls", "Done", "Medium", ""],
  ["Update Downtown store displays", "Done", "Low", ""],
  ["Check sneaker stock with supplier", "To do", "High", ""],
].map((t, i) => ({
  id: `T${i + 1}`,
  title: t[0],
  status: t[1],
  priority: t[2],
  customerId: t[3],
  owner: owners[i % 4],
  due: day(i - 2),
}));
const db = {
  version: 1,
  referenceDate: "2026-10-15",
  customers,
  products,
  orders,
  deals,
  tasks,
  campaigns: [
    {
      id: "CM1",
      name: "A little something for our VIPs",
      segment: "VIP",
      channel: "Email",
      status: "Draft",
      budget: 450,
      date: day(3),
    },
    {
      id: "CM2",
      name: "Your autumn edit is here",
      segment: "Returning",
      channel: "Email",
      status: "Scheduled",
      budget: 800,
      date: day(5),
    },
    {
      id: "CM3",
      name: "We saved your favorites",
      segment: "At risk",
      channel: "SMS",
      status: "Draft",
      budget: 300,
      date: day(7),
    },
  ],
  automations: [
    {
      id: "A1",
      name: "A warm welcome, every time",
      description:
        "When a customer is added, create a personal welcome task for their account owner.",
      trigger: "customer_created",
      enabled: true,
      runs: 0,
    },
    {
      id: "A2",
      name: "Turn purchases into relationships",
      description:
        "When an order is placed, create a post-purchase follow-up task due in 3 days.",
      trigger: "order_created",
      enabled: true,
      runs: 0,
    },
    {
      id: "A3",
      name: "Never miss a restock",
      description:
        "When stock reaches its reorder point, create a restock task. Existing open tasks are skipped.",
      trigger: "low_stock",
      enabled: true,
      runs: 0,
    },
    {
      id: "A4",
      name: "Make every win a great beginning",
      description:
        "When a deal moves to Won, create a customer onboarding task for the deal owner.",
      trigger: "deal_won",
      enabled: false,
      runs: 0,
    },
  ],
  tickets: [
    {
      id: "TK1",
      subject: "Delivery update for my recent order",
      customerId: "C0003",
      priority: "High",
      status: "Open",
      date: day(0),
    },
    {
      id: "TK2",
      subject: "Exchange for a different sneaker size",
      customerId: "C0007",
      priority: "Medium",
      status: "In progress",
      date: day(-1),
    },
    {
      id: "TK3",
      subject: "Question about loyalty points",
      customerId: "C0014",
      priority: "Low",
      status: "Resolved",
      date: day(-2),
    },
    {
      id: "TK4",
      subject: "Gift wrapping for a birthday order",
      customerId: "C0011",
      priority: "Medium",
      status: "Open",
      date: day(-1),
    },
  ],
  activity: [
    {
      id: "AC1",
      text: "Sarah added a note to Sophie Anderson’s profile",
      date: day(0) + "T10:45:00Z",
      type: "customer",
      customerId: "C0001",
    },
    {
      id: "AC2",
      text: "Team essentials order moved to Won",
      date: day(0) + "T09:30:00Z",
      type: "deal",
      customerId: "C0020",
    },
    {
      id: "AC3",
      text: "VIP welcome calls completed by Olivia",
      date: day(-1) + "T16:00:00Z",
      type: "task",
    },
  ],
  settings: {
    company: "AR Retail Co.",
    email: "hello@arretail.example",
    currency: "USD",
    monthlyGoal: 50000,
    lowStockAlerts: true,
    orderAlerts: true,
  },
};
mkdirSync(join(root, "data"), { recursive: true });
writeFileSync(target, JSON.stringify(db, null, 2));
console.log(
  `AR CRM ready: ${customers.length} customers, ${products.length} products, ${orders.length} orders.`,
);
