import type { Metadata } from "next";
import "./globals.css";
import { RetailShell } from "@/components/retail-shell";
import { readRetail } from "@/lib/retail-db";
export const metadata: Metadata = {
  title: { default: "AR CRM — Retail, connected.", template: "%s | AR CRM" },
  description:
    "Customer relationships, retail operations, and your next great opportunity. Together in AR CRM.",
  icons: { icon: "/icon.svg" },
};
export const dynamic = "force-dynamic";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <RetailShell initialDB={readRetail()}>{children}</RetailShell>
      </body>
    </html>
  );
}
