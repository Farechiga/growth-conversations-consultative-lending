-- Sprint 4.6 Block C — ComplianceScanEvent telemetry table.
--
-- Lightweight stand-in for the full immutable trace log (deferred per
-- Path C-modified to Pilot — see ARCHITECTURE_V2.md §11 and Q-039).
-- Each row records one submit-time scan event over a banker-prose
-- ([FL:BANKER-PROSE]) field: which field fired, which terms matched,
-- which Banker, what action they took (continued / edited / cancelled),
-- optionally which Member they were capturing for.

-- CreateTable
CREATE TABLE "ComplianceScanEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "occurred_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "banker_id" TEXT NOT NULL,
    "field_name" TEXT NOT NULL,
    "matched_terms" JSONB NOT NULL,
    "banker_action" TEXT NOT NULL,
    "member_id" TEXT,
    CONSTRAINT "ComplianceScanEvent_banker_id_fkey" FOREIGN KEY ("banker_id") REFERENCES "Banker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ComplianceScanEvent_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Member" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ComplianceScanEvent_banker_id_occurred_at_idx" ON "ComplianceScanEvent"("banker_id", "occurred_at");

-- CreateIndex
CREATE INDEX "ComplianceScanEvent_field_name_idx" ON "ComplianceScanEvent"("field_name");
