import "server-only";
import { readFileSync, writeFileSync, renameSync } from "node:fs";
import { join } from "node:path";
import type { RetailDB } from "./retail-types";
const path =
  process.env.AR_CRM_DATA_PATH || join(process.cwd(), "data", "retail.json");
export function readRetail(): RetailDB {
  return JSON.parse(readFileSync(path, "utf8"));
}
export function writeRetail(db: RetailDB) {
  const temporary = path + ".tmp";
  writeFileSync(temporary, JSON.stringify(db, null, 2), "utf8");
  renameSync(temporary, path);
}
