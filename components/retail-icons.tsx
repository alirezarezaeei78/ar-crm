const paths: Record<string, string> = {
  overview: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  customers:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  orders: "M6 7h12l2 14H4L6 7ZM9 7V5a3 3 0 0 1 6 0v2",
  products: "m12 3 9 5-9 5-9-5 9-5ZM3 8v9l9 5 9-5V8M12 13v9M7.5 5.5l9 5",
  inventory: "M3 21V8l9-5 9 5v13M3 21h18M7 21V11h10v10M7 15h10M7 18h10",
  pipeline: "M3 5h5v14H3zM10 5h5v9h-5zM17 5h5v12h-5z",
  campaigns: "m3 11 18-7v16L3 13v-2ZM7 14l2 7h4l-2-6M17 6v12",
  tasks: "M9 4h6l1 2h4v15H4V6h4l1-2ZM9 4v4h6V4M8 14l3 3 5-6",
  reports: "M3 3v18h18M7 16v-5M12 16V6M17 16V9",
  segments:
    "M12 3v9l7.8 4.5A9 9 0 1 1 12 3ZM16 2.8a9 9 0 0 1 6 10.4L16 10V2.8Z",
  automation: "m13 2-9 12h7l-1 8 10-12h-8l1-8Z",
  support:
    "M3 13v-1a9 9 0 0 1 18 0v1M3 12h3v7H3v-7ZM18 12h3v7h-3v-7ZM21 19c0 3-4 3-7 3",
  settings:
    "M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1 1-3ZM15.5 12a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z",
  search: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
  plus: "M12 5v14M5 12h14",
  down: "m7 10 5 5 5-5",
  right: "m9 5 7 7-7 7",
  left: "m15 5-7 7 7 7",
  close: "m6 6 12 12M6 18 18 6",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
  help: "M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4M12 17h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  store:
    "M3 9 5 3h14l2 6M3 9c0 3 4.5 4 4.5 0 0 4 4.5 4 4.5 0 0 4 4.5 4 4.5 0 0 4 4.5 3 4.5 0M5 12v9h14v-9M9 21v-6h6v6",
  calendar:
    "M7 2v4M17 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
  export: "M12 3v12m-4-4 4 4 4-4M4 15v6h16v-6",
  trend: "m3 17 6-6 4 4 8-9M15 6h6v6",
  arrow: "M5 12h14m-5-5 5 5-5 5",
  check: "m5 12 4 4L19 6",
  clock: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  filter: "M4 7h16M7 12h10M10 17h4",
  dollar: "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  bag: "M5 7h14l1 14H4L5 7ZM9 7V5a3 3 0 0 1 6 0v2",
  target:
    "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0ZM12 11v2",
  repeat:
    "m17 2 4 4-4 4M3 11V8a2 2 0 0 1 2-2h16M7 22l-4-4 4-4M21 13v3a2 2 0 0 1-2 2H3",
  mail: "M3 5h18v14H3V5Zm0 0 9 8 9-8",
  phone:
    "M6 3h3l2 5-3 2c2 3 3 4 6 6l2-3 5 2v3c0 2-2 3-4 2C9 19 5 15 3 7c-1-2 0-4 3-4Z",
  pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  star: "m12 2 3 6.5 7 1-5 5 1.2 7L12 18l-6.2 3.5L7 14.5l-5-5 7-1L12 2Z",
  menu: "M4 6h16M4 12h16M4 18h16",
  globe:
    "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z",
  shield: "m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6",
};
export function RIcon({
  name,
  size = 19,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.overview} />
    </svg>
  );
}
