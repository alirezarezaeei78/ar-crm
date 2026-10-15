"use client";
import Link from "next/link";
import { useMemo, useState, type ReactNode, type FormEvent } from "react";
import {
  customerMetrics,
  dateLabel,
  money,
  number,
  owners,
  periodOrders,
  stages,
  stores,
  taskStages,
} from "@/lib/retail-types";
import type { RetailDB } from "@/lib/retail-types";
import {
  modules,
  PersonAvatar,
  ProductImage,
  Status,
  useRetail,
} from "./retail-shell";
import { RIcon } from "./retail-icons";
import { ChannelChart, RevenueChart, Sparkline } from "./retail-charts";

export function downloadCSV(
  name: string,
  rows: Record<string, string | number | boolean>[],
) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    let text = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
    return `"${text.replaceAll('"', '""')}"`;
  };
  const csv =
    "\ufeff" +
    [
      keys.map(escape).join(","),
      ...rows.map((row) => keys.map((k) => escape(row[k])).join(",")),
    ].join("\r\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `ar-crm-${name}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const change = (current: number, previous: number) =>
  previous ? ((current - previous) / previous) * 100 : current ? 100 : 0;
function Growth({
  value,
  text = "vs. previous period",
}: {
  value: number;
  text?: string;
}) {
  return (
    <span className="growth-line">
      <span className={value < 0 ? "negative" : "positive"}>
        <RIcon name="trend" size={12} />
        {Math.abs(value).toFixed(1)}%
      </span>
      <small>{text}</small>
    </span>
  );
}
function Metric({
  label,
  value,
  icon,
  change: delta,
  values,
  index = 0,
  foot,
}: {
  label: string;
  value: string;
  icon: string;
  change?: number;
  values?: number[];
  index?: number;
  foot?: string;
}) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span>{label}</span>
        <span className={`metric-icon metric-icon-${index}`}>
          <RIcon name={icon} size={18} />
        </span>
      </div>
      <div className="metric-value-row">
        <strong>{value}</strong>
        {values && (
          <Sparkline values={values} tone={index === 1 ? "green" : "orange"} />
        )}
      </div>
      {delta !== undefined ? (
        <Growth value={delta} />
      ) : (
        <p className="metric-foot">{foot}</p>
      )}
    </article>
  );
}
function PanelHeader({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className="panel-header">
      <div>
        <h2>{title}</h2>
        {sub && <p>{sub}</p>}
      </div>
      {action}
    </div>
  );
}
function PeriodControls() {
  const { period, setPeriod, store, setStore } = useRetail();
  return (
    <div className="period-controls">
      <label className="r-select">
        <RIcon name="store" size={15} />
        <span className="sr-only">Filter by store</span>
        <select value={store} onChange={(e) => setStore(e.target.value)}>
          <option>All stores</option>
          {stores.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <RIcon name="down" size={13} />
      </label>
      <label className="r-select">
        <RIcon name="calendar" size={15} />
        <span className="sr-only">Reporting period</span>
        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          {["This month", "Last 7 days", "Last 30 days"].map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <RIcon name="down" size={13} />
      </label>
    </div>
  );
}

export function RetailWorkspace({
  section = "overview",
}: {
  section?: string;
}) {
  const { db, open, currency, period, store } = useRetail();
  const meta = modules[section] || modules.overview;
  const exportReport = () => {
    const p = periodOrders(db, period, store),
      revenue = p.current.reduce((s, o) => s + o.total, 0);
    downloadCSV("sales-report", [
      {
        Period: period,
        Store: store,
        "As of": db.referenceDate,
        Revenue: revenue,
        Orders: p.current.length,
        "Average order value": p.current.length
          ? +(revenue / p.current.length).toFixed(2)
          : 0,
        "Gross profit": p.current.reduce((s, o) => s + o.total - o.cost, 0),
        Currency: currency,
      },
    ]);
  };
  return (
    <div className={`workspace-content workspace-${section}`}>
      <div className="page-intro">
        <div>
          <div className="page-eyebrow">
            <span /> YOUR RETAIL WORKSPACE
          </div>
          <h1>
            {meta.title}
            {section === "overview" && <span className="heading-dot">.</span>}
          </h1>
          <p>{meta.subtitle}</p>
        </div>
        <div className="page-actions">
          {["overview", "reports"].includes(section) && (
            <button className="r-button" onClick={exportReport}>
              <RIcon name="export" size={16} />
              Export report
            </button>
          )}
          {meta.form && (
            <button
              className="r-button primary"
              onClick={() => open(meta.form!)}
            >
              <RIcon name="plus" size={17} />
              {meta.action}
            </button>
          )}
        </div>
      </div>
      {section === "overview" && <Dashboard />}
      {section === "customers" && <Customers />}
      {section === "orders" && <Orders />}
      {section === "products" && <Products />}
      {section === "inventory" && <Inventory />}
      {section === "pipeline" && <Pipeline />}
      {section === "tasks" && <Tasks />}
      {section === "segments" && <Segments />}
      {section === "campaigns" && <Campaigns />}
      {section === "automations" && <Automations />}
      {section === "reports" && <Reports />}
      {section === "support" && <Support />}
      {section === "team" && <Team />}
      {section === "settings" && <Settings />}
    </div>
  );
}

function Dashboard() {
  const { db, period, store, currency, open } = useRetail();
  const p = periodOrders(db, period, store),
    revenue = p.current.reduce((s, o) => s + o.total, 0),
    previousRevenue = p.previous.reduce((s, o) => s + o.total, 0);
  const customers = new Set(p.current.map((o) => o.customerId)).size,
    previousCustomers = new Set(p.previous.map((o) => o.customerId)).size;
  const avg = revenue / (p.current.length || 1),
    previousAvg = previousRevenue / (p.previous.length || 1);
  const buckets = Array.from({ length: 12 }, (_, i) =>
    p.current.filter(
      (o) =>
        Math.min(
          11,
          Math.floor(
            ((Date.parse(o.date) - p.start) / (p.days * 86400000)) * 12,
          ),
        ) === i,
    ),
  );
  const best = db.products
    .map((product) => ({
      product,
      orders: p.current.filter((o) => o.productId === product.id),
    }))
    .map((row) => ({
      ...row,
      total: row.orders.reduce((s, o) => s + o.total, 0),
      units: row.orders.reduce((s, o) => s + o.quantity, 0),
    }))
    .sort((a, b) => b.total - a.total);
  const low = db.products.filter((p) => p.stock <= p.reorderAt);
  return (
    <>
      <div className="overview-toolbar">
        <div className="overview-tabs">
          <span className="active">Business overview</span>
          <Link href="/segments">Customer insights</Link>
          <Link href="/reports">
            Sales performance
            <RIcon name="arrow" size={13} />
          </Link>
        </div>
        <PeriodControls />
      </div>
      <div className="metrics-grid">
        <Metric
          label="Total revenue"
          value={money(revenue, currency)}
          icon="dollar"
          change={change(revenue, previousRevenue)}
          values={buckets.map((b) => b.reduce((s, o) => s + o.total, 0))}
        />
        <Metric
          label="Total orders"
          value={number(p.current.length)}
          icon="bag"
          change={change(p.current.length, p.previous.length)}
          values={buckets.map((b) => b.length)}
          index={1}
        />
        <Metric
          label="Active customers"
          value={number(customers)}
          icon="customers"
          change={change(customers, previousCustomers)}
          values={buckets.map((b) => new Set(b.map((o) => o.customerId)).size)}
          index={2}
        />
        <Metric
          label="Average order value"
          value={money(avg, currency)}
          icon="target"
          change={change(avg, previousAvg)}
          values={buckets.map(
            (b) => b.reduce((s, o) => s + o.total, 0) / (b.length || 1),
          )}
          index={3}
        />
      </div>
      <div className="dashboard-chart-grid">
        <section className="r-panel revenue-panel">
          <PanelHeader
            title="Revenue overview"
            sub="A closer look at how your business is growing."
            action={
              <div className="chart-legend">
                <span>
                  <i className="orange-dot" />
                  Current period
                </span>
                <span>
                  <i className="gray-dot" />
                  Previous period
                </span>
              </div>
            }
          />
          <div className="chart-summary">
            <strong>{money(revenue, currency)}</strong>
            <Growth value={change(revenue, previousRevenue)} />
          </div>
          <RevenueChart
            current={p.current}
            previous={p.previous}
            days={p.days}
            start={p.start}
            currency={currency}
          />
          <div className="goal-strip">
            <span>
              <RIcon name="target" size={16} />
              <strong>Monthly sales goal</strong>
              <small>{money(db.settings.monthlyGoal, currency)}</small>
            </span>
            <div className="goal-track">
              <i
                style={{
                  width: `${Math.min(100, (periodOrders(db, "This month", store).current.reduce((s, o) => s + o.total, 0) / db.settings.monthlyGoal) * 100)}%`,
                }}
              />
            </div>
            <strong>
              {Math.round(
                (periodOrders(db, "This month", store).current.reduce(
                  (s, o) => s + o.total,
                  0,
                ) /
                  db.settings.monthlyGoal) *
                  100,
              )}
              %
            </strong>
          </div>
        </section>
        <section className="r-panel">
          <PanelHeader
            title="Sales by channel"
            sub="Every way your customers find you."
            action={<RIcon name="globe" size={18} />}
          />
          <ChannelChart orders={p.current} currency={currency} />
          <div className="panel-bottom-note">
            <span className="green-dot" />
            Across {new Set(p.current.map((o) => o.store)).size} active
            storefronts
          </div>
        </section>
      </div>
      <div className="dashboard-bottom-grid">
        <section className="r-panel recent-orders">
          <PanelHeader
            title="Recent orders"
            sub="The latest additions to your customer stories."
            action={
              <Link href="/orders" className="text-link">
                View all orders
                <RIcon name="arrow" size={15} />
              </Link>
            }
          />
          <div className="r-table-wrap">
            <table className="r-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-right">Amount</th>
                  <th>
                    <span className="sr-only">Details</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {p.current.slice(0, 5).map((o, i) => {
                  const c = db.customers.find((c) => c.id === o.customerId);
                  return (
                    <tr key={o.id}>
                      <td>
                        <button
                          className="table-id"
                          onClick={() => open("order-detail", o.id)}
                        >
                          #{o.id.replace("ORD-", "")}
                        </button>
                      </td>
                      <td>
                        <button
                          className="person-cell"
                          onClick={() => open("customer-detail", o.customerId)}
                        >
                          <PersonAvatar
                            name={c?.name || "Customer"}
                            size="small"
                            index={i}
                          />
                          <span>{c?.name}</span>
                        </button>
                      </td>
                      <td>
                        <Status value={o.status} />
                      </td>
                      <td className="muted-text">
                        {dateLabel(o.date).replace(", 2026", "")}
                      </td>
                      <td className="text-right table-money">
                        {money(o.total, currency)}
                      </td>
                      <td>
                        <button
                          className="icon-button"
                          aria-label={`View ${o.id}`}
                          onClick={() => open("order-detail", o.id)}
                        >
                          <RIcon name="right" size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {!p.current.length && (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <h3>A fresh start</h3>
                        <p>No orders in this period. Try another date range.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="table-panel-footer">
            <span>
              Showing {Math.min(5, p.current.length)} of{" "}
              {number(p.current.length)} orders
            </span>
            <span>
              <i className="health-dot" /> Updated from your workspace
            </span>
          </div>
        </section>
        <section className="r-panel bestsellers-panel">
          <PanelHeader
            title="Bestselling products"
            sub="The collection your customers love."
            action={
              <Link
                href="/products"
                className="icon-button"
                aria-label="View all products"
              >
                <RIcon name="arrow" size={18} />
              </Link>
            }
          />
          <div className="bestsellers-list">
            {best.slice(0, 4).map(({ product, total, units }, i) => (
              <button
                key={product.id}
                onClick={() => open("product-detail", product.id)}
              >
                <span className="rank">{String(i + 1).padStart(2, "0")}</span>
                <ProductImage product={product} />
                <span>
                  <strong>{product.name}</strong>
                  <small>{number(units)} units sold</small>
                </span>
                <strong>{money(total, currency)}</strong>
              </button>
            ))}
          </div>
          <div className="bestseller-footer">
            <RIcon name="trend" size={15} />
            <span>Ranked by revenue this period</span>
          </div>
        </section>
      </div>
      <div className="dashboard-insight-row">
        <Link href="/inventory" className="retail-insight">
          <span className="notice-icon orange">
            <RIcon name="inventory" size={20} />
          </span>
          <span>
            <strong>{low.length} products are running a little low</strong>
            <small>A quick restock keeps a good thing going.</small>
          </span>
          <span className="text-link">
            Review inventory
            <RIcon name="arrow" size={15} />
          </span>
        </Link>
        <Link href="/automations" className="retail-insight automation-insight">
          <span className="notice-icon violet">
            <RIcon name="automation" size={20} />
          </span>
          <span>
            <strong>A little less busywork.</strong>
            <small>
              {db.automations.filter((a) => a.enabled).length} automations
              keeping things moving.
            </small>
          </span>
          <RIcon name="arrow" size={18} />
        </Link>
      </div>
    </>
  );
}

type TableRow = {
  id: string;
  cells: ReactNode[];
  search: string;
  status: string;
  csv: Record<string, string | number | boolean>;
};
function DataTable({
  columns,
  rows,
  label,
  filters,
  filterLabel = "All statuses",
  searchPlaceholder = "Search...",
}: {
  columns: string[];
  rows: TableRow[];
  label: string;
  filters?: string[];
  filterLabel?: string;
  searchPlaceholder?: string;
}) {
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("All"),
    [page, setPage] = useState(1),
    [selected, setSelected] = useState<string[]>([]),
    [sort, setSort] = useState<{ key: string; direction: number } | null>(null);
  const filtered = useMemo(() => {
    const result = rows.filter(
      (r) =>
        r.search.toLowerCase().includes(query.toLowerCase()) &&
        (filter === "All" || r.status === filter),
    );
    if (sort)
      result.sort((a, b) =>
        typeof a.csv[sort.key] === "number" &&
        typeof b.csv[sort.key] === "number"
          ? (Number(a.csv[sort.key]) - Number(b.csv[sort.key])) * sort.direction
          : String(a.csv[sort.key] || "").localeCompare(
              String(b.csv[sort.key] || ""),
            ) * sort.direction,
      );
    return result;
  }, [rows, query, filter, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / 10)),
    currentPage = Math.min(page, pages),
    shown = filtered.slice((currentPage - 1) * 10, currentPage * 10),
    chosen = filtered.filter((r) => selected.includes(r.id));
  const allSelected =
    shown.length > 0 && shown.every((r) => selected.includes(r.id));
  return (
    <section className="r-panel data-panel">
      <div className="table-toolbar">
        <label className="table-search">
          <RIcon name="search" size={17} />
          <span className="sr-only">{searchPlaceholder}</span>
          <input
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <div className="table-toolbar-right">
          {filters && (
            <label className="r-select">
              <RIcon name="filter" size={16} />
              <span className="sr-only">{filterLabel}</span>
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="All">{filterLabel}</option>
                {filters.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
              <RIcon name="down" size={13} />
            </label>
          )}
          <button
            className="r-button small"
            disabled={!filtered.length}
            onClick={() =>
              downloadCSV(
                label,
                (chosen.length ? chosen : filtered).map((r) => r.csv),
              )
            }
          >
            <RIcon name="export" size={15} />
            {chosen.length ? `Export ${chosen.length} selected` : "Export CSV"}
          </button>
        </div>
      </div>
      <div className="r-table-wrap">
        <table className="r-table">
          <thead>
            <tr>
              <th className="checkbox-column">
                <input
                  type="checkbox"
                  aria-label="Select all rows on this page"
                  checked={allSelected}
                  onChange={() =>
                    setSelected(
                      allSelected
                        ? selected.filter(
                            (id) => !shown.some((r) => r.id === id),
                          )
                        : [
                            ...new Set([
                              ...selected,
                              ...shown.map((r) => r.id),
                            ]),
                          ],
                    )
                  }
                />
              </th>
              {columns.map((c, i) => (
                <th key={i}>
                  {c && c !== "Actions" ? (
                    <button
                      className="sort-button"
                      onClick={() =>
                        setSort({
                          key: c,
                          direction: sort?.key === c ? -sort.direction : 1,
                        })
                      }
                    >
                      {c}
                      <span>
                        {sort?.key === c
                          ? sort.direction === 1
                            ? "↑"
                            : "↓"
                          : "↕"}
                      </span>
                    </button>
                  ) : (
                    <span className="sr-only">Actions</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr
                key={r.id}
                className={selected.includes(r.id) ? "row-selected" : ""}
              >
                <td>
                  <input
                    type="checkbox"
                    checked={selected.includes(r.id)}
                    aria-label={`Select ${r.id}`}
                    onChange={() =>
                      setSelected(
                        selected.includes(r.id)
                          ? selected.filter((id) => id !== r.id)
                          : [...selected, r.id],
                      )
                    }
                  />
                </td>
                {r.cells.map((cell, i) => (
                  <td key={i}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!shown.length && (
          <div className="empty-state">
            <RIcon name="search" size={32} />
            <h3>No {label} found</h3>
            <p>Try a different search or filter to find what you need.</p>
            <button
              className="r-button small"
              onClick={() => {
                setQuery("");
                setFilter("All");
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
      <div className="pagination">
        <span>
          {filtered.length
            ? `${(currentPage - 1) * 10 + 1}–${Math.min(currentPage * 10, filtered.length)}`
            : "0"}{" "}
          of {number(filtered.length)} {label}
          {chosen.length ? ` · ${chosen.length} selected` : ""}
        </span>
        <div>
          <button
            className="r-button small"
            aria-label="Previous page"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            <RIcon name="left" size={14} />
            Previous
          </button>
          <span>
            Page {currentPage} of {pages}
          </span>
          <button
            className="r-button small"
            aria-label="Next page"
            disabled={currentPage >= pages}
            onClick={() => setPage(currentPage + 1)}
          >
            Next
            <RIcon name="right" size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}

function Customers() {
  const { db, currency, open } = useRetail();
  const rows = db.customers.map((c, i) => {
    const m = customerMetrics(db, c.id);
    return {
      id: c.id,
      search: `${c.name} ${c.email} ${c.city} ${c.owner}`,
      status: m.segment,
      csv: {
        Customer: c.name,
        Email: c.email,
        Location: c.city,
        Segment: m.segment,
        Orders: m.orders.length,
        "Lifetime value": m.spent,
        Owner: c.owner,
        "Marketing consent": c.consent,
      },
      cells: [
        <button
          className="person-cell"
          onClick={() => open("customer-detail", c.id)}
          key="c"
        >
          <PersonAvatar name={c.name} index={i} />
          <span>
            <strong>{c.name}</strong>
            <small>{c.email}</small>
          </span>
        </button>,
        c.city || "—",
        <Status value={m.segment} key="s" />,
        m.orders.length,
        <strong key="v" className="table-money">
          {money(m.spent, currency)}
        </strong>,
        <div className="owner-cell" key="o">
          <PersonAvatar
            name={c.owner}
            size="tiny"
            index={owners.indexOf(c.owner)}
          />
          {c.owner.split(" ")[0]}
        </div>,
        <button
          className="icon-button"
          aria-label={`View ${c.name}`}
          onClick={() => open("customer-detail", c.id)}
          key="a"
        >
          <RIcon name="right" size={16} />
        </button>,
      ],
    };
  });
  const vip = db.customers.filter(
      (c) => customerMetrics(db, c.id).segment === "VIP",
    ),
    total = db.orders
      .filter((o) => o.status !== "Cancelled")
      .reduce((s, o) => s + o.total, 0);
  return (
    <>
      <div className="metrics-grid compact">
        <Metric
          label="Customer community"
          value={number(db.customers.length)}
          icon="customers"
          foot="Every relationship in one place"
        />
        <Metric
          label="VIP customers"
          value={number(vip.length)}
          icon="star"
          index={1}
          foot="Lifetime spending of $1,800 or more"
        />
        <Metric
          label="Average lifetime value"
          value={money(total / (db.customers.length || 1), currency)}
          icon="dollar"
          index={2}
          foot="Across all customer purchases"
        />
        <Metric
          label="Marketing subscribers"
          value={number(db.customers.filter((c) => c.consent).length)}
          icon="mail"
          index={3}
          foot="Customers who have opted in"
        />
      </div>
      <DataTable
        columns={[
          "Customer",
          "Location",
          "Segment",
          "Orders",
          "Lifetime value",
          "Owner",
          "Actions",
        ]}
        rows={rows}
        label="customers"
        searchPlaceholder="Search name, email, city, or owner..."
        filters={["VIP", "Returning", "New", "At risk"]}
        filterLabel="All segments"
      />
    </>
  );
}
function Orders() {
  const { db, currency, open } = useRetail();
  const rows = [...db.orders]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((o) => {
      const c = db.customers.find((c) => c.id === o.customerId),
        p = db.products.find((p) => p.id === o.productId);
      return {
        id: o.id,
        search: `${o.id} ${c?.name} ${p?.name} ${o.store}`,
        status: o.status,
        csv: {
          Order: o.id,
          Customer: c?.name || "",
          Product: p?.name || "",
          Quantity: o.quantity,
          Status: o.status,
          Channel: o.channel,
          Date: o.date.slice(0, 10),
          Amount: o.total,
        },
        cells: [
          <button
            className="table-id"
            key="id"
            onClick={() => open("order-detail", o.id)}
          >
            {o.id}
          </button>,
          <button
            className="table-text-button"
            key="c"
            onClick={() => open("customer-detail", o.customerId)}
          >
            {c?.name}
          </button>,
          <span className="truncate-cell" key="p">
            {p?.name}
            <small>Qty {o.quantity}</small>
          </span>,
          <Status key="s" value={o.status} />,
          o.channel,
          dateLabel(o.date),
          <strong className="table-money" key="v">
            {money(o.total, currency)}
          </strong>,
          <button
            className="icon-button"
            aria-label={`View ${o.id}`}
            key="a"
            onClick={() => open("order-detail", o.id)}
          >
            <RIcon name="right" size={16} />
          </button>,
        ],
      };
    });
  return (
    <>
      <div className="metrics-grid compact">
        <Metric
          label="All orders"
          value={number(db.orders.length)}
          icon="orders"
          foot="Across every sales channel"
        />
        <Metric
          label="Ready to fulfill"
          value={number(
            db.orders.filter((o) => o.status === "Processing").length,
          )}
          icon="bag"
          index={1}
          foot="A great experience is waiting"
        />
        <Metric
          label="On the way"
          value={number(db.orders.filter((o) => o.status === "Shipped").length)}
          icon="globe"
          index={2}
          foot="Shipped to your customers"
        />
        <Metric
          label="Delivered with care"
          value={number(
            db.orders.filter((o) => o.status === "Delivered").length,
          )}
          icon="check"
          index={3}
          foot="Orders that reached their destination"
        />
      </div>
      <DataTable
        columns={[
          "Order",
          "Customer",
          "Product",
          "Status",
          "Channel",
          "Date",
          "Amount",
          "Actions",
        ]}
        rows={rows}
        label="orders"
        filters={["Processing", "Shipped", "Delivered", "Cancelled"]}
        searchPlaceholder="Search orders, customers, or products..."
      />
    </>
  );
}

function Products() {
  const { db, currency, open } = useRetail(),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState("All categories");
  const categories = [...new Set(db.products.map((p) => p.category))],
    products = db.products.filter(
      (p) =>
        `${p.name} ${p.sku}`.toLowerCase().includes(query.toLowerCase()) &&
        (category === "All categories" || p.category === category),
    );
  return (
    <>
      <div className="collection-toolbar">
        <label className="table-search">
          <RIcon name="search" size={17} />
          <span className="sr-only">Search products</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find something in your collection..."
          />
        </label>
        <label className="r-select">
          <RIcon name="filter" size={16} />
          <span className="sr-only">Product category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>All categories</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <RIcon name="down" size={13} />
        </label>
        <span>{products.length} products</span>
      </div>
      <div className="products-grid">
        {products.map((p) => (
          <article className="product-card" key={p.id}>
            <button
              className="product-card-image"
              onClick={() => open("product-detail", p.id)}
            >
              <ProductImage product={p} large />
              <span className="product-category">{p.category}</span>
            </button>
            <div className="product-card-content">
              <span className="product-sku">{p.sku}</span>
              <button
                className="product-title"
                onClick={() => open("product-detail", p.id)}
              >
                {p.name}
              </button>
              <div className="product-price">
                <strong>{money(p.price, currency)}</strong>
                <span>{Math.round((1 - p.cost / p.price) * 100)}% margin</span>
              </div>
              <div className="product-stock">
                <span>
                  <i
                    className={
                      p.stock <= p.reorderAt ? "orange-dot" : "green-dot"
                    }
                  />
                  {p.stock} in stock
                </span>
                <button
                  className="text-link"
                  onClick={() => open("stock", p.id)}
                >
                  Adjust stock
                  <RIcon name="arrow" size={14} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!products.length && (
        <div className="empty-state">
          <RIcon name="products" size={32} />
          <h3>No products found</h3>
          <p>Try another product name or category.</p>
        </div>
      )}
    </>
  );
}
function Inventory() {
  const { db, currency, open } = useRetail();
  const rows = db.products.map((p) => {
    const status =
      p.stock === 0
        ? "Out of stock"
        : p.stock <= p.reorderAt
          ? "Low stock"
          : "In stock";
    return {
      id: p.id,
      search: `${p.name} ${p.sku} ${p.category}`,
      status,
      csv: {
        Product: p.name,
        SKU: p.sku,
        Category: p.category,
        Available: p.stock,
        "Reorder point": p.reorderAt,
        Status: status,
        "Stock value": p.stock * p.cost,
      },
      cells: [
        <button
          className="product-cell"
          key="p"
          onClick={() => open("product-detail", p.id)}
        >
          <ProductImage product={p} />
          <span>
            <strong>{p.name}</strong>
            <small>{p.sku}</small>
          </span>
        </button>,
        p.category,
        <strong key="q">{p.stock} units</strong>,
        p.reorderAt,
        <Status key="s" value={status} />,
        money(p.stock * p.cost, currency),
        <button
          key="a"
          className="r-button small"
          onClick={() => open("stock", p.id)}
        >
          Adjust stock
        </button>,
      ],
    };
  });
  return (
    <>
      <div className="metrics-grid compact">
        <Metric
          label="Units on hand"
          value={number(db.products.reduce((s, p) => s + p.stock, 0))}
          icon="products"
          foot="Available across the collection"
        />
        <Metric
          label="Inventory value"
          value={money(
            db.products.reduce((s, p) => s + p.stock * p.cost, 0),
            currency,
          )}
          icon="dollar"
          index={1}
          foot="At product cost"
        />
        <Metric
          label="Needs a restock"
          value={number(
            db.products.filter((p) => p.stock <= p.reorderAt).length,
          )}
          icon="inventory"
          index={2}
          foot="At or below the reorder point"
        />
        <Metric
          label="Out of stock"
          value={number(db.products.filter((p) => !p.stock).length)}
          icon="bag"
          index={3}
          foot="Products with no available units"
        />
      </div>
      <DataTable
        columns={[
          "Product",
          "Category",
          "Available",
          "Reorder point",
          "Status",
          "Stock value",
          "Actions",
        ]}
        rows={rows}
        label="products"
        filters={["In stock", "Low stock", "Out of stock"]}
        searchPlaceholder="Search product name, SKU, or category..."
      />
    </>
  );
}

function Pipeline() {
  const { db, currency, run, busy, open } = useRetail(),
    [query, setQuery] = useState(""),
    [owner, setOwner] = useState("Everyone"),
    [dragOver, setDragOver] = useState("");
  const deals = db.deals.filter(
    (d) =>
      `${d.title} ${db.customers.find((c) => c.id === d.customerId)?.name}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (owner === "Everyone" || d.owner === owner),
  );
  const total = db.deals
      .filter((d) => d.stage !== "Won")
      .reduce((s, d) => s + d.value, 0),
    weighted = db.deals
      .filter((d) => d.stage !== "Won")
      .reduce(
        (s, d) =>
          s + d.value * [0.1, 0.25, 0.5, 0.75, 1][stages.indexOf(d.stage)],
        0,
      );
  return (
    <>
      <div className="metrics-grid compact">
        <Metric
          label="Open pipeline"
          value={money(total, currency)}
          icon="pipeline"
          foot={`${db.deals.filter((d) => d.stage !== "Won").length} active opportunities`}
        />
        <Metric
          label="Weighted forecast"
          value={money(weighted, currency)}
          icon="target"
          index={1}
          foot="Stage probabilities: 10%, 25%, 50%, 75%"
        />
        <Metric
          label="Closed won"
          value={money(
            db.deals
              .filter((d) => d.stage === "Won")
              .reduce((s, d) => s + d.value, 0),
            currency,
          )}
          icon="check"
          index={2}
          foot="Opportunity value, separate from order revenue"
        />
        <Metric
          label="Average deal size"
          value={money(
            db.deals.reduce((s, d) => s + d.value, 0) / (db.deals.length || 1),
            currency,
          )}
          icon="dollar"
          index={3}
          foot="Across your entire pipeline"
        />
      </div>
      <div className="board-toolbar">
        <label className="table-search">
          <RIcon name="search" size={17} />
          <span className="sr-only">Search opportunities</span>
          <input
            placeholder="Find an opportunity..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label className="r-select">
          <RIcon name="customers" size={16} />
          <span className="sr-only">Filter deal owner</span>
          <select value={owner} onChange={(e) => setOwner(e.target.value)}>
            <option>Everyone</option>
            {owners.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <RIcon name="down" size={13} />
        </label>
        <span className="board-hint">
          <RIcon name="pipeline" size={15} />
          Drag cards or choose a stage
        </span>
      </div>
      <div className="pipeline-board">
        {stages.map((stage, i) => {
          const items = deals.filter((d) => d.stage === stage);
          return (
            <section
              className={`board-column stage-${i} ${dragOver === stage ? "drag-over" : ""}`}
              key={stage}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(stage);
              }}
              onDragLeave={() => setDragOver("")}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("deal");
                setDragOver("");
                if (id) void run("deal.stage", { id, stage });
              }}
            >
              <div className="board-column-heading">
                <span>
                  <i />
                  {stage}
                  <small>{items.length}</small>
                </span>
                <strong>
                  {money(
                    items.reduce((s, d) => s + d.value, 0),
                    currency,
                  )}
                </strong>
              </div>
              <div className="board-cards">
                {items.map((d) => {
                  const c = db.customers.find((c) => c.id === d.customerId);
                  return (
                    <article
                      className="deal-card"
                      key={d.id}
                      draggable={!busy}
                      onDragStart={(e) => e.dataTransfer.setData("deal", d.id)}
                    >
                      <div className="deal-card-top">
                        <span>RETAIL OPPORTUNITY</span>
                        <RIcon name="more" size={16} />
                      </div>
                      <h3>{d.title}</h3>
                      <button
                        className="deal-customer"
                        onClick={() => open("customer-detail", d.customerId)}
                      >
                        <PersonAvatar
                          name={c?.name || "Customer"}
                          size="tiny"
                        />
                        {c?.name}
                      </button>
                      <strong className="deal-value">
                        {money(d.value, currency)}
                      </strong>
                      <div className="deal-due">
                        <RIcon name="calendar" size={13} />
                        {dateLabel(d.due)}
                        <PersonAvatar
                          name={d.owner}
                          size="tiny"
                          index={owners.indexOf(d.owner)}
                        />
                      </div>
                      <label className="stage-select">
                        <span className="sr-only">Stage for {d.title}</span>
                        <select
                          value={d.stage}
                          disabled={busy}
                          onChange={(e) =>
                            void run("deal.stage", {
                              id: d.id,
                              stage: e.target.value,
                            })
                          }
                        >
                          {stages.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                        <RIcon name="down" size={12} />
                      </label>
                    </article>
                  );
                })}
              </div>
              {stage === "New lead" && (
                <button className="board-add" onClick={() => open("deal")}>
                  <RIcon name="plus" size={15} />
                  Add opportunity
                </button>
              )}
              {!items.length && (
                <div className="board-empty">
                  Room for your next opportunity
                </div>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}

function Tasks() {
  const { db, run, busy, open } = useRetail(),
    [owner, setOwner] = useState("Everyone"),
    [query, setQuery] = useState(""),
    [view, setView] = useState("Board"),
    [over, setOver] = useState("");
  const tasks = db.tasks.filter(
    (t) =>
      (owner === "Everyone" || t.owner === owner) &&
      t.title.toLowerCase().includes(query.toLowerCase()),
  );
  const overdue = db.tasks.filter(
    (t) => t.due < db.referenceDate && t.status !== "Done",
  ).length;
  const rows = tasks.map((t) => ({
    id: t.id,
    search: `${t.title} ${t.owner}`,
    status: t.status,
    csv: {
      Task: t.title,
      Status: t.status,
      Priority: t.priority,
      Owner: t.owner,
      "Due date": t.due,
    },
    cells: [
      <strong key="t">{t.title}</strong>,
      <Status key="s" value={t.status} />,
      <Status key="p" value={t.priority} />,
      <span key="o" className="owner-cell">
        <PersonAvatar name={t.owner} size="tiny" />
        {t.owner}
      </span>,
      <span
        key="d"
        className={
          t.due < db.referenceDate && t.status !== "Done" ? "overdue" : ""
        }
      >
        {dateLabel(t.due)}
      </span>,
      <label key="a">
        <span className="sr-only">Status for {t.title}</span>
        <select
          className="inline-select"
          value={t.status}
          disabled={busy}
          onChange={(e) =>
            void run("task.status", { id: t.id, status: e.target.value })
          }
        >
          {taskStages.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>,
    ],
  }));
  return (
    <>
      <div className="task-summary-strip">
        <span>
          <RIcon name="tasks" size={18} />
          <strong>{db.tasks.length}</strong> team tasks
        </span>
        <span>
          <i className="orange-dot" />
          <strong>
            {db.tasks.filter((t) => t.status === "In progress").length}
          </strong>{" "}
          in progress
        </span>
        <span>
          <i className="green-dot" />
          <strong>
            {db.tasks.filter((t) => t.status === "Done").length}
          </strong>{" "}
          completed
        </span>
        <span className="overdue">
          <RIcon name="clock" size={15} />
          <strong>{overdue}</strong> overdue
        </span>
        <div className="view-switch">
          {["Board", "List"].map((v) => (
            <button
              className={v === view ? "active" : ""}
              key={v}
              onClick={() => setView(v)}
            >
              <RIcon name={v === "Board" ? "pipeline" : "tasks"} size={15} />
              {v}
            </button>
          ))}
        </div>
      </div>
      <div className="board-toolbar">
        <label className="table-search">
          <RIcon name="search" size={17} />
          <span className="sr-only">Search tasks</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find your next step..."
          />
        </label>
        <label className="r-select">
          <RIcon name="customers" size={16} />
          <span className="sr-only">Task owner</span>
          <select value={owner} onChange={(e) => setOwner(e.target.value)}>
            <option>Everyone</option>
            {owners.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <RIcon name="down" size={13} />
        </label>
      </div>
      {view === "List" ? (
        <DataTable
          columns={[
            "Task",
            "Status",
            "Priority",
            "Owner",
            "Due date",
            "Actions",
          ]}
          rows={rows}
          label="tasks"
          filters={taskStages}
        />
      ) : (
        <div className="task-board">
          {taskStages.map((stage, i) => (
            <section
              key={stage}
              className={`board-column stage-${i * 2} ${over === stage ? "drag-over" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(stage);
              }}
              onDragLeave={() => setOver("")}
              onDrop={(e) => {
                e.preventDefault();
                setOver("");
                const id = e.dataTransfer.getData("task");
                if (id) void run("task.status", { id, status: stage });
              }}
            >
              <div className="board-column-heading">
                <span>
                  <i />
                  {stage}
                  <small>
                    {tasks.filter((t) => t.status === stage).length}
                  </small>
                </span>
                <RIcon name="more" size={18} />
              </div>
              <div className="board-cards">
                {tasks
                  .filter((t) => t.status === stage)
                  .map((t) => (
                    <article
                      key={t.id}
                      className="task-card"
                      draggable={!busy}
                      onDragStart={(e) => e.dataTransfer.setData("task", t.id)}
                    >
                      <div className="task-card-top">
                        <Status value={t.priority} />
                        {t.source && (
                          <span className="automation-tag">
                            <RIcon name="automation" size={12} />
                            Automated
                          </span>
                        )}
                      </div>
                      <h3>{t.title}</h3>
                      {t.customerId && (
                        <button
                          className="task-customer"
                          onClick={() => open("customer-detail", t.customerId)}
                        >
                          <RIcon name="customers" size={13} />
                          {
                            db.customers.find((c) => c.id === t.customerId)
                              ?.name
                          }
                        </button>
                      )}
                      <div className="task-card-bottom">
                        <span
                          className={
                            t.due < db.referenceDate && t.status !== "Done"
                              ? "overdue"
                              : ""
                          }
                        >
                          <RIcon name="calendar" size={13} />
                          {dateLabel(t.due)}
                        </span>
                        <PersonAvatar
                          name={t.owner}
                          size="tiny"
                          index={owners.indexOf(t.owner)}
                        />
                      </div>
                      <label className="stage-select">
                        <span className="sr-only">Status for {t.title}</span>
                        <select
                          value={t.status}
                          disabled={busy}
                          onChange={(e) =>
                            void run("task.status", {
                              id: t.id,
                              status: e.target.value,
                            })
                          }
                        >
                          {taskStages.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                        <RIcon name="down" size={12} />
                      </label>
                    </article>
                  ))}
              </div>
              <button className="board-add" onClick={() => open("task")}>
                <RIcon name="plus" size={15} />
                Create task
              </button>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

function Segments() {
  const { db, currency, open } = useRetail(),
    [selected, setSelected] = useState("VIP");
  const definitions = [
    {
      name: "VIP",
      icon: "star",
      title: "Your inner circle",
      description: "Customers with lifetime spending of $1,800 or more.",
      tone: "orange",
    },
    {
      name: "Returning",
      icon: "repeat",
      title: "Familiar faces",
      description: "Repeat customers whose latest order was within 30 days.",
      tone: "green",
    },
    {
      name: "New",
      icon: "customers",
      title: "The start of something",
      description: "Customers with one recent purchase, or no purchases yet.",
      tone: "blue",
    },
    {
      name: "At risk",
      icon: "clock",
      title: "Worth reconnecting",
      description:
        "Non-VIP customers with purchases, but none in over 30 days.",
      tone: "violet",
    },
  ];
  const matched = db.customers.filter(
    (c) => customerMetrics(db, c.id).segment === selected,
  );
  return (
    <>
      <div className="info-banner">
        <span className="notice-icon orange">
          <RIcon name="segments" />
        </span>
        <span>
          <strong>Always up to date. Always personal.</strong>
          <small>
            Segments update as customers shop. VIP takes priority; the remaining
            customers are grouped by purchase recency and frequency.
          </small>
        </span>
      </div>
      <div className="segment-grid">
        {definitions.map((s) => {
          const people = db.customers.filter(
            (c) => customerMetrics(db, c.id).segment === s.name,
          );
          return (
            <button
              key={s.name}
              className={`segment-card ${selected === s.name ? "selected" : ""}`}
              onClick={() => setSelected(s.name)}
            >
              <div>
                <span className={`notice-icon ${s.tone}`}>
                  <RIcon name={s.icon} />
                </span>
                <Status value={s.name} />
              </div>
              <strong>
                {people.length}
                <small>customers</small>
              </strong>
              <h3>{s.title}</h3>
              <p>{s.description}</p>
              <div className="segment-card-footer">
                <span>
                  {money(
                    people.reduce(
                      (sum, c) => sum + customerMetrics(db, c.id).spent,
                      0,
                    ),
                    currency,
                  )}{" "}
                  lifetime value
                </span>
                <RIcon name="arrow" size={16} />
              </div>
            </button>
          );
        })}
      </div>
      <section className="r-panel">
        <PanelHeader
          title={`${selected} customers`}
          sub={`${matched.length} customers · ${matched.filter((c) => c.consent).length} opted in to marketing`}
          action={
            <button
              className="r-button primary small"
              onClick={() => open("campaign", selected)}
            >
              <RIcon name="campaigns" size={15} />
              Plan a campaign
            </button>
          }
        />
        <div className="segment-people">
          {matched.slice(0, 12).map((c, i) => {
            const m = customerMetrics(db, c.id);
            return (
              <button key={c.id} onClick={() => open("customer-detail", c.id)}>
                <PersonAvatar name={c.name} index={i} />
                <span>
                  <strong>{c.name}</strong>
                  <small>
                    {m.orders.length} orders · {money(m.spent, currency)}
                  </small>
                </span>
                <RIcon name="right" size={15} />
              </button>
            );
          })}
          {!matched.length && (
            <div className="empty-state">
              <RIcon name="customers" size={30} />
              <h3>A little room to grow</h3>
              <p>No customers meet this segment’s rules yet.</p>
            </div>
          )}
        </div>
        {matched.length > 12 && (
          <div className="panel-bottom-note">
            <Link href="/customers" className="text-link">
              View all customers and filter by segment
              <RIcon name="arrow" size={14} />
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
function Campaigns() {
  const { db, currency, run, busy } = useRetail();
  const audience = (segment: string) =>
    db.customers.filter(
      (c) =>
        c.consent &&
        (segment === "All customers" ||
          customerMetrics(db, c.id).segment === segment),
    ).length;
  return (
    <>
      <div className="info-banner">
        <span className="notice-icon blue">
          <RIcon name="mail" />
        </span>
        <span>
          <strong>Thoughtful campaigns start with a plan.</strong>
          <small>
            Manage audiences, budgets, and schedules here. Email and SMS
            delivery are not connected; no messages will be sent.
          </small>
        </span>
        <span className="connection-badge">Planning workspace</span>
      </div>
      <div className="metrics-grid compact">
        <Metric
          label="Campaign plans"
          value={number(db.campaigns.length)}
          icon="campaigns"
          foot="Your upcoming customer conversations"
        />
        <Metric
          label="Scheduled plans"
          value={number(
            db.campaigns.filter((c) => c.status === "Scheduled").length,
          )}
          icon="calendar"
          index={1}
          foot="Ready for your delivery provider"
        />
        <Metric
          label="Opted-in audience"
          value={number(db.customers.filter((c) => c.consent).length)}
          icon="customers"
          index={2}
          foot="Consent is always respected"
        />
        <Metric
          label="Planned budget"
          value={money(
            db.campaigns.reduce((s, c) => s + c.budget, 0),
            currency,
          )}
          icon="dollar"
          index={3}
          foot="Across all campaign plans"
        />
      </div>
      <div className="campaign-grid">
        {db.campaigns.map((c, i) => (
          <article className="r-panel campaign-card" key={c.id}>
            <div className={`campaign-art campaign-art-${i % 3}`}>
              <span className="campaign-stamp">AR RETAIL CO.</span>
              <RIcon
                name={c.channel === "Email" ? "mail" : "phone"}
                size={38}
              />
              <span>
                {c.segment === "VIP"
                  ? "A little more personal."
                  : c.segment === "At risk"
                    ? "Good to see you again."
                    : "Your next favorite thing."}
              </span>
              <i />
              <i />
            </div>
            <div className="campaign-content">
              <div className="detail-between">
                <span className="eyebrow-label">
                  {c.channel} · {c.segment}
                </span>
                <Status value={c.status} />
              </div>
              <h3>{c.name}</h3>
              <div className="campaign-meta">
                <span>
                  <RIcon name="customers" size={15} />
                  {audience(c.segment)} eligible customers
                </span>
                <span>
                  <RIcon name="calendar" size={15} />
                  {dateLabel(c.date)}
                </span>
              </div>
              <div className="campaign-footer">
                <span>
                  Budget <strong>{money(c.budget, currency)}</strong>
                </span>
                <label>
                  <span className="sr-only">Status for {c.name}</span>
                  <select
                    className="inline-select"
                    value={c.status}
                    disabled={busy}
                    onChange={(e) =>
                      void run("campaign.status", {
                        id: c.id,
                        status: e.target.value,
                      })
                    }
                  >
                    {["Draft", "Scheduled", "Paused"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
function Automations() {
  const { db, run, busy } = useRetail();
  const icons: Record<string, string> = {
    customer_created: "customers",
    order_created: "orders",
    low_stock: "inventory",
    deal_won: "pipeline",
  };
  return (
    <>
      <div className="automation-hero">
        <div className="automation-hero-symbol">
          <RIcon name="automation" size={34} />
        </div>
        <div>
          <span className="eyebrow-label">A LITTLE HELP BEHIND THE SCENES</span>
          <h2>
            More relationships.
            <br />
            Less routine.
          </h2>
          <p>Practical retail rules that turn a moment into a next step.</p>
        </div>
        <div className="automation-hero-metrics">
          <div>
            <strong>
              {db.automations.filter((a) => a.enabled).length}
              <span>active rules</span>
            </strong>
          </div>
          <div>
            <strong>
              {db.automations.reduce((s, a) => s + a.runs, 0)}
              <span>tasks created</span>
            </strong>
          </div>
        </div>
      </div>
      <div className="automation-grid">
        {db.automations.map((a) => (
          <article className="r-panel automation-card" key={a.id}>
            <div className="automation-card-top">
              <span className="notice-icon orange">
                <RIcon name={icons[a.trigger]} />
              </span>
              <button
                className={`toggle ${a.enabled ? "on" : ""}`}
                role="switch"
                aria-checked={a.enabled}
                aria-label={`Enable ${a.name}`}
                disabled={busy}
                onClick={() =>
                  void run("automation.toggle", {
                    id: a.id,
                    enabled: !a.enabled,
                  })
                }
              >
                <span />
              </button>
            </div>
            <h3>{a.name}</h3>
            <p>{a.description}</p>
            <div className="automation-recipe">
              <span>
                <RIcon name={icons[a.trigger]} size={15} />
                {a.trigger === "customer_created"
                  ? "Customer added"
                  : a.trigger === "order_created"
                    ? "Order placed"
                    : a.trigger === "low_stock"
                      ? "Low stock detected"
                      : "Deal won"}
              </span>
              <RIcon name="arrow" size={15} />
              <span>
                <RIcon name="tasks" size={15} />
                Create task
              </span>
            </div>
            <div className="automation-footer">
              <span>
                <i className={a.enabled ? "green-dot" : "gray-dot"} />
                {a.enabled ? "Active" : "Paused"}
              </span>
              <span>{a.runs} runs</span>
            </div>
          </article>
        ))}
      </div>
      <div className="info-banner">
        <span className="notice-icon green">
          <RIcon name="inventory" />
        </span>
        <span>
          <strong>Start with the stock you have today.</strong>
          <small>
            Check all products against their reorder points. An enabled restock
            rule creates tasks and skips existing open duplicates.
          </small>
        </span>
        <button
          className="r-button"
          disabled={busy}
          onClick={() => void run("automation.run", {})}
        >
          <RIcon name="automation" size={16} />
          {busy ? "Checking..." : "Run stock check"}
        </button>
      </div>
    </>
  );
}
function Reports() {
  const { db, currency, period, store } = useRetail(),
    p = periodOrders(db, period, store);
  const revenue = p.current.reduce((s, o) => s + o.total, 0),
    profit = p.current.reduce((s, o) => s + o.total - o.cost, 0),
    previous = p.previous.reduce((s, o) => s + o.total, 0);
  const returning = p.current.filter((o) =>
    db.orders.some(
      (prior) =>
        prior.customerId === o.customerId &&
        prior.status !== "Cancelled" &&
        prior.date < o.date,
    ),
  );
  const categories = [...new Set(db.products.map((p) => p.category))]
    .map((category) => {
      const ids = db.products
          .filter((p) => p.category === category)
          .map((p) => p.id),
        orders = p.current.filter((o) => ids.includes(o.productId));
      return {
        category,
        revenue: orders.reduce((s, o) => s + o.total, 0),
        profit: orders.reduce((s, o) => s + o.total - o.cost, 0),
        units: orders.reduce((s, o) => s + o.quantity, 0),
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
  return (
    <>
      <div className="report-toolbar">
        <span className="report-scope">
          <span className="health-dot" />
          Reporting through {dateLabel(db.referenceDate)}
        </span>
        <PeriodControls />
      </div>
      <div className="metrics-grid">
        <Metric
          label="Net order revenue"
          value={money(revenue, currency)}
          icon="dollar"
          change={change(revenue, previous)}
        />
        <Metric
          label="Gross profit"
          value={money(profit, currency)}
          icon="trend"
          index={1}
          foot={`${revenue ? ((profit / revenue) * 100).toFixed(1) : 0}% gross margin · excludes operating costs`}
        />
        <Metric
          label="Repeat purchase share"
          value={`${p.current.length ? ((returning.length / p.current.length) * 100).toFixed(1) : 0}%`}
          icon="repeat"
          index={2}
          foot="Orders from customers with an earlier purchase"
        />
        <Metric
          label="Units sold"
          value={number(p.current.reduce((s, o) => s + o.quantity, 0))}
          icon="products"
          index={3}
          foot="Non-cancelled orders in this period"
        />
      </div>
      <div className="dashboard-chart-grid">
        <section className="r-panel">
          <PanelHeader
            title="Revenue performance"
            sub="Current and previous periods, using the same number of days."
          />
          <div className="chart-summary">
            <strong>{money(revenue, currency)}</strong>
            <Growth value={change(revenue, previous)} />
          </div>
          <RevenueChart
            current={p.current}
            previous={p.previous}
            days={p.days}
            start={p.start}
            currency={currency}
          />
        </section>
        <section className="r-panel">
          <PanelHeader
            title="Channel contribution"
            sub="The revenue mix across your storefronts."
          />
          <ChannelChart orders={p.current} currency={currency} />
        </section>
      </div>
      <div className="reports-bottom-grid">
        <section className="r-panel">
          <PanelHeader
            title="Category performance"
            sub="Discover what’s earning its place in your collection."
          />
          <div className="r-table-wrap">
            <table className="r-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Units sold</th>
                  <th>Revenue</th>
                  <th>Gross profit</th>
                  <th>Revenue share</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.category}>
                    <td>
                      <strong>{c.category}</strong>
                    </td>
                    <td>{c.units}</td>
                    <td className="table-money">
                      {money(c.revenue, currency)}
                    </td>
                    <td>{money(c.profit, currency)}</td>
                    <td>
                      <div className="table-bar">
                        <i
                          style={{
                            width: `${revenue ? (c.revenue / revenue) * 100 : 0}%`,
                          }}
                        />
                        <span>
                          {revenue
                            ? Math.round((c.revenue / revenue) * 100)
                            : 0}
                          %
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="r-panel">
          <PanelHeader
            title="Store performance"
            sub="One business. Every place you sell."
          />
          <div className="store-performance">
            {stores.map((s, i) => {
              const orders = p.current.filter((o) => o.store === s),
                total = orders.reduce((sum, o) => sum + o.total, 0);
              return (
                <div key={s}>
                  <span
                    className={`notice-icon ${i === 0 ? "orange" : i === 1 ? "green" : "blue"}`}
                  >
                    <RIcon name={i === 0 ? "globe" : "store"} />
                  </span>
                  <span>
                    <strong>{s}</strong>
                    <small>{orders.length} orders</small>
                  </span>
                  <strong>{money(total, currency)}</strong>
                </div>
              );
            })}
          </div>
          <div className="report-definition">
            <RIcon name="help" size={16} />
            <p>
              Revenue excludes cancelled orders. Gross profit subtracts the
              product cost recorded at purchase. Shipping, tax, and operating
              expenses are not modeled.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
function Support() {
  const { db, run, busy, open } = useRetail();
  const rows = db.tickets.map((t) => {
    const c = db.customers.find((c) => c.id === t.customerId);
    return {
      id: t.id,
      search: `${t.subject} ${c?.name} ${t.id}`,
      status: t.status,
      csv: {
        Ticket: t.id,
        Subject: t.subject,
        Customer: c?.name || "",
        Priority: t.priority,
        Status: t.status,
        Created: t.date,
      },
      cells: [
        <span className="ticket-subject" key="t">
          <strong>{t.subject}</strong>
          <small>{t.id}</small>
        </span>,
        <button
          className="table-text-button"
          key="c"
          onClick={() => open("customer-detail", t.customerId)}
        >
          {c?.name}
        </button>,
        <Status key="p" value={t.priority} />,
        <Status key="s" value={t.status} />,
        dateLabel(t.date),
        <label key="a">
          <span className="sr-only">Status for {t.subject}</span>
          <select
            className="inline-select"
            value={t.status}
            disabled={busy}
            onChange={(e) =>
              void run("ticket.status", { id: t.id, status: e.target.value })
            }
          >
            {["Open", "In progress", "Resolved"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>,
      ],
    };
  });
  return (
    <>
      <div className="metrics-grid compact">
        <Metric
          label="Open conversations"
          value={number(db.tickets.filter((t) => t.status === "Open").length)}
          icon="support"
          foot="A chance to make someone’s day"
        />
        <Metric
          label="In progress"
          value={number(
            db.tickets.filter((t) => t.status === "In progress").length,
          )}
          icon="clock"
          index={1}
          foot="Your team is on it"
        />
        <Metric
          label="Resolved"
          value={number(
            db.tickets.filter((t) => t.status === "Resolved").length,
          )}
          icon="check"
          index={2}
          foot="Customers with an answer"
        />
        <Metric
          label="High priority"
          value={number(
            db.tickets.filter(
              (t) => t.priority === "High" && t.status !== "Resolved",
            ).length,
          )}
          icon="target"
          index={3}
          foot="Unresolved tickets needing attention"
        />
      </div>
      <DataTable
        columns={[
          "Subject",
          "Customer",
          "Priority",
          "Status",
          "Created",
          "Actions",
        ]}
        rows={rows}
        label="tickets"
        filters={["Open", "In progress", "Resolved"]}
        searchPlaceholder="Search conversations or customers..."
      />
    </>
  );
}
function Team() {
  const { db, currency } = useRetail();
  return (
    <>
      <div className="info-banner">
        <span className="notice-icon green">
          <RIcon name="customers" />
        </span>
        <span>
          <strong>A shared view of the work that matters.</strong>
          <small>
            Customer ownership, open opportunities, and team tasks are connected
            in one workspace. These are sample team profiles.
          </small>
        </span>
      </div>
      <div className="team-grid">
        {owners.map((owner, i) => {
          const tasks = db.tasks.filter((t) => t.owner === owner),
            complete = tasks.filter((t) => t.status === "Done").length,
            deals = db.deals.filter(
              (d) => d.owner === owner && d.stage !== "Won",
            );
          return (
            <article className="r-panel team-card" key={owner}>
              <div className={`team-cover team-cover-${i}`} />
              <PersonAvatar name={owner} size="large" index={i} />
              <h2>{owner}</h2>
              <p>
                {
                  [
                    "Workspace admin",
                    "Customer success",
                    "Retail sales",
                    "Store operations",
                  ][i]
                }
              </p>
              <span className="team-email">
                {owner.toLowerCase().replace(" ", ".")}@arretail.example
              </span>
              <div className="team-stat-grid">
                <div>
                  <strong>
                    {db.customers.filter((c) => c.owner === owner).length}
                  </strong>
                  <small>Customers</small>
                </div>
                <div>
                  <strong>
                    {tasks.filter((t) => t.status !== "Done").length}
                  </strong>
                  <small>Open tasks</small>
                </div>
                <div>
                  <strong>{deals.length}</strong>
                  <small>Open deals</small>
                </div>
              </div>
              <div className="team-pipeline">
                <span>Open pipeline</span>
                <strong>
                  {money(
                    deals.reduce((s, d) => s + d.value, 0),
                    currency,
                  )}
                </strong>
              </div>
              <div className="team-completion">
                <span>Task completion</span>
                <strong>
                  {tasks.length
                    ? Math.round((complete / tasks.length) * 100)
                    : 0}
                  %
                </strong>
                <div>
                  <i
                    style={{
                      width: `${tasks.length ? (complete / tasks.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
function Settings() {
  const { db, run, busy } = useRetail(),
    [lowStock, setLowStock] = useState(db.settings.lowStockAlerts),
    [orderAlerts, setOrderAlerts] = useState(db.settings.orderAlerts);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await run("settings.save", {
      company: String(f.get("company")),
      email: String(f.get("email")),
      monthlyGoal: Number(f.get("monthlyGoal")),
      lowStockAlerts: lowStock,
      orderAlerts,
    });
  };
  return (
    <div className="settings-grid">
      <form className="r-panel settings-form" onSubmit={submit}>
        <PanelHeader
          title="Workspace details"
          sub="The home for your retail business."
        />
        <div className="settings-body">
          <div className="workspace-identity">
            <span className="brand-symbol">
              <i />
              <i />
              <i />
            </span>
            <div>
              <strong>AR CRM</strong>
              <small>Your retail relationship workspace</small>
            </div>
          </div>
          <label className="form-field">
            <span>Company name</span>
            <input
              name="company"
              required
              defaultValue={db.settings.company}
              maxLength={100}
            />
          </label>
          <label className="form-field">
            <span>Contact email</span>
            <input
              name="email"
              type="email"
              required
              defaultValue={db.settings.email}
            />
          </label>
          <div className="form-columns">
            <label className="form-field">
              <span>Monthly revenue goal (USD)</span>
              <input
                name="monthlyGoal"
                type="number"
                min="1"
                step="0.01"
                required
                defaultValue={db.settings.monthlyGoal}
              />
            </label>
            <label className="form-field">
              <span>Workspace currency</span>
              <input value="USD — US Dollar" readOnly />
            </label>
          </div>
          <h3>Notifications</h3>
          <div className="settings-toggle-row">
            <span>
              <strong>Inventory alerts</strong>
              <small>Show products that need a restock.</small>
            </span>
            <button
              type="button"
              className={`toggle ${lowStock ? "on" : ""}`}
              role="switch"
              aria-checked={lowStock}
              aria-label="Inventory alerts"
              onClick={() => setLowStock(!lowStock)}
            >
              <span />
            </button>
          </div>
          <div className="settings-toggle-row">
            <span>
              <strong>Order alerts</strong>
              <small>Keep orders waiting for fulfillment in view.</small>
            </span>
            <button
              type="button"
              className={`toggle ${orderAlerts ? "on" : ""}`}
              role="switch"
              aria-checked={orderAlerts}
              aria-label="Order alerts"
              onClick={() => setOrderAlerts(!orderAlerts)}
            >
              <span />
            </button>
          </div>
        </div>
        <div className="settings-form-footer">
          <span>Changes apply to this workspace.</span>
          <button className="r-button primary" type="submit" disabled={busy}>
            {busy ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
      <div className="settings-side">
        <section className="r-panel">
          <PanelHeader
            title="Your profile"
            sub="The person behind the workspace."
          />
          <div className="settings-profile">
            <PersonAvatar name="Alex Morgan" size="large" />
            <h3>Alex Morgan</h3>
            <p>Workspace administrator</p>
            <span className="status status-green">
              <i />
              Sample account
            </span>
          </div>
        </section>
        <section className="r-panel">
          <PanelHeader title="Workspace information" />
          <div className="workspace-facts">
            <div>
              <span>Language</span>
              <strong>English</strong>
            </div>
            <div>
              <span>Data storage</span>
              <strong>Local JSON</strong>
            </div>
            <div>
              <span>Email & SMS</span>
              <strong>Not connected</strong>
            </div>
            <div>
              <span>Reference date</span>
              <strong>{dateLabel(db.referenceDate)}</strong>
            </div>
            <div>
              <span>Version</span>
              <strong>AR CRM 2.0</strong>
            </div>
          </div>
          <div className="report-definition">
            <RIcon name="shield" size={18} />
            <p>
              This local workspace uses sample data without sign-in. Connect
              authentication, a production database, and messaging providers
              before using it with a live team.
            </p>
          </div>
        </section>
        <Link href="/automations" className="settings-tip">
          <RIcon name="automation" size={24} />
          <span>
            <strong>Make room for better work.</strong>
            <small>Explore your retail automations.</small>
          </span>
          <RIcon name="arrow" size={17} />
        </Link>
      </div>
    </div>
  );
}
