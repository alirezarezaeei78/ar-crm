"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type FormEvent,
} from "react";
import { retailAction } from "@/app/retail-actions";
import {
  customerMetrics,
  dateLabel,
  initials,
  money,
  owners,
  stores,
} from "@/lib/retail-types";
import type { Customer, Product, RetailDB } from "@/lib/retail-types";
import { RIcon } from "./retail-icons";

type ModalState = { kind: string; id?: string } | null;
type Context = {
  db: RetailDB;
  currency: string;
  period: string;
  setPeriod: (p: string) => void;
  store: string;
  setStore: (s: string) => void;
  open: (kind: string, id?: string) => void;
  close: () => void;
  run: (
    action: string,
    input: Record<string, string | number | boolean>,
  ) => Promise<boolean>;
  busy: boolean;
};
const RetailContext = createContext<Context | null>(null);
export const useRetail = () => {
  const value = useContext(RetailContext);
  if (!value) throw new Error("Retail workspace provider is missing.");
  return value;
};
export const modules: Record<
  string,
  {
    title: string;
    subtitle: string;
    icon: string;
    action?: string;
    form?: string;
  }
> = {
  overview: {
    title: "Overview",
    subtitle:
      "A little clarity. A lot of possibility. Here’s your business at a glance.",
    icon: "overview",
    action: "Create order",
    form: "order",
  },
  customers: {
    title: "Customers",
    subtitle:
      "Know the people behind every purchase. Build relationships that last.",
    icon: "customers",
    action: "Add customer",
    form: "customer",
  },
  orders: {
    title: "Orders",
    subtitle: "Every purchase, from the first click to the doorstep.",
    icon: "orders",
    action: "Create order",
    form: "order",
  },
  products: {
    title: "Products",
    subtitle:
      "A thoughtfully managed collection. Ready for your next bestseller.",
    icon: "products",
    action: "Add product",
    form: "product",
  },
  inventory: {
    title: "Inventory",
    subtitle:
      "The right products. The right quantities. Fewer missed opportunities.",
    icon: "inventory",
    action: "Add product",
    form: "product",
  },
  pipeline: {
    title: "Sales pipeline",
    subtitle:
      "Turn promising conversations into your next great customer relationship.",
    icon: "pipeline",
    action: "Add deal",
    form: "deal",
  },
  campaigns: {
    title: "Campaigns",
    subtitle: "A more personal approach to your next customer conversation.",
    icon: "campaigns",
    action: "Plan campaign",
    form: "campaign",
  },
  segments: {
    title: "Customer segments",
    subtitle:
      "Find your best customers, welcome new ones, and bring familiar faces back.",
    icon: "segments",
  },
  tasks: {
    title: "Team tasks",
    subtitle:
      "Small next steps. Meaningful progress. Keep your team moving together.",
    icon: "tasks",
    action: "Create task",
    form: "task",
  },
  automations: {
    title: "Automations",
    subtitle:
      "Give the busywork a system. Give your customers more of your time.",
    icon: "automation",
  },
  reports: {
    title: "Reports & insights",
    subtitle:
      "Understand what’s working, spot what’s next, and make your next move.",
    icon: "reports",
  },
  support: {
    title: "Customer support",
    subtitle:
      "Make every conversation feel like a person, not a ticket number.",
    icon: "support",
    action: "Create ticket",
    form: "ticket",
  },
  team: {
    title: "Your team",
    subtitle: "The people who bring your customer experience to life.",
    icon: "customers",
  },
  settings: {
    title: "Settings",
    subtitle: "A workspace that works the way your business does.",
    icon: "settings",
  },
};

export function PersonAvatar({
  name,
  size = "",
  index = 0,
}: {
  name: string;
  size?: string;
  index?: number;
}) {
  return (
    <span className={`person-avatar ${size} avatar-color-${index % 5}`}>
      {initials(name)}
    </span>
  );
}
export function Status({ value }: { value: string }) {
  const color = [
    "Delivered",
    "Won",
    "Done",
    "VIP",
    "Resolved",
    "Active",
  ].includes(value)
    ? "green"
    : ["Processing", "Proposal", "Medium", "Scheduled", "Returning"].includes(
          value,
        )
      ? "amber"
      : ["High", "At risk", "Cancelled", "Low stock", "Out of stock"].includes(
            value,
          )
        ? "red"
        : ["Shipped", "In progress", "Contacted", "New"].includes(value)
          ? "blue"
          : "neutral";
  return (
    <span className={`status status-${color}`}>
      <i />
      {value}
    </span>
  );
}
export function ProductImage({
  product,
  large = false,
}: {
  product: Product;
  large?: boolean;
}) {
  return (
    <span
      className={`product-image ${large ? "large" : ""}`}
      style={{ background: product.color }}
    >
      {product.image ? (
        <img src={product.image} alt={product.name} loading="lazy" />
      ) : (
        <RIcon name="products" size={large ? 40 : 22} />
      )}
    </span>
  );
}

