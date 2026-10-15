"use server";
import { revalidatePath } from "next/cache";
import { readRetail, writeRetail } from "@/lib/retail-db";
import { owners, stages, taskStages } from "@/lib/retail-types";
import type { RetailDB } from "@/lib/retail-types";
type Input = Record<string, string | number | boolean>;
const text = (v: unknown, max = 200) =>
  String(v ?? "")
    .trim()
    .slice(0, max);
const id = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
const required = (v: unknown, label: string) => {
  const result = text(v);
  if (!result) throw new Error(`${label} is required.`);
  return result;
};
const amount = (v: unknown, label: string, min = 0) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n < min)
    throw new Error(`${label} must be at least ${min}.`);
  return Math.round(n * 100) / 100;
};
const integer = (v: unknown, label: string, min = 0) => {
  const n = amount(v, label, min);
  if (!Number.isInteger(n)) throw new Error(`${label} must be a whole number.`);
  return n;
};
const dueDate = (v: unknown) => {
  const result = required(v, "Date");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || Number.isNaN(Date.parse(result)))
    throw new Error("Choose a valid date.");
  return result;
};
function activity(
  db: RetailDB,
  message: string,
  type: string,
  customerId?: string,
) {
  db.activity.unshift({
    id: id("AC"),
    text: message,
    type,
    date: new Date().toISOString(),
    customerId,
  });
}
function automate(
  db: RetailDB,
  trigger: string,
  context: {
    customerId?: string;
    title: string;
    owner?: string;
    source?: string;
  },
) {
  db.automations
    .filter((a) => a.enabled && a.trigger === trigger)
    .forEach((a) => {
      const source =
        context.source || `${a.id}:${context.customerId || context.title}`;
      if (
        db.tasks.some(
          (t) =>
            t.status !== "Done" &&
            (t.source === source ||
              (trigger === "low_stock" && t.title === context.title)),
        )
      )
        return;
      const due = new Date(db.referenceDate + "T12:00:00Z");
      due.setUTCDate(due.getUTCDate() + 3);
      db.tasks.unshift({
        id: id("T"),
        title: context.title,
        status: "To do",
        priority: trigger === "low_stock" ? "High" : "Medium",
        owner: context.owner || owners[0],
        due: due.toISOString().slice(0, 10),
        customerId: context.customerId,
        source,
      });
      a.runs++;
      activity(
        db,
        `Automation created a task: ${context.title}`,
        "automation",
        context.customerId,
      );
    });
}
export async function retailAction(
  action: string,
  input: Input,
): Promise<{ ok: boolean; message: string; db?: RetailDB }> {
  try {
    const db = readRetail();
    let message = "Changes saved.";
    const findCustomer = () => {
      const c = db.customers.find((c) => c.id === input.customerId);
      if (!c) throw new Error("Choose a customer.");
      return c;
    };
    if (action === "customer.create" || action === "customer.update") {
      const name = required(input.name, "Full name"),
        email = required(input.email, "Email address").toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        throw new Error("Enter a valid email address.");
      if (
        db.customers.some(
          (c) =>
            c.email.toLowerCase() === email &&
            (action === "customer.create" || c.id !== input.id),
        )
      )
        throw new Error("A customer with this email already exists.");
      const existing =
        action === "customer.update"
          ? db.customers.find((c) => c.id === input.id)
          : undefined;
      if (action === "customer.update" && !existing)
        throw new Error("Customer not found.");
      const customer = {
        id: existing?.id || id("C"),
        name,
        email,
        phone: text(input.phone),
        city: text(input.city),
        createdAt: existing?.createdAt || db.referenceDate,
        owner: owners.includes(String(input.owner))
          ? String(input.owner)
          : owners[0],
        consent: input.consent === true,
        notes: existing?.notes || [],
      };
      if (existing) {
        Object.assign(existing, customer);
        activity(
          db,
          `${name}’s contact details were updated`,
          "customer",
          customer.id,
        );
        message = "Customer details updated.";
      } else {
        db.customers.unshift(customer);
        activity(
          db,
          `${name} joined your customer community`,
          "customer",
          customer.id,
        );
        automate(db, "customer_created", {
          customerId: customer.id,
          title: `Welcome ${name} to AR Retail`,
          owner: customer.owner,
        });
        message = "Customer added.";
      }
    } else if (action === "customer.note") {
      const c = findCustomer(),
        note = required(input.note, "Note");
      c.notes.unshift({ text: note, date: db.referenceDate });
      activity(db, `Added a note to ${c.name}’s profile`, "customer", c.id);
      message = "Note saved.";
    } else if (action === "order.create") {
      const customer = findCustomer(),
        product = db.products.find((p) => p.id === input.productId);
      if (!product) throw new Error("Choose a product.");
      const quantity = integer(input.quantity, "Quantity", 1);
      if (quantity > product.stock)
        throw new Error(`Only ${product.stock} units are available.`);
      if (
        !["Online store", "Downtown", "Westfield"].includes(String(input.store))
      )
        throw new Error("Choose a store.");
      const orderId = id("ORD");
      product.stock -= quantity;
      db.orders.unshift({
        id: orderId,
        customerId: customer.id,
        productId: product.id,
        quantity,
        total: product.price * quantity,
        cost: product.cost * quantity,
        date: `${db.referenceDate}T12:00:00Z`,
        status: "Processing",
        channel: input.store === "Online store" ? "Online" : "In-store",
        store: String(input.store),
      });
      activity(
        db,
        `${customer.name} placed an order for ${product.name}`,
        "order",
        customer.id,
      );
      automate(db, "order_created", {
        customerId: customer.id,
        title: `Follow up with ${customer.name} after purchase`,
        owner: customer.owner,
        source: `order:${orderId}`,
      });
      if (product.stock <= product.reorderAt)
        automate(db, "low_stock", {
          title: `Restock ${product.name}`,
          source: `stock:${product.id}`,
        });
      message = "Order created. Inventory updated.";
    } else if (action === "order.status") {
      const order = db.orders.find((o) => o.id === input.id);
      if (
        !order ||
        !["Processing", "Shipped", "Delivered", "Cancelled"].includes(
          String(input.status),
        )
      )
        throw new Error("Choose a valid order status.");
      const product = db.products.find((p) => p.id === order.productId);
      if (order.status === "Cancelled" && input.status !== "Cancelled")
        throw new Error(
          "Cancelled orders cannot be reopened. Create a new order.",
        );
      if (
        input.status === "Cancelled" &&
        order.status !== "Cancelled" &&
        product
      )
        product.stock += order.quantity;
      order.status = input.status as typeof order.status;
      activity(
        db,
        `${order.id} marked as ${order.status.toLowerCase()}`,
        "order",
        order.customerId,
      );
      message = "Order status updated.";
    } else if (action === "product.create" || action === "product.update") {
      const sku = required(input.sku, "SKU");
      if (
        db.products.some(
          (p) =>
            p.sku === sku && (action === "product.create" || p.id !== input.id),
        )
      )
        throw new Error("This SKU already exists.");
      const existing =
        action === "product.update"
          ? db.products.find((p) => p.id === input.id)
          : undefined;
      if (action === "product.update" && !existing)
        throw new Error("Product not found.");
      const product = {
        id: existing?.id || id("P"),
        name: required(input.name, "Product name"),
        sku,
        category: required(input.category, "Category"),
        price: amount(input.price, "Price", 0.01),
        cost: amount(input.cost, "Cost"),
        stock: integer(input.stock, "Stock"),
        reorderAt: integer(input.reorderAt, "Reorder point"),
        image: existing?.image || "",
        color: existing?.color || "#f0ebe5",
      };
      if (existing) Object.assign(existing, product);
      else db.products.unshift(product);
      activity(
        db,
        `${product.name} ${existing ? "updated in" : "added to"} the collection`,
        "inventory",
      );
      if (product.stock <= product.reorderAt)
        automate(db, "low_stock", {
          title: `Restock ${product.name}`,
          source: `stock:${product.id}`,
        });
      message = existing
        ? "Product updated. Existing order values are preserved."
        : "Product added.";
    } else if (action === "stock.update") {
      const p = db.products.find((p) => p.id === input.id);
      if (!p) throw new Error("Product not found.");
      const stock = integer(input.stock, "Stock");
      activity(
        db,
        `${p.name}: stock adjusted from ${p.stock} to ${stock}`,
        "inventory",
      );
      p.stock = stock;
      if (p.stock <= p.reorderAt)
        automate(db, "low_stock", {
          title: `Restock ${p.name}`,
          source: `stock:${p.id}`,
        });
      message = "Stock level updated.";
    } else if (action === "deal.create") {
      findCustomer();
      db.deals.unshift({
        id: id("D"),
        title: required(input.title, "Deal name"),
        customerId: String(input.customerId),
        value: amount(input.value, "Deal value", 1),
        stage: "New lead",
        owner: owners.includes(String(input.owner))
          ? String(input.owner)
          : owners[0],
        due: dueDate(input.due),
      });
      message = "Deal added to the pipeline.";
    } else if (action === "deal.stage") {
      const d = db.deals.find((d) => d.id === input.id);
      if (!d || !stages.includes(String(input.stage)))
        throw new Error("Invalid deal or stage.");
      const previous = d.stage;
      d.stage = String(input.stage);
      activity(db, `${d.title} moved to ${d.stage}`, "deal", d.customerId);
      if (d.stage === "Won" && previous !== "Won")
        automate(db, "deal_won", {
          customerId: d.customerId,
          title: `Onboard customer for ${d.title}`,
          owner: d.owner,
          source: `won:${d.id}`,
        });
      message = "Pipeline updated.";
    } else if (action === "task.create") {
      db.tasks.unshift({
        id: id("T"),
        title: required(input.title, "Task title"),
        status: "To do",
        priority: ["High", "Medium", "Low"].includes(String(input.priority))
          ? String(input.priority)
          : "Medium",
        owner: owners.includes(String(input.owner))
          ? String(input.owner)
          : owners[0],
        due: dueDate(input.due),
        customerId: text(input.customerId) || undefined,
      });
      message = "Task created.";
    } else if (action === "task.status") {
      const t = db.tasks.find((t) => t.id === input.id);
      if (!t || !taskStages.includes(String(input.status)))
        throw new Error("Invalid task status.");
      t.status = String(input.status);
      activity(
        db,
        `${t.title} moved to ${t.status.toLowerCase()}`,
        "task",
        t.customerId,
      );
      message = "Task updated.";
    } else if (action === "campaign.create") {
      if (
        !["VIP", "Returning", "New", "At risk", "All customers"].includes(
          String(input.segment),
        )
      )
        throw new Error("Choose a customer segment.");
      db.campaigns.unshift({
        id: id("CM"),
        name: required(input.name, "Campaign name"),
        segment: String(input.segment),
        channel: input.channel === "SMS" ? "SMS" : "Email",
        status: "Draft",
        budget: amount(input.budget, "Budget"),
        date: dueDate(input.date),
      });
      message = "Campaign draft created.";
    } else if (action === "campaign.status") {
      const c = db.campaigns.find((c) => c.id === input.id);
      if (
        !c ||
        !["Draft", "Scheduled", "Paused"].includes(String(input.status))
      )
        throw new Error("Invalid campaign status.");
      c.status = String(input.status);
      message = "Campaign plan updated.";
    } else if (action === "automation.toggle") {
      const a = db.automations.find((a) => a.id === input.id);
      if (!a) throw new Error("Rule not found.");
      a.enabled = input.enabled === true;
      message = a.enabled ? "Automation enabled." : "Automation paused.";
    } else if (action === "automation.run") {
      const before = db.tasks.length;
      db.products
        .filter((p) => p.stock <= p.reorderAt)
        .forEach((p) =>
          automate(db, "low_stock", {
            title: `Restock ${p.name}`,
            source: `stock:${p.id}`,
          }),
        );
      message = `${db.tasks.length - before} restock tasks created. Open duplicates skipped.`;
    } else if (action === "ticket.create") {
      findCustomer();
      db.tickets.unshift({
        id: id("TK"),
        subject: required(input.subject, "Subject"),
        customerId: String(input.customerId),
        priority: ["High", "Medium", "Low"].includes(String(input.priority))
          ? String(input.priority)
          : "Medium",
        status: "Open",
        date: db.referenceDate,
      });
      message = "Support ticket created.";
    } else if (action === "ticket.status") {
      const t = db.tickets.find((t) => t.id === input.id);
      if (
        !t ||
        !["Open", "In progress", "Resolved"].includes(String(input.status))
      )
        throw new Error("Invalid ticket status.");
      t.status = String(input.status);
      message = "Ticket updated.";
    } else if (action === "settings.save") {
      const email = required(input.email, "Email");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        throw new Error("Enter a valid email address.");
      db.settings = {
        ...db.settings,
        company: required(input.company, "Company name"),
        email,
        monthlyGoal: amount(input.monthlyGoal, "Monthly goal", 1),
        lowStockAlerts: input.lowStockAlerts === true,
        orderAlerts: input.orderAlerts === true,
      };
      message = "Workspace settings saved.";
    } else {
      throw new Error("Unknown action.");
    }
    writeRetail(db);
    revalidatePath("/", "layout");
    return { ok: true, message, db };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Changes could not be saved. Try again.",
    };
  }
}
