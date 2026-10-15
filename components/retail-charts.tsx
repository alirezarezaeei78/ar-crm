"use client";
import { useState } from "react";
import { money, number } from "@/lib/retail-types";
import type { Order } from "@/lib/retail-types";

function curve(points: [number, number][]) {
  return points
    .map((p, i) => {
      if (!i) return `M${p[0]},${p[1]}`;
      const prev = points[i - 1],
        before = points[i - 2] || prev,
        after = points[i + 1] || p;
      return `C${prev[0] + (p[0] - before[0]) / 6},${prev[1] + (p[1] - before[1]) / 6} ${p[0] - (after[0] - prev[0]) / 6},${p[1] - (after[1] - prev[1]) / 6} ${p[0]},${p[1]}`;
    })
    .join(" ");
}
export function RevenueChart({
  current,
  previous,
  days,
  start,
  currency,
}: {
  current: Order[];
  previous: Order[];
  days: number;
  start: number;
  currency: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const buckets = Math.min(days, 15);
  const totals = (orders: Order[], previousPeriod = false) =>
    Array.from({ length: buckets }, (_, i) =>
      orders
        .filter((o) => {
          const offset =
            Date.parse(o.date) - start + (previousPeriod ? days * 86400000 : 0);
          return (
            Math.min(
              buckets - 1,
              Math.floor(offset / ((days * 86400000) / buckets)),
            ) === i
          );
        })
        .reduce((s, o) => s + o.total, 0),
    );
  const data = totals(current),
    prior = totals(previous, true);
  const max = Math.max(
    1000,
    Math.ceil(Math.max(...data, ...prior) / 1000) * 1000,
  );
  const x = (i: number) => 55 + i * (640 / (buckets - 1));
  const y = (value: number) => 202 - (value / max) * 175;
  const line = curve(data.map((v, i) => [x(i), y(v)]));
  return (
    <div className="revenue-chart">
      <svg
        viewBox="0 0 720 250"
        role="img"
        aria-label="Revenue by day compared with the previous period"
      >
        <defs>
          <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f36e43" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#f36e43" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <line
              x1="55"
              y1={27 + i * 43.75}
              x2="695"
              y2={27 + i * 43.75}
              stroke="#edf0f2"
              strokeDasharray="4 4"
            />
            <text x="0" y={31 + i * 43.75} className="chart-label">
              {(max * (4 - i)) / 4 >= 1000
                ? `$${+((max * (4 - i)) / 4000).toFixed(1)}k`
                : `$${(max * (4 - i)) / 4}`}
            </text>
          </g>
        ))}
        <path
          d={curve(prior.map((v, i) => [x(i), y(v)]))}
          fill="none"
          stroke="#cbd0d6"
          strokeWidth="2"
          strokeDasharray="5 5"
        />
        <path d={`${line} L695,202 L55,202 Z`} fill="url(#revenue-fill)" />
        <path d={line} fill="none" stroke="#ed7047" strokeWidth="2.7" />
        {Array.from({ length: buckets }, (_, i) => i)
          .filter(
            (i) =>
              i % Math.max(1, Math.floor(buckets / 7)) === 0 ||
              i === buckets - 1,
          )
          .map((i) => (
            <text
              key={i}
              x={x(i)}
              y="233"
              textAnchor="middle"
              className="chart-label"
            >
              {new Date(
                start + ((i + 0.5) * days * 86400000) / buckets,
              ).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                timeZone: "UTC",
              })}
            </text>
          ))}
        {data.map((value, i) => (
          <g
            key={i}
            onMouseEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            tabIndex={0}
            aria-label={`Period ${i + 1}: ${money(value, currency)}`}
          >
            <rect
              x={x(i) - 20}
              y="15"
              width="40"
              height="190"
              fill="transparent"
              onMouseLeave={() => setHover(null)}
            />
            {hover === i && (
              <>
                <line
                  x1={x(i)}
                  x2={x(i)}
                  y1="25"
                  y2="202"
                  stroke="#ed7047"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={x(i)}
                  cy={y(value)}
                  r="5"
                  fill="#ed7047"
                  stroke="white"
                  strokeWidth="3"
                />
                <rect
                  x={Math.min(600, Math.max(55, x(i) - 48))}
                  y={Math.max(0, y(value) - 35)}
                  width="90"
                  height="25"
                  rx="6"
                  fill="#242c31"
                />
                <text
                  x={Math.min(645, Math.max(100, x(i) - 3))}
                  y={Math.max(16, y(value) - 18)}
                  textAnchor="middle"
                  fill="white"
                  fontSize="11"
                >
                  {money(value, currency)}
                </text>
              </>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
export function ChannelChart({
  orders,
  currency,
}: {
  orders: Order[];
  currency: string;
}) {
  const channels = ["Online", "In-store", "Social"];
  const colors = ["#ef754c", "#f9b69b", "#ede9e6"];
  const total = orders.reduce((s, o) => s + o.total, 0);
  let offset = 0;
  return (
    <div className="channel-chart">
      <div className="donut-wrap">
        <svg
          viewBox="0 0 180 180"
          role="img"
          aria-label="Revenue by sales channel"
        >
          <circle
            cx="90"
            cy="90"
            r="69"
            fill="none"
            stroke="#f3f4f5"
            strokeWidth="22"
          />
          {channels.map((channel, i) => {
            const value = orders
                .filter((o) => o.channel === channel)
                .reduce((s, o) => s + o.total, 0),
              length = total ? (value / total) * 433.54 : 0;
            const element = (
              <circle
                key={channel}
                cx="90"
                cy="90"
                r="69"
                fill="none"
                stroke={colors[i]}
                strokeWidth="22"
                strokeDasharray={`${Math.max(0, length - (length ? 5 : 0))} ${433.54 - Math.max(0, length - (length ? 5 : 0))}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 90 90)"
              />
            );
            offset += length;
            return element;
          })}
          <text x="90" y="84" textAnchor="middle" fill="#888d94" fontSize="11">
            Total revenue
          </text>
          <text
            x="90"
            y="108"
            textAnchor="middle"
            fill="#23292f"
            fontSize="21"
            fontWeight="600"
          >
            {total >= 1000
              ? `${money(total / 1000, currency)}k`
              : money(total, currency)}
          </text>
        </svg>
      </div>
      <div className="channel-legend">
        {channels.map((c, i) => {
          const value = orders
            .filter((o) => o.channel === c)
            .reduce((s, o) => s + o.total, 0);
          return (
            <div key={c}>
              <span>
                <i style={{ background: colors[i] }} />
                {c === "Online"
                  ? "Online store"
                  : c === "In-store"
                    ? "Retail stores"
                    : "Social commerce"}
              </span>
              <strong>{total ? Math.round((value / total) * 100) : 0}%</strong>
              <span>{money(value, currency)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
export function Sparkline({
  values,
  tone = "orange",
}: {
  values: number[];
  tone?: string;
}) {
  const max = Math.max(1, ...values),
    min = Math.min(0, ...values);
  return (
    <svg
      viewBox="0 0 110 38"
      className={`sparkline ${tone}`}
      aria-hidden="true"
    >
      <path
        d={curve(
          values.map((v, i) => [
            (i * 110) / Math.max(1, values.length - 1),
            35 - ((v - min) / (max - min || 1)) * 28,
          ]),
        )}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}