export function RetailShell({
  initialDB,
  children,
}: {
  initialDB: RetailDB;
  children: ReactNode;
}) {
  const [db, setDB] = useState(initialDB),
    [period, setPeriod] = useState("This month"),
    [store, setStore] = useState("All stores");
  const [modal, setModal] = useState<ModalState>(null),
    [busy, setBusy] = useState(false),
    [toast, setToast] = useState<{ text: string; error: boolean } | null>(null);
  const [mobile, setMobile] = useState(false),
    [notifications, setNotifications] = useState(false),
    [search, setSearch] = useState("");
  const pathname = usePathname(),
    router = useRouter(),
    locked = useRef(false);
  const section = pathname === "/" ? "overview" : pathname.split("/")[1];
  const open = useCallback(
    (kind: string, id?: string) => setModal({ kind, id }),
    [],
  );
  const close = useCallback(() => {
    if (!locked.current) setModal(null);
  }, []);
  useEffect(() => {
    setMobile(false);
    setNotifications(false);
  }, [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearch("");
        open("search");
      }
      if (e.key === "Escape") {
        close();
        setMobile(false);
        setNotifications(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.error ? 7000 : 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  const run: Context["run"] = async (action, input) => {
    if (locked.current) return false;
    locked.current = true;
    setBusy(true);
    try {
      const result = await retailAction(action, input);
      if (result.ok && result.db) setDB(result.db);
      setToast({ text: result.message, error: !result.ok });
      return result.ok;
    } catch {
      setToast({
        text: "The change could not be saved. Please try again.",
        error: true,
      });
      return false;
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  const lowStock = db.products.filter((p) => p.stock <= p.reorderAt),
    openTickets = db.tickets.filter((t) => t.status !== "Resolved");
  const alerts =
    (db.settings.lowStockAlerts ? lowStock.length : 0) +
    (db.settings.orderAlerts
      ? db.orders.filter((o) => o.status === "Processing").length
      : 0) +
    openTickets.length;
  const navGroups = [
    {
      label: "WORKSPACE",
      items: ["overview", "customers", "orders", "pipeline"],
    },
    {
      label: "RETAIL OPERATIONS",
      items: ["products", "inventory", "campaigns", "segments"],
    },
    {
      label: "WORK TOGETHER",
      items: ["tasks", "automations", "reports", "support"],
    },
  ];
  return (
    <RetailContext.Provider
      value={{
        db,
        currency: db.settings.currency,
        period,
        setPeriod,
        store,
        setStore,
        open,
        close,
        run,
        busy,
      }}
    >
      <div className="retail-app">
        {mobile && (
          <button
            className="sidebar-backdrop"
            aria-label="Close navigation"
            onClick={() => setMobile(false)}
          />
        )}
        <aside className={`retail-sidebar ${mobile ? "is-open" : ""}`}>
          <Link href="/" className="retail-brand" aria-label="AR CRM home">
            <span className="brand-symbol">
              <i />
              <i />
              <i />
            </span>
            <span>
              AR <b>CRM</b>
              <small>RETAIL, CONNECTED.</small>
            </span>
          </Link>
          <button
            className="workspace-switch"
            onClick={() => router.push("/settings")}
          >
            <span className="workspace-icon">
              <RIcon name="store" size={18} />
            </span>
            <span>
              <strong>{db.settings.company}</strong>
              <small>Retail workspace</small>
            </span>
            <RIcon name="down" size={15} />
          </button>
          <nav aria-label="Main navigation">
            {navGroups.map((g) => (
              <div className="nav-group" key={g.label}>
                <p>{g.label}</p>
                {g.items.map((key) => (
                  <Link
                    key={key}
                    href={key === "overview" ? "/" : `/${key}`}
                    className={`retail-nav-item ${section === key ? "is-active" : ""}`}
                    aria-current={section === key ? "page" : undefined}
                  >
                    <RIcon name={modules[key].icon} />
                    <span>
                      {key === "reports"
                        ? "Reports & insights"
                        : modules[key].title}
                    </span>
                    {key === "orders" && (
                      <small>
                        {
                          db.orders.filter((o) => o.status === "Processing")
                            .length
                        }
                      </small>
                    )}
                    {key === "automations" && (
                      <span className="nav-new">NEW</span>
                    )}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <Link
              href="/team"
              className={`retail-nav-item ${section === "team" ? "is-active" : ""}`}
            >
              <RIcon name="customers" />
              <span>Team members</span>
              <small>{owners.length}</small>
            </Link>
            <Link
              href="/settings"
              className={`retail-nav-item ${section === "settings" ? "is-active" : ""}`}
            >
              <RIcon name="settings" />
              <span>Settings</span>
            </Link>
            <div className="workspace-health">
              <span className="health-dot" />
              <span>
                Sample workspace
                <small>Data through {dateLabel(db.referenceDate)}</small>
              </span>
              <RIcon name="shield" size={16} />
            </div>
            <button
              className="sidebar-profile"
              onClick={() => router.push("/settings")}
            >
              <PersonAvatar name="Alex Morgan" />
              <span>
                <strong>Alex Morgan</strong>
                <small>Workspace admin</small>
              </span>
              <RIcon name="down" size={16} />
            </button>
          </div>
        </aside>
        <div className="retail-main">
          <header className="retail-topbar">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <RIcon name="menu" />
            </button>
            <div className="breadcrumbs">
              <RIcon name="store" size={17} />
              <span>Workspace</span>
              <span className="breadcrumb-slash">/</span>
              <strong>{modules[section]?.title || "Workspace"}</strong>
            </div>
            <button
              className="global-search"
              onClick={() => {
                setSearch("");
                open("search");
              }}
            >
              <RIcon name="search" size={17} />
              <span>Search anything...</span>
              <kbd>Ctrl K</kbd>
            </button>
            <div className="topbar-actions">
              <button
                className="icon-button help-button"
                aria-label="Workspace help"
                onClick={() => open("help")}
              >
                <RIcon name="help" size={20} />
              </button>
              <div className="notification-anchor">
                <button
                  className={`icon-button notification-button ${notifications ? "selected" : ""}`}
                  aria-label="Notifications"
                  aria-expanded={notifications}
                  onClick={() => setNotifications(!notifications)}
                >
                  <RIcon name="bell" size={20} />
                  {alerts > 0 && <i />}
                </button>
                {notifications && (
                  <div className="notification-menu">
                    <div className="popover-title">
                      <strong>Your attention, please</strong>
                      <button
                        className="icon-button"
                        aria-label="Close notifications"
                        onClick={() => setNotifications(false)}
                      >
                        <RIcon name="close" size={15} />
                      </button>
                    </div>
                    {db.settings.lowStockAlerts && lowStock.length > 0 && (
                      <Link
                        href="/inventory"
                        onClick={() => setNotifications(false)}
                      >
                        <span className="notice-icon orange">
                          <RIcon name="inventory" />
                        </span>
                        <span>
                          <strong>
                            {lowStock.length} products need a restock
                          </strong>
                          <small>Keep your bestsellers available.</small>
                        </span>
                        <RIcon name="right" size={16} />
                      </Link>
                    )}
                    {db.settings.orderAlerts && (
                      <Link
                        href="/orders"
                        onClick={() => setNotifications(false)}
                      >
                        <span className="notice-icon blue">
                          <RIcon name="orders" />
                        </span>
                        <span>
                          <strong>
                            {
                              db.orders.filter((o) => o.status === "Processing")
                                .length
                            }{" "}
                            orders to fulfill
                          </strong>
                          <small>A great experience starts here.</small>
                        </span>
                        <RIcon name="right" size={16} />
                      </Link>
                    )}
                    <Link
                      href="/support"
                      onClick={() => setNotifications(false)}
                    >
                      <span className="notice-icon green">
                        <RIcon name="support" />
                      </span>
                      <span>
                        <strong>
                          {openTickets.length} conversations need you
                        </strong>
                        <small>Your customers are waiting.</small>
                      </span>
                      <RIcon name="right" size={16} />
                    </Link>
                  </div>
                )}
              </div>
              <span className="topbar-divider" />
              <button
                className="profile-button"
                aria-label="Your profile and settings"
                onClick={() => router.push("/settings")}
              >
                <PersonAvatar name="Alex Morgan" size="small" />
                <RIcon name="down" size={14} />
              </button>
            </div>
          </header>
          <main id="main-content">{children}</main>
          <footer className="retail-footer">
            <span>Made for meaningful customer relationships.</span>
            <span>
              AR CRM <i /> Retail workspace
            </span>
          </footer>
        </div>
      </div>
      {toast && (
        <div
          className={`toast ${toast.error ? "error" : ""}`}
          role={toast.error ? "alert" : "status"}
        >
          <RIcon name={toast.error ? "help" : "check"} size={19} />
          <span>{toast.text}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast(null)}
          >
            <RIcon name="close" size={16} />
          </button>
        </div>
      )}
      {modal && (
        <WorkspaceModal modal={modal} search={search} setSearch={setSearch} />
      )}
    </RetailContext.Provider>
  );
}

function Dialog({
  title,
  subtitle,
  children,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const { close } = useRetail(),
    ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const el = ref.current;
    el?.querySelector<HTMLElement>(
      "input, select, textarea, button, a[href]",
    )?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !el) return;
      const nodes = [
        ...el.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea, [tabindex="0"]',
        ),
      ];
      const first = nodes[0],
        last = nodes.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    el?.addEventListener("keydown", trap);
    return () => {
      document.body.style.overflow = previousOverflow;
      el?.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className={`workspace-modal ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        ref={ref}
      >
        <div className="modal-heading">
          <div>
            <h2 id="modal-title">{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={close}
          >
            <RIcon name="close" size={21} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Field({
  label,
  name,
  type = "text",
  required: req = true,
  defaultValue,
  placeholder,
  min,
  step,
  children,
  onChange,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number;
  placeholder?: string;
  min?: number;
  step?: string;
  children?: ReactNode;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="form-field">
      <span>
        {label}
        {!req && <small>Optional</small>}
      </span>
      {children ? (
        <select
          onChange={(e) => onChange?.(e.target.value)}
          aria-label={label}
          name={name}
          required={req}
          defaultValue={defaultValue}
        >
          {children}
        </select>
      ) : (
        <input
          onChange={(e) => onChange?.(e.target.value)}
          aria-label={label}
          name={name}
          type={type}
          required={req}
          defaultValue={defaultValue}
          placeholder={placeholder}
          min={min}
          step={step}
          maxLength={type === "text" ? 200 : undefined}
        />
      )}
    </label>
  );
}
function WorkspaceModal({
  modal,
  search,
  setSearch,
}: {
  modal: NonNullable<ModalState>;
  search: string;
  setSearch: (s: string) => void;
}) {
  const { db, currency, run, busy, close, open } = useRetail(),
    router = useRouter();
  const [error, setError] = useState("");
  const [orderProduct, setOrderProduct] = useState("");
  const [orderQuantity, setOrderQuantity] = useState(1);
  const editing = modal.kind.endsWith("-edit");
  const kind = editing ? modal.kind.slice(0, -5) : modal.kind;
  if (kind === "search") {
    const q = search.toLowerCase(),
      customers = db.customers
        .filter((c) => `${c.name} ${c.email}`.toLowerCase().includes(q))
        .slice(0, 4),
      products = db.products
        .filter((p) => `${p.name} ${p.sku}`.toLowerCase().includes(q))
        .slice(0, 3);
    return (
      <Dialog
        title="Find your next step"
        subtitle="Search customers, products, orders, or workspace pages."
        wide
      >
        <div className="command-search">
          <RIcon name="search" />
          <input
            aria-label="Search workspace"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Try a customer, product, or order number..."
          />
        </div>
        <div className="command-results">
          <p>WORKSPACE</p>
          {Object.entries(modules)
            .filter(([, v]) => v.title.toLowerCase().includes(q))
            .slice(0, 4)
            .map(([key, v]) => (
              <button
                key={key}
                onClick={() => {
                  close();
                  router.push(key === "overview" ? "/" : `/${key}`);
                }}
              >
                <RIcon name={v.icon} />
                <span>{v.title}</span>
                <RIcon name="arrow" size={16} />
              </button>
            ))}
          <p>CUSTOMERS</p>
          {customers.map((c, i) => (
            <button key={c.id} onClick={() => open("customer-detail", c.id)}>
              <PersonAvatar name={c.name} size="small" index={i} />
              <span>
                {c.name}
                <small>{c.email}</small>
              </span>
              <RIcon name="right" size={16} />
            </button>
          ))}
          <p>PRODUCTS</p>
          {products.map((p) => (
            <button key={p.id} onClick={() => open("product-detail", p.id)}>
              <ProductImage product={p} />
              <span>
                {p.name}
                <small>{p.sku}</small>
              </span>
              <strong>{money(p.price, currency)}</strong>
            </button>
          ))}
          {q && (
            <>
              <p>ORDERS</p>
              {db.orders
                .filter((o) => o.id.toLowerCase().includes(q))
                .slice(0, 3)
                .map((o) => (
                  <button key={o.id} onClick={() => open("order-detail", o.id)}>
                    <RIcon name="orders" />
                    <span>{o.id}</span>
                    <strong>{money(o.total, currency)}</strong>
                  </button>
                ))}
            </>
          )}
          {q &&
            !customers.length &&
            !products.length &&
            !Object.values(modules).some((m) =>
              m.title.toLowerCase().includes(q),
            ) &&
            !db.orders.some((o) => o.id.toLowerCase().includes(q)) && (
              <div className="empty-state">
                <RIcon name="search" size={30} />
                <h3>No matches yet</h3>
                <p>Try another name, SKU, or order number.</p>
              </div>
            )}
        </div>
      </Dialog>
    );
  }
  if (kind === "help")
    return (
      <Dialog
        title="A more connected retail day"
        subtitle="Your quick guide to AR CRM."
      >
        <div className="help-content">
          {[
            [
              "customers",
              "Start with your customers",
              "Open a customer profile to see purchase history, loyalty points, relationship health, notes, and activity.",
            ],
            [
              "pipeline",
              "Keep opportunities moving",
              "Drag deals between stages or use the stage selector. Use team tasks to track the next step.",
            ],
            [
              "automation",
              "Let the small things run themselves",
              "Enable rules to create welcome, post-purchase, restock, and onboarding tasks automatically.",
            ],
            [
              "search",
              "Find anything, anywhere",
              "Press Ctrl K to jump to a page, customer, order, or product.",
            ],
          ].map(([icon, title, description]) => (
            <div key={title}>
              <span className="notice-icon orange">
                <RIcon name={icon} />
              </span>
              <span>
                <h3>{title}</h3>
                <p>{description}</p>
              </span>
            </div>
          ))}
          <div className="info-note">
            This is a local sample workspace. Changes are saved on this
            computer. Campaigns are planning drafts; no email or SMS is sent.
          </div>
        </div>
      </Dialog>
    );
  if (kind === "customer-detail") {
    const c = db.customers.find((c) => c.id === modal.id);
    if (!c) return null;
    return <CustomerProfile customer={c} />;
  }
  if (kind === "order-detail") {
    const order = db.orders.find((o) => o.id === modal.id);
    if (!order) return null;
    const c = db.customers.find((c) => c.id === order.customerId),
      p = db.products.find((p) => p.id === order.productId);
    return (
      <Dialog
        title={order.id}
        subtitle={`Placed ${dateLabel(order.date)} · ${order.store}`}
      >
        <div className="detail-content">
          <div className="detail-between">
            <Status value={order.status} />
            <span className="muted-text">{order.channel} order</span>
          </div>
          {p && (
            <div className="order-line">
              <ProductImage product={p} />
              <span>
                <strong>{p.name}</strong>
                <small>
                  {p.sku} · Quantity {order.quantity}
                </small>
              </span>
              <strong>{money(order.total, currency)}</strong>
            </div>
          )}
          <div className="receipt-total">
            <span>Order total</span>
            <strong>{money(order.total, currency)}</strong>
          </div>
          <button
            className="customer-detail-link"
            onClick={() => open("customer-detail", order.customerId)}
          >
            <PersonAvatar name={c?.name || "Customer"} />
            <span>
              <strong>{c?.name}</strong>
              <small>{c?.email}</small>
            </span>
            <RIcon name="right" />
          </button>
          <label className="form-field">
            <span>Fulfillment status</span>
            <select
              value={order.status}
              disabled={busy || order.status === "Cancelled"}
              onChange={(e) =>
                void run("order.status", {
                  id: order.id,
                  status: e.target.value,
                })
              }
            >
              {["Processing", "Shipped", "Delivered", "Cancelled"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <p className="form-hint">
            Cancelling an order returns its quantity to available inventory.
          </p>
        </div>
      </Dialog>
    );
  }
  if (kind === "product-detail") {
    const p = db.products.find((p) => p.id === modal.id);
    if (!p) return null;
    const sold = db.orders
      .filter((o) => o.productId === p.id && o.status !== "Cancelled")
      .reduce((s, o) => s + o.quantity, 0);
    return (
      <Dialog title={p.name} subtitle={`${p.sku} · ${p.category}`}>
        <div className="detail-content product-detail">
          <ProductImage product={p} large />
          <div className="profile-metrics">
            <div>
              <small>Retail price</small>
              <strong>{money(p.price, currency)}</strong>
            </div>
            <div>
              <small>Available stock</small>
              <strong>{p.stock}</strong>
            </div>
            <div>
              <small>Units sold</small>
              <strong>{sold}</strong>
            </div>
          </div>
          <div className="detail-between">
            <span>Gross margin</span>
            <strong>{Math.round((1 - p.cost / p.price) * 100)}%</strong>
          </div>
          <div className="detail-between">
            <span>Reorder point</span>
            <strong>{p.reorderAt} units</strong>
          </div>
          <button
            className="r-button"
            onClick={() => open("product-edit", p.id)}
          >
            Edit product details
          </button>
          <button
            className="r-button primary"
            onClick={() => open("stock", p.id)}
          >
            <RIcon name="inventory" size={17} />
            Adjust stock
          </button>
        </div>
      </Dialog>
    );
  }
  const titles: Record<string, string> = {
    customer: "Add a customer",
    order: "Create an order",
    product: "Add a product",
    deal: "Add a sales opportunity",
    task: "Create a team task",
    campaign: "Plan a campaign",
    ticket: "Create a support ticket",
    stock: "Adjust stock",
  };
  const product = db.products.find((p) => p.id === modal.id);
  const customer =
    editing && kind === "customer"
      ? db.customers.find((c) => c.id === modal.id)
      : undefined;
  const formTitle = editing ? `Edit ${kind}` : titles[kind];
  const pricedProduct = db.products.find((p) => p.id === orderProduct);
  const customerSelect = (
    <Field label="Customer" name="customerId" defaultValue="">
      <option value="" disabled>
        Choose a customer
      </option>
      {db.customers.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name} · {c.email}
        </option>
      ))}
    </Field>
  );
  const ownerSelect = (
    <Field label="Assigned to" name="owner" defaultValue={customer?.owner}>
      {owners.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </Field>
  );
  const prioritySelect = (
    <Field label="Priority" name="priority" defaultValue="Medium">
      {["High", "Medium", "Low"].map((o) => (
        <option key={o}>{o}</option>
      ))}
    </Field>
  );
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const values: Record<string, string | number | boolean> = {};
    new FormData(event.currentTarget).forEach(
      (value, key) => (values[key] = String(value)),
    );
    if (kind === "customer") values.consent = values.consent === "on";
    if (kind === "stock" || editing) values.id = modal.id || "";
    const ok = await run(
      kind === "stock"
        ? "stock.update"
        : `${kind}.${editing ? "update" : "create"}`,
      values,
    );
    if (ok) close();
    else
      setError(
        "Please check your details. The notification explains what needs attention.",
      );
  };
  return (
    <Dialog
      title={formTitle || "Create record"}
      subtitle={
        kind === "stock"
          ? product?.name
          : "A few details now. A better customer experience next."
      }
    >
      <form className="retail-form" onSubmit={submit}>
        {kind === "customer" && (
          <>
            <Field
              label="Full name"
              name="name"
              defaultValue={customer?.name}
              placeholder="e.g. Sophie Anderson"
            />
            <Field
              label="Email address"
              name="email"
              type="email"
              defaultValue={customer?.email}
              placeholder="sophie@example.com"
            />
            <div className="form-columns">
              <Field
                label="Phone number"
                name="phone"
                type="tel"
                defaultValue={customer?.phone}
                required={false}
                placeholder="+1 (415) 555-0100"
              />
              <Field
                label="City"
                name="city"
                defaultValue={customer?.city}
                required={false}
                placeholder="San Francisco"
              />
            </div>
            {ownerSelect}
            <label className="checkbox-field">
              <input
                type="checkbox"
                name="consent"
                defaultChecked={customer?.consent}
              />
              <span>Customer has opted in to marketing communications.</span>
            </label>
          </>
        )}
        {kind === "order" && (
          <>
            {customerSelect}
            <Field
              label="Product"
              name="productId"
              defaultValue=""
              onChange={setOrderProduct}
            >
              <option value="" disabled>
                Choose a product
              </option>
              {db.products.map((p) => (
                <option key={p.id} value={p.id} disabled={p.stock === 0}>
                  {p.name} · {money(p.price, currency)} · {p.stock} available
                </option>
              ))}
            </Field>
            <div className="form-columns">
              <Field
                label="Quantity"
                name="quantity"
                type="number"
                min={1}
                step="1"
                defaultValue={1}
                onChange={(value) => setOrderQuantity(Number(value))}
              />
              <Field label="Store" name="store">
                {stores.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Field>
            </div>
            {pricedProduct && (
              <div className="order-preview">
                <span>
                  Order total
                  <small>
                    {orderQuantity || 0} ×{" "}
                    {money(pricedProduct.price, currency)}
                  </small>
                </span>
                <strong>
                  {money(
                    pricedProduct.price * Math.max(0, orderQuantity),
                    currency,
                  )}
                </strong>
              </div>
            )}
            <div className="info-note">
              The order starts as Processing. Available stock and customer
              loyalty points update automatically.
            </div>
          </>
        )}
        {kind === "product" && (
          <>
            <Field
              label="Product name"
              name="name"
              defaultValue={editing ? product?.name : undefined}
              placeholder="e.g. Everyday Canvas Tote"
            />
            <div className="form-columns">
              <Field
                label="SKU"
                name="sku"
                defaultValue={editing ? product?.sku : undefined}
                placeholder="AR-BG-009"
              />
              <Field
                label="Category"
                name="category"
                defaultValue={editing ? product?.category : undefined}
              >
                {[
                  "Apparel",
                  "Accessories",
                  "Electronics",
                  "Home & living",
                  "Footwear",
                  "Beauty",
                ].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Field>
            </div>
            <div className="form-columns">
              <Field
                label="Retail price (USD)"
                name="price"
                type="number"
                defaultValue={editing ? product?.price : undefined}
                min={0.01}
                step="0.01"
              />
              <Field
                label="Unit cost (USD)"
                name="cost"
                type="number"
                defaultValue={editing ? product?.cost : undefined}
                min={0}
                step="0.01"
              />
            </div>
            <div className="form-columns">
              <Field
                label="Available stock"
                name="stock"
                type="number"
                min={0}
                step="1"
                defaultValue={editing ? product?.stock : 0}
              />
              <Field
                label="Reorder point"
                name="reorderAt"
                type="number"
                min={0}
                step="1"
                defaultValue={editing ? product?.reorderAt : 10}
              />
            </div>
          </>
        )}
        {kind === "deal" && (
          <>
            <Field
              label="Opportunity name"
              name="title"
              placeholder="e.g. Corporate welcome kits"
            />
            {customerSelect}
            <div className="form-columns">
              <Field
                label="Deal value (USD)"
                name="value"
                type="number"
                min={1}
                step="0.01"
              />
              <Field
                label="Expected close date"
                name="due"
                type="date"
                defaultValue={db.referenceDate}
              />
            </div>
            {ownerSelect}
          </>
        )}
        {kind === "task" && (
          <>
            <Field
              label="What needs to be done?"
              name="title"
              placeholder="e.g. Follow up with a VIP customer"
            />
            {ownerSelect}
            <div className="form-columns">
              {prioritySelect}
              <Field
                label="Due date"
                name="due"
                type="date"
                defaultValue={db.referenceDate}
              />
            </div>
            <Field
              label="Related customer"
              name="customerId"
              required={false}
              defaultValue=""
            >
              <option value="">No customer linked</option>
              {db.customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Field>
          </>
        )}
        {kind === "campaign" && (
          <>
            <Field
              label="Campaign name"
              name="name"
              placeholder="e.g. Your autumn edit is here"
            />
            <div className="form-columns">
              <Field
                label="Audience"
                name="segment"
                defaultValue={modal.id || "All customers"}
              >
                {["All customers", "VIP", "Returning", "New", "At risk"].map(
                  (s) => (
                    <option key={s}>{s}</option>
                  ),
                )}
              </Field>
              <Field label="Channel" name="channel">
                <option>Email</option>
                <option>SMS</option>
              </Field>
            </div>
            <div className="form-columns">
              <Field
                label="Planned date"
                name="date"
                type="date"
                defaultValue={db.referenceDate}
              />
              <Field
                label="Budget (USD)"
                name="budget"
                type="number"
                min={0}
                step="0.01"
                defaultValue={250}
              />
            </div>
            <div className="info-note">
              Campaigns are saved as plans. No messages are sent. Only customers
              with marketing consent are included in the audience.
            </div>
          </>
        )}
        {kind === "ticket" && (
          <>
            <Field
              label="How can we help?"
              name="subject"
              placeholder="Briefly describe the customer’s question"
            />
            {customerSelect}
            {prioritySelect}
          </>
        )}
        {kind === "stock" && (
          <>
            <div className="info-note">
              Current stock: <strong>{product?.stock} units</strong> · Reorder
              point: {product?.reorderAt}
            </div>
            <Field
              label="New available quantity"
              name="stock"
              type="number"
              min={0}
              step="1"
              defaultValue={product?.stock}
            />
            <p className="form-hint">
              Set the total available stock after your physical count or
              delivery.
            </p>
          </>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button
            className="r-button"
            type="button"
            onClick={close}
            disabled={busy}
          >
            Cancel
          </button>
          <button className="r-button primary" type="submit" disabled={busy}>
            {busy
              ? "Saving..."
              : editing
                ? `Save ${kind}`
                : kind === "stock"
                  ? "Save stock level"
                  : kind === "campaign"
                    ? "Save campaign draft"
                    : titles[kind]}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function CustomerProfile({ customer: c }: { customer: Customer }) {
  const { db, currency, run, busy, open } = useRetail(),
    [note, setNote] = useState("");
  const m = customerMetrics(db, c.id);
  return (
    <Dialog
      title="Customer profile"
      subtitle="Every detail. One connected relationship."
      wide
    >
      <div className="customer-profile">
        <div className="profile-heading">
          <PersonAvatar name={c.name} size="large" />
          <div>
            <h2>{c.name}</h2>
            <p>
              {c.city || "Location not provided"} · Customer since{" "}
              {dateLabel(c.createdAt)}
            </p>
          </div>
          <Status value={m.segment} />
          <button
            className="r-button small"
            onClick={() => open("customer-edit", c.id)}
          >
            Edit customer
          </button>
        </div>
        <div className="profile-metrics">
          <div>
            <small>Lifetime value</small>
            <strong>{money(m.spent, currency)}</strong>
          </div>
          <div>
            <small>Total orders</small>
            <strong>{m.orders.length}</strong>
          </div>
          <div>
            <small>Loyalty points</small>
            <strong>{m.points.toLocaleString("en-US")}</strong>
          </div>
          <div>
            <small>Relationship health</small>
            <strong>
              {m.score}
              <em>/100</em>
            </strong>
          </div>
        </div>
        <div className="profile-columns">
          <section>
            <h3>Contact & preferences</h3>
            <div className="contact-row">
              <RIcon name="mail" size={16} />
              <a href={`mailto:${c.email}`}>{c.email}</a>
            </div>
            {c.phone && (
              <div className="contact-row">
                <RIcon name="phone" size={16} />
                <a href={`tel:${c.phone}`}>{c.phone}</a>
              </div>
            )}
            <div className="contact-row">
              <RIcon name="customers" size={16} />
              <span>Managed by {c.owner}</span>
            </div>
            <div className="contact-row">
              <RIcon name="shield" size={16} />
              <span>
                {c.consent
                  ? "Marketing consent granted"
                  : "No marketing consent"}
              </span>
            </div>
            <h3 className="profile-section-title">Customer notes</h3>
            <form
              className="note-form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (await run("customer.note", { customerId: c.id, note }))
                  setNote("");
              }}
            >
              <label htmlFor="customer-note" className="sr-only">
                Add a customer note
              </label>
              <textarea
                id="customer-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Remember something that matters..."
                required
                maxLength={200}
              />
              <button
                type="submit"
                className="r-button small"
                disabled={busy || !note.trim()}
              >
                <RIcon name="plus" size={15} />
                Save note
              </button>
            </form>
            {c.notes.map((n, i) => (
              <div className="saved-note" key={i}>
                <p>{n.text}</p>
                <small>
                  {dateLabel(n.date)} · {c.owner}
                </small>
              </div>
            ))}
          </section>
          <section>
            <h3>
              Purchase history{" "}
              <span className="count-pill">{m.orders.length}</span>
            </h3>
            <div className="purchase-history">
              {m.orders
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 8)
                .map((o) => (
                  <button key={o.id} onClick={() => open("order-detail", o.id)}>
                    <span>
                      <strong>{o.id}</strong>
                      <small>{dateLabel(o.date)}</small>
                    </span>
                    <Status value={o.status} />
                    <strong>{money(o.total, currency)}</strong>
                  </button>
                ))}
              {!m.orders.length && (
                <p className="muted-text">
                  The first purchase is the start of something good.
                </p>
              )}
            </div>
            <h3 className="profile-section-title">Relationship activity</h3>
            <div className="profile-activity">
              {db.activity
                .filter((a) => a.customerId === c.id)
                .slice(0, 5)
                .map((a) => (
                  <div key={a.id}>
                    <span className="activity-dot" />
                    <span>
                      {a.text}
                      <small>{dateLabel(a.date)}</small>
                    </span>
                  </div>
                ))}
              {!db.activity.some((a) => a.customerId === c.id) && (
                <p className="muted-text">
                  New notes, orders, and updates will appear here.
                </p>
              )}
            </div>
          </section>
        </div>
        <p className="form-hint">
          Relationship health uses purchase frequency, spending, and recency.
          Loyalty points equal one point per dollar spent on non-cancelled
          orders.
        </p>
      </div>
    </Dialog>
  );
}
