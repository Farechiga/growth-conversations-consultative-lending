"use server";

/*
 * Sprint 4.6 Block C — Compliance scan telemetry server action.
 *
 * Captures a single ComplianceScanEvent for each scan firing across any
 * [FL:BANKER-PROSE] field. Per COMPLIANCE.md §7.4 and Sprint 4.6 §C.5,
 * Pilot will calibrate the keyword list against this telemetry; demo
 * accumulates rows but doesn't surface them.
 *
 * The action is intentionally lightweight — no transaction, no
 * revalidatePath. The scan event is informational, not state-changing
 * for any banker-visible surface. Failures should not block the
 * underlying capture save; callers fire-and-forget.
 */

import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { getDbPath } from "./db-path";
import type { MatchedTerm } from "./compliance-keywords";

function getPrisma() {
  return new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: getDbPath() }),
  });
}

export type RecordComplianceScanEventInput = {
  banker_id: string;
  field_name: string; // e.g., "Resolve.customer_response"
  matched_terms: MatchedTerm[];
  banker_action: "continued" | "edited" | "cancelled";
  member_id: string | null;
};

export async function recordComplianceScanEvent(
  input: RecordComplianceScanEventInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.matched_terms.length === 0) return { ok: true };
  const prisma = getPrisma();
  try {
    await prisma.complianceScanEvent.create({
      data: {
        banker_id: input.banker_id,
        field_name: input.field_name,
        matched_terms: input.matched_terms,
        banker_action: input.banker_action,
        member_id: input.member_id,
      },
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Telemetry write failed.";
    return { ok: false, error: msg };
  } finally {
    await prisma.$disconnect();
  }
}
