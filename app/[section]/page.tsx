import { notFound } from "next/navigation";
import { RetailWorkspace } from "@/components/retail-workspace";
const sections = [
  "customers",
  "orders",
  "products",
  "inventory",
  "pipeline",
  "campaigns",
  "segments",
  "automations",
  "support",
  "team",
];
export default async function Page({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!sections.includes(section)) notFound();
  return <RetailWorkspace section={section} />;
}
